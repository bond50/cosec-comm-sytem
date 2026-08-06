"use server";

import { AuditAction, CorrespondenceStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  type CorrespondenceReopenActionState,
  correspondenceReopenSchema,
  getCorrespondenceFieldErrors,
  getCorrespondenceReopenValuesFromFormData,
} from "@/features/correspondence/lib/correspondence.shared";
import { requireOrganizationPermission } from "@/features/auth/utils/require-organization-permission";
import {
  ForbiddenError,
  MissingOrganizationError,
  UnauthorizedError,
} from "@/features/auth/utils/auth-errors";
import { notifyCorrespondenceReopened } from "@/features/correspondence/lib/correspondence-notifications";

export async function reopenCorrespondenceAction(
  _previousState: CorrespondenceReopenActionState,
  formData: FormData,
): Promise<CorrespondenceReopenActionState> {
  const values = getCorrespondenceReopenValuesFromFormData(formData);

  const parsed = correspondenceReopenSchema.safeParse(values);
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
    const access = await requireOrganizationPermission("correspondence.close");
    organizationId = access.organization.id;
    actorUserId = access.userId;
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return {
        ok: false,
        message: "You must be signed in to reopen correspondence.",
        values: parsed.data,
      };
    }

    if (error instanceof MissingOrganizationError) {
      return {
        ok: false,
        message:
          "An active organization is required before reopening correspondence.",
        values: parsed.data,
      };
    }

    if (error instanceof ForbiddenError) {
      return {
        ok: false,
        message: "Your role cannot reopen correspondence in this organization.",
        values: parsed.data,
      };
    }

    return {
      ok: false,
      message: "We could not verify your reopen access right now.",
      values: parsed.data,
    };
  }

  const correspondence = await db.correspondence.findFirst({
    where: {
      id: parsed.data.correspondenceId,
      organizationId,
    },
    select: {
      id: true,
      referenceNumber: true,
      subject: true,
      status: true,
      assignedToDepartmentId: true,
      assignedToUserId: true,
      assignedToUser: {
        select: {
          id: true,
          email: true,
        },
      },
    },
  });

  if (!correspondence) {
    return {
      ok: false,
      message: "That correspondence record no longer exists.",
      values: parsed.data,
    };
  }

  if (
    correspondence.status !== CorrespondenceStatus.CLOSED &&
    correspondence.status !== CorrespondenceStatus.CANCELLED
  ) {
    return {
      ok: false,
      message: "Only closed or cancelled correspondence can be reopened.",
      fieldErrors: {
        status: ["Only closed or cancelled correspondence can be reopened."],
      },
      values: parsed.data,
    };
  }

  const reopenedAt = new Date(parsed.data.reopenedAt);

  await db.$transaction(async (tx) => {
    await tx.correspondence.update({
      where: {
        id: correspondence.id,
      },
      data: {
        status: CorrespondenceStatus.UNDER_REVIEW,
        closedAt: null,
      },
    });

    await tx.correspondenceMovement.create({
      data: {
        organizationId,
        correspondenceId: correspondence.id,
        fromDepartmentId: correspondence.assignedToDepartmentId,
        fromUserId: correspondence.assignedToUserId,
        toDepartmentId: null,
        toUserId: actorUserId,
        status: CorrespondenceStatus.UNDER_REVIEW,
        note: `Reopened correspondence ${correspondence.referenceNumber}. ${parsed.data.justification}`,
        createdByUserId: actorUserId,
        movedAt: reopenedAt,
      },
    });

    const auditLog = await tx.auditLog.create({
      data: {
        organizationId,
        actorUserId,
        entityType: "Correspondence",
        entityId: correspondence.id,
        action: AuditAction.UPDATE,
        message: `Reopened correspondence ${correspondence.referenceNumber}: ${correspondence.subject}`,
        correspondenceId: correspondence.id,
      },
      select: {
        id: true,
      },
    });

    await notifyCorrespondenceReopened({
      tx,
      organizationId,
      correspondenceId: correspondence.id,
      referenceNumber: correspondence.referenceNumber,
      actorUserId,
      auditLogId: auditLog.id,
      assignedToUserId: correspondence.assignedToUser?.id,
      assignedToUserEmail: correspondence.assignedToUser?.email,
      assignedToDepartmentId: correspondence.assignedToDepartmentId,
    });
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/correspondences");
  revalidatePath(`/dashboard/correspondences/${correspondence.id}`);

  return {
    ok: true,
    message: "Correspondence reopened for review.",
    values: {
      ...parsed.data,
      reopenedAt: parsed.data.reopenedAt,
      status: CorrespondenceStatus.UNDER_REVIEW,
    },
    data: {
      correspondenceId: correspondence.id,
      organizationId,
    },
  };
}
