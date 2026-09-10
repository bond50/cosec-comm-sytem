"use server";

import {
  AuditAction,
  CorrespondenceStatus,
  DispatchStatus,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  type CorrespondenceDispatchActionState,
  correspondenceDispatchSchema,
  getCorrespondenceDispatchValuesFromFormData,
  getCorrespondenceFieldErrors,
} from "@/features/correspondence/lib/correspondence.shared";
import { requireOrganizationPermission } from "@/features/auth/utils/require-organization-permission";
import {
  ForbiddenError,
  MissingOrganizationError,
  UnauthorizedError,
} from "@/features/auth/utils/auth-errors";
import { notifyCorrespondenceDispatchIssued } from "@/features/correspondence/lib/correspondence-notifications";
import { formatUserLabel } from "@/features/application/lib/user-label";
import { isOpenDispatchStatus } from "@/features/correspondence/lib/correspondence-dispatch-status";

const ROUTABLE_CORRESPONDENCE_STATUSES = [
  CorrespondenceStatus.DISPATCHED,
  CorrespondenceStatus.IN_PROGRESS,
  CorrespondenceStatus.AWAITING_FEEDBACK,
] as const;

export async function createDispatchAction(
  _previousState: CorrespondenceDispatchActionState,
  formData: FormData,
): Promise<CorrespondenceDispatchActionState> {
  const values = getCorrespondenceDispatchValuesFromFormData(formData);

  const parsed = correspondenceDispatchSchema.safeParse(values);
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
    const access = await requireOrganizationPermission(
      "correspondence.dispatch",
    );
    organizationId = access.organization.id;
    actorUserId = access.userId;
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return {
        ok: false,
        message: "You must be signed in to dispatch correspondence.",
        values: parsed.data,
      };
    }

    if (error instanceof MissingOrganizationError) {
      return {
        ok: false,
        message:
          "An active organization is required before dispatching correspondence.",
        values: parsed.data,
      };
    }

    if (error instanceof ForbiddenError) {
      return {
        ok: false,
        message:
          "Your role cannot issue central-office dispatches in this organization.",
        values: parsed.data,
      };
    }

    return {
      ok: false,
      message:
        "We could not verify your central-office dispatch access right now.",
      values: parsed.data,
    };
  }

  const [correspondence, targetDepartment, targetUser] = await Promise.all([
    db.correspondence.findFirst({
      where: {
        id: parsed.data.correspondenceId,
        organizationId,
      },
      select: {
        id: true,
        referenceNumber: true,
        subject: true,
        status: true,
        dueDate: true,
        dispatches: {
          select: {
            id: true,
            status: true,
            dispatchedToDepartmentId: true,
          },
        },
      },
    }),
    db.department.findFirst({
      where: {
        id: parsed.data.departmentId,
        organizationId,
        status: "ACTIVE",
      },
      select: {
        id: true,
        name: true,
      },
    }),
    parsed.data.userId
      ? db.user.findFirst({
          where: { id: parsed.data.userId },
          select: {
            id: true,
            name: true,
            email: true,
            designation: true,
          },
        })
      : Promise.resolve(null),
  ]);

  if (!correspondence) {
    return {
      ok: false,
      message: "That correspondence record no longer exists.",
      values: parsed.data,
    };
  }

  if (
    !ROUTABLE_CORRESPONDENCE_STATUSES.includes(
      correspondence.status as (typeof ROUTABLE_CORRESPONDENCE_STATUSES)[number],
    )
  ) {
    return {
      ok: false,
      message:
        "A dispatch record can only be created after the central office has made a routing decision and marked the item as dispatched.",
      fieldErrors: {
        correspondenceId: [
          "Create the central-office routing decision before dispatch.",
        ],
      },
      values: parsed.data,
    };
  }

  if (!targetDepartment) {
    return {
      ok: false,
      message:
        "The selected department must be active and belong to the current organization.",
      fieldErrors: {
        departmentId: [
          "The selected department must be active and belong to the current organization.",
        ],
      },
      values: parsed.data,
    };
  }

  if (!correspondence.dueDate) {
    return {
      ok: false,
      message:
        "Set a due date before creating the central-office dispatch record.",
      fieldErrors: {
        correspondenceId: ["Due date is required before dispatch."],
      },
      values: parsed.data,
    };
  }

  if (parsed.data.userId) {
    const membership = await db.organizationMembership.findFirst({
      where: {
        organizationId,
        userId: parsed.data.userId,
        departmentId: parsed.data.departmentId,
        status: "ACTIVE",
      },
      select: { userId: true },
    });

    if (!membership) {
      return {
        ok: false,
        message:
          "The selected user must be an active member of the chosen department.",
        fieldErrors: {
          userId: [
            "The selected user must be an active member of the chosen department.",
          ],
        },
        values: parsed.data,
      };
    }
  }

  const departmentAlreadyOpen = correspondence.dispatches.some(
    (d) =>
      d.dispatchedToDepartmentId === parsed.data.departmentId &&
      isOpenDispatchStatus(d.status),
  );

  if (departmentAlreadyOpen) {
    return {
      ok: false,
      message:
        "This correspondence already has an open dispatch record for that department awaiting acknowledgement or feedback.",
      fieldErrors: {
        departmentId: [
          "This department already has an open dispatch for this correspondence.",
        ],
      },
      values: parsed.data,
    };
  }

  const dispatchDate = new Date(parsed.data.dispatchDate);
  const dispatchNote =
    parsed.data.note?.trim() ||
    `Central office dispatch sent to ${targetDepartment.name}${
      targetUser
        ? ` and ${formatUserLabel(targetUser, "the selected user")}`
        : ""
    }.`;

  const dispatch = await db.$transaction(async (tx) => {
    const createdDispatch = await tx.correspondenceDispatch.create({
      data: {
        organizationId,
        correspondenceId: correspondence.id,
        dispatchedToDepartmentId: targetDepartment.id,
        dispatchedToUserId: targetUser?.id ?? null,
        dispatchDate,
        note: dispatchNote,
        status: DispatchStatus.SENT,
        createdByUserId: actorUserId,
      },
      select: {
        id: true,
      },
    });

    await tx.correspondenceMovement.create({
      data: {
        organizationId,
        correspondenceId: correspondence.id,
        fromDepartmentId: null,
        fromUserId: actorUserId,
        toDepartmentId: targetDepartment.id,
        toUserId: targetUser?.id ?? null,
        status: CorrespondenceStatus.DISPATCHED,
        note: `Routed correspondence ${correspondence.referenceNumber} to an additional department: ${targetDepartment.name}.`,
        createdByUserId: actorUserId,
      },
    });

    const auditLog = await tx.auditLog.create({
      data: {
        organizationId,
        actorUserId,
        entityType: "CorrespondenceDispatch",
        entityId: createdDispatch.id,
        action: AuditAction.DISPATCH,
        message: `Created central-office dispatch record for correspondence ${correspondence.referenceNumber}: ${correspondence.subject}`,
        correspondenceId: correspondence.id,
      },
      select: {
        id: true,
      },
    });

    await notifyCorrespondenceDispatchIssued({
      tx,
      organizationId,
      correspondenceId: correspondence.id,
      referenceNumber: correspondence.referenceNumber,
      actorUserId,
      auditLogId: auditLog.id,
      dispatchedToUserId: targetUser?.id,
      dispatchedToUserEmail: targetUser?.email,
      dispatchedToDepartmentId: targetDepartment.id,
      departmentName: targetDepartment.name,
      dueDateLabel: new Intl.DateTimeFormat("en-KE", {
        dateStyle: "medium",
      }).format(correspondence.dueDate ?? undefined),
    });

    await tx.correspondence.update({
      where: { id: correspondence.id },
      data: { status: CorrespondenceStatus.DISPATCHED },
    });

    return createdDispatch;
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/correspondences");
  revalidatePath(`/dashboard/correspondences/${correspondence.id}`);

  return {
    ok: true,
    message: `Correspondence routed to ${targetDepartment.name} successfully.`,
    values: {
      ...parsed.data,
      dispatchDate: parsed.data.dispatchDate,
      status: DispatchStatus.SENT,
    },
    data: {
      correspondenceId: correspondence.id,
      dispatchId: dispatch.id,
      organizationId,
    },
  };
}
