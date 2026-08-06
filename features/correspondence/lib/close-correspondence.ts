"use server";

import {
  AuditAction,
  CorrespondenceStatus,
  DispatchStatus,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  type CorrespondenceCloseActionState,
  correspondenceCloseSchema,
  getCorrespondenceCloseValuesFromFormData,
  getCorrespondenceFieldErrors,
} from "@/features/correspondence/lib/correspondence.shared";
import { requireOrganizationPermission } from "@/features/auth/utils/require-organization-permission";
import {
  ForbiddenError,
  MissingOrganizationError,
  UnauthorizedError,
} from "@/features/auth/utils/auth-errors";
import { notifyCorrespondenceFinalized } from "@/features/correspondence/lib/correspondence-notifications";

const FINAL_CORRESPONDENCE_STATUSES = [
  CorrespondenceStatus.CANCELLED,
  CorrespondenceStatus.CLOSED,
] as const;

function isFinalCorrespondenceStatus(
  status: CorrespondenceStatus,
): status is (typeof FINAL_CORRESPONDENCE_STATUSES)[number] {
  return FINAL_CORRESPONDENCE_STATUSES.includes(
    status as (typeof FINAL_CORRESPONDENCE_STATUSES)[number],
  );
}

export async function closeCorrespondenceAction(
  _previousState: CorrespondenceCloseActionState,
  formData: FormData,
): Promise<CorrespondenceCloseActionState> {
  const values = getCorrespondenceCloseValuesFromFormData(formData);

  const parsed = correspondenceCloseSchema.safeParse(values);
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
        message: "You must be signed in to close correspondence.",
        values: parsed.data,
      };
    }

    if (error instanceof MissingOrganizationError) {
      return {
        ok: false,
        message:
          "An active organization is required before closing correspondence.",
        values: parsed.data,
      };
    }

    if (error instanceof ForbiddenError) {
      return {
        ok: false,
        message:
          "Your role cannot close or cancel correspondence in this organization.",
        values: parsed.data,
      };
    }

    return {
      ok: false,
      message: "We could not verify your closure access right now.",
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

  if (isFinalCorrespondenceStatus(correspondence.status)) {
    return {
      ok: false,
      message:
        "This correspondence is already in a final state and cannot be finalized again.",
      fieldErrors: {
        status: [
          "This correspondence is already in a final state and cannot be finalized again.",
        ],
      },
      values: parsed.data,
    };
  }

  if (
    parsed.data.status === CorrespondenceStatus.CLOSED &&
    correspondence.status !== CorrespondenceStatus.AWAITING_FEEDBACK
  ) {
    return {
      ok: false,
      message:
        "Correspondence can only be closed after execution feedback has been returned for verification.",
      fieldErrors: {
        status: [
          "Return the item to the central office with feedback before closing it.",
        ],
      },
      values: parsed.data,
    };
  }

  const closedAt = new Date(parsed.data.closedAt);
  const targetStatus = parsed.data.status;
  const isCancelled = targetStatus === CorrespondenceStatus.CANCELLED;
  const notePrefix = isCancelled ? "Cancelled" : "Closed";

  await db.$transaction(async (tx) => {
    await tx.correspondence.update({
      where: {
        id: correspondence.id,
      },
      data: {
        status: targetStatus,
        closedAt,
      },
    });

    await tx.correspondenceDispatch.updateMany({
      where: {
        organizationId,
        correspondenceId: correspondence.id,
        status: {
          in: [
            DispatchStatus.SENT,
            DispatchStatus.ACKNOWLEDGED,
            DispatchStatus.IN_PROGRESS,
            DispatchStatus.FEEDBACK_RECEIVED,
            DispatchStatus.OVERDUE,
          ],
        },
      },
      data: {
        status: DispatchStatus.CLOSED,
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
        status: targetStatus,
        note: `${notePrefix} correspondence ${correspondence.referenceNumber}. ${parsed.data.closureNote}`,
        createdByUserId: actorUserId,
        movedAt: closedAt,
      },
    });

    const auditLog = await tx.auditLog.create({
      data: {
        organizationId,
        actorUserId,
        entityType: "Correspondence",
        entityId: correspondence.id,
        action: AuditAction.CLOSE,
        message: `${notePrefix} correspondence ${correspondence.referenceNumber}: ${correspondence.subject}`,
        correspondenceId: correspondence.id,
      },
      select: {
        id: true,
      },
    });

    await notifyCorrespondenceFinalized({
      tx,
      organizationId,
      correspondenceId: correspondence.id,
      referenceNumber: correspondence.referenceNumber,
      actorUserId,
      auditLogId: auditLog.id,
      assignedToUserId: correspondence.assignedToUser?.id,
      assignedToUserEmail: correspondence.assignedToUser?.email,
      assignedToDepartmentId: correspondence.assignedToDepartmentId,
      finalStatus: isCancelled ? "cancelled" : "closed",
    });
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/correspondences");
  revalidatePath(`/dashboard/correspondences/${correspondence.id}`);

  return {
    ok: true,
    message: isCancelled
      ? "Correspondence cancelled successfully."
      : "Correspondence closed successfully.",
    values: {
      ...parsed.data,
      closedAt: parsed.data.closedAt,
    },
    data: {
      correspondenceId: correspondence.id,
      organizationId,
    },
  };
}
