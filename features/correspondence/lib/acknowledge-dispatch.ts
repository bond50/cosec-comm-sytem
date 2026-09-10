"use server";

import { AuditAction, DispatchStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  type CorrespondenceDispatchAcknowledgeActionState,
  correspondenceDispatchAcknowledgeSchema,
  getCorrespondenceDispatchAcknowledgeValuesFromFormData,
  getCorrespondenceFieldErrors,
} from "@/features/correspondence/lib/correspondence.shared";
import { requireOrganizationPermission } from "@/features/auth/utils/require-organization-permission";
import {
  ForbiddenError,
  MissingOrganizationError,
  UnauthorizedError,
} from "@/features/auth/utils/auth-errors";
import { notifyCorrespondenceAcknowledged } from "@/features/correspondence/lib/correspondence-notifications";
import { formatUserLabel } from "@/features/application/lib/user-label";
import { computeAggregateCorrespondenceStatus } from "@/features/correspondence/lib/correspondence-dispatch-status";

export async function acknowledgeDispatchAction(
  _previousState: CorrespondenceDispatchAcknowledgeActionState,
  formData: FormData,
): Promise<CorrespondenceDispatchAcknowledgeActionState> {
  const values =
    getCorrespondenceDispatchAcknowledgeValuesFromFormData(formData);

  const parsed = correspondenceDispatchAcknowledgeSchema.safeParse(values);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please correct the highlighted fields.",
      fieldErrors: getCorrespondenceFieldErrors(parsed.error),
      values,
    };
  }

  let organizationId: string;
  let actorUserId: string;

  try {
    const access = await requireOrganizationPermission("correspondence.work");
    organizationId = access.organization.id;
    actorUserId = access.userId;
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return {
        ok: false,
        message: "You must be signed in to acknowledge a dispatch.",
        values: parsed.data,
      };
    }

    if (error instanceof MissingOrganizationError) {
      return {
        ok: false,
        message:
          "An active organization is required before acknowledging a dispatch.",
        values: parsed.data,
      };
    }

    if (error instanceof ForbiddenError) {
      return {
        ok: false,
        message:
          "Your role cannot work on dispatched correspondence in this organization.",
        values: parsed.data,
      };
    }

    return {
      ok: false,
      message: "We could not verify your dispatch access right now.",
      values: parsed.data,
    };
  }

  const acknowledgedByUserId = actorUserId;
  const [acknowledgerMembership, dispatch] = await Promise.all([
    db.organizationMembership.findFirst({
      where: {
        organizationId,
        userId: acknowledgedByUserId,
        status: "ACTIVE",
      },
      select: {
        userId: true,
        departmentId: true,
      },
    }),
    db.correspondenceDispatch.findFirst({
      where: {
        id: parsed.data.dispatchId,
        organizationId,
      },
      select: {
        id: true,
        correspondenceId: true,
        status: true,
        dispatchedToDepartmentId: true,
        dispatchedToDepartment: {
          select: {
            id: true,
            name: true,
          },
        },
        dispatchedToUserId: true,
        dispatchedToUser: {
          select: {
            id: true,
            name: true,
            email: true,
            designation: true,
          },
        },
        correspondence: {
          select: {
            id: true,
            referenceNumber: true,
            subject: true,
          },
        },
      },
    }),
  ]);

  if (!acknowledgerMembership) {
    return {
      ok: false,
      message:
        "Your membership in the current organization could not be verified.",
      values: parsed.data,
    };
  }

  if (!dispatch) {
    return {
      ok: false,
      message: "That dispatch record no longer exists.",
      values: parsed.data,
    };
  }

  if (
    dispatch.status !== DispatchStatus.SENT &&
    dispatch.status !== DispatchStatus.OVERDUE
  ) {
    return {
      ok: false,
      message: "Only a sent dispatch can be acknowledged.",
      values: parsed.data,
    };
  }

  const isDirectTarget = dispatch.dispatchedToUserId === acknowledgedByUserId;
  const isDepartmentTarget =
    !!dispatch.dispatchedToDepartmentId &&
    acknowledgerMembership.departmentId === dispatch.dispatchedToDepartmentId;

  if (!isDirectTarget && !isDepartmentTarget) {
    return {
      ok: false,
      message:
        "Only the receiving office or the direct receiving officer can confirm receipt for this dispatch.",
      values: parsed.data,
    };
  }

  const acknowledgedAt = new Date(parsed.data.acknowledgedAt);
  const noteTarget =
    formatUserLabel(dispatch.dispatchedToUser, null) ||
    dispatch.dispatchedToDepartment?.name ||
    "the receiving desk";

  await db.$transaction(async (tx) => {
    await tx.correspondenceDispatch.update({
      where: {
        id: dispatch.id,
      },
      data: {
        acknowledgedAt,
        acknowledgedByUserId,
        status: DispatchStatus.ACKNOWLEDGED,
      },
    });

    const siblingDispatches = await tx.correspondenceDispatch.findMany({
      where: { correspondenceId: dispatch.correspondence.id },
      select: { status: true },
    });
    const aggregateStatus = computeAggregateCorrespondenceStatus(
      siblingDispatches.map((d) => d.status),
    );

    await tx.correspondence.update({
      where: {
        id: dispatch.correspondence.id,
      },
      data: {
        status: aggregateStatus,
      },
    });

    await tx.correspondenceMovement.create({
      data: {
        organizationId,
        correspondenceId: dispatch.correspondence.id,
        fromDepartmentId: dispatch.dispatchedToDepartmentId,
        fromUserId: dispatch.dispatchedToUserId,
        toDepartmentId: dispatch.dispatchedToDepartmentId,
        toUserId: acknowledgedByUserId,
        status: aggregateStatus,
        note: `${noteTarget} acknowledged dispatch for correspondence ${dispatch.correspondence.referenceNumber}.`,
        createdByUserId: actorUserId,
      },
    });

    const auditLog = await tx.auditLog.create({
      data: {
        organizationId,
        actorUserId,
        entityType: "CorrespondenceDispatch",
        entityId: dispatch.id,
        action: AuditAction.ACKNOWLEDGE,
        message: `Acknowledged dispatch for correspondence ${dispatch.correspondence.referenceNumber}: ${dispatch.correspondence.subject}`,
        correspondenceId: dispatch.correspondence.id,
      },
      select: {
        id: true,
      },
    });

    await notifyCorrespondenceAcknowledged({
      tx,
      organizationId,
      correspondenceId: dispatch.correspondence.id,
      referenceNumber: dispatch.correspondence.referenceNumber,
      actorUserId,
      auditLogId: auditLog.id,
    });
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/correspondences");
  revalidatePath(`/dashboard/correspondences/${dispatch.correspondence.id}`);

  return {
    ok: true,
    message: "Dispatch acknowledged successfully.",
    values: {
      ...parsed.data,
      acknowledgedAt: parsed.data.acknowledgedAt,
      status: DispatchStatus.ACKNOWLEDGED,
    },
    data: {
      correspondenceId: dispatch.correspondence.id,
      dispatchId: dispatch.id,
      organizationId,
    },
  };
}
