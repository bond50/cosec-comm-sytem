"use server";

import {
  AuditAction,
  CorrespondenceStatus,
  DispatchStatus,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  type CorrespondenceDispatchFeedbackActionState,
  correspondenceDispatchFeedbackSchema,
  getCorrespondenceDispatchFeedbackValuesFromFormData,
  getCorrespondenceFieldErrors,
} from "@/features/correspondence/lib/correspondence.shared";
import { requireOrganizationPermission } from "@/features/auth/utils/require-organization-permission";
import {
  ForbiddenError,
  MissingOrganizationError,
  UnauthorizedError,
} from "@/features/auth/utils/auth-errors";
import { notifyCorrespondenceFeedbackReturned } from "@/features/correspondence/lib/correspondence-notifications";

export async function receiveDispatchFeedbackAction(
  _previousState: CorrespondenceDispatchFeedbackActionState,
  formData: FormData,
): Promise<CorrespondenceDispatchFeedbackActionState> {
  const values = getCorrespondenceDispatchFeedbackValuesFromFormData(formData);

  const parsed = correspondenceDispatchFeedbackSchema.safeParse(values);
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
        message: "You must be signed in to record dispatch feedback.",
        values: parsed.data,
      };
    }

    if (error instanceof MissingOrganizationError) {
      return {
        ok: false,
        message:
          "An active organization is required before recording dispatch feedback.",
        values: parsed.data,
      };
    }

    if (error instanceof ForbiddenError) {
      return {
        ok: false,
        message:
          "Your role cannot submit dispatch feedback in this organization.",
        values: parsed.data,
      };
    }

    return {
      ok: false,
      message: "We could not verify your dispatch access right now.",
      values: parsed.data,
    };
  }

  const dispatch = await db.correspondenceDispatch.findFirst({
    where: {
      id: parsed.data.dispatchId,
      organizationId,
    },
    select: {
      id: true,
      correspondenceId: true,
      status: true,
      acknowledgedAt: true,
      dispatchedToDepartmentId: true,
      dispatchedToUserId: true,
      dispatchedToDepartment: {
        select: {
          id: true,
          name: true,
        },
      },
      dispatchedToUser: {
        select: {
          id: true,
          name: true,
          email: true,
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
  });

  if (!dispatch) {
    return {
      ok: false,
      message: "That dispatch record no longer exists.",
      values: parsed.data,
    };
  }

  if (
    dispatch.status !== DispatchStatus.ACKNOWLEDGED &&
    dispatch.status !== DispatchStatus.IN_PROGRESS &&
    dispatch.status !== DispatchStatus.FEEDBACK_RECEIVED
  ) {
    return {
      ok: false,
      message:
        "Feedback can only be recorded after the receiving office has acknowledged the dispatch or after earlier feedback has already been returned.",
      values: parsed.data,
    };
  }

  if (!dispatch.acknowledgedAt) {
    return {
      ok: false,
      message:
        "The receiving office must acknowledge the dispatch before feedback can be recorded.",
      values: parsed.data,
    };
  }

  const actorMembership = await db.organizationMembership.findFirst({
    where: {
      organizationId,
      userId: actorUserId,
      status: "ACTIVE",
    },
    select: {
      userId: true,
      departmentId: true,
    },
  });

  if (!actorMembership) {
    return {
      ok: false,
      message:
        "The feedback actor must be an active member of the current organization.",
      values: parsed.data,
    };
  }

  const isDirectTarget = dispatch.dispatchedToUserId === actorUserId;
  const isDepartmentTarget =
    !!dispatch.dispatchedToDepartmentId &&
    actorMembership.departmentId === dispatch.dispatchedToDepartmentId;

  if (!isDirectTarget && !isDepartmentTarget) {
    return {
      ok: false,
      message:
        "Only the receiving office or the direct receiving officer can record feedback for this dispatch.",
      values: parsed.data,
    };
  }

  const feedbackReceivedAt = new Date();
  const feedbackNote = parsed.data.feedbackNote.trim();

  await db.$transaction(async (tx) => {
    await tx.correspondenceDispatch.update({
      where: {
        id: dispatch.id,
      },
      data: {
        feedbackReceivedAt,
        feedbackNote,
        status: DispatchStatus.FEEDBACK_RECEIVED,
      },
    });

    await tx.correspondence.update({
      where: {
        id: dispatch.correspondence.id,
      },
      data: {
        status: CorrespondenceStatus.AWAITING_FEEDBACK,
      },
    });

    await tx.correspondenceMovement.create({
      data: {
        organizationId,
        correspondenceId: dispatch.correspondence.id,
        fromDepartmentId: dispatch.dispatchedToDepartmentId,
        fromUserId: dispatch.dispatchedToUserId,
        toDepartmentId: null,
        toUserId: null,
        status: CorrespondenceStatus.AWAITING_FEEDBACK,
        note: feedbackNote,
        createdByUserId: actorUserId,
        movedAt: feedbackReceivedAt,
      },
    });

    const auditLog = await tx.auditLog.create({
      data: {
        organizationId,
        actorUserId,
        entityType: "CorrespondenceDispatch",
        entityId: dispatch.id,
        action: AuditAction.UPDATE,
        message: `Received execution feedback for correspondence ${dispatch.correspondence.referenceNumber}: ${dispatch.correspondence.subject}`,
        correspondenceId: dispatch.correspondence.id,
      },
      select: {
        id: true,
      },
    });

    await notifyCorrespondenceFeedbackReturned({
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
    message: "Execution feedback recorded successfully.",
    values: {
      ...parsed.data,
      status: DispatchStatus.FEEDBACK_RECEIVED,
    },
    data: {
      correspondenceId: dispatch.correspondence.id,
      dispatchId: dispatch.id,
      organizationId,
    },
  };
}
