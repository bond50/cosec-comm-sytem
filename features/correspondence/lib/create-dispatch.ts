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
      dueDate: true,
      assignedToDepartment: {
        select: {
          id: true,
          name: true,
          code: true,
          status: true,
        },
      },
      assignedToUser: {
        select: {
          id: true,
          name: true,
          email: true,
          designation: true,
          isActive: true,
        },
      },
      dispatches: {
        orderBy: [{ dispatchDate: "desc" }, { createdAt: "desc" }],
        take: 1,
        select: {
          id: true,
          status: true,
          feedbackReceivedAt: true,
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

  if (correspondence.status !== CorrespondenceStatus.DISPATCHED) {
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

  if (
    !correspondence.assignedToDepartmentId ||
    !correspondence.assignedToDepartment ||
    correspondence.assignedToDepartment.status !== "ACTIVE"
  ) {
    return {
      ok: false,
      message:
        "Set an active destination department before creating a dispatch record.",
      fieldErrors: {
        correspondenceId: [
          "The correspondence must have an active assigned department before dispatch.",
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

  const latestDispatch = correspondence.dispatches[0];
  if (
    latestDispatch &&
    latestDispatch.status !== DispatchStatus.CLOSED &&
    !latestDispatch.feedbackReceivedAt
  ) {
    return {
      ok: false,
      message:
        "This correspondence already has an open dispatch record awaiting acknowledgement or feedback.",
      values: parsed.data,
    };
  }

  const dispatchDate = new Date(parsed.data.dispatchDate);
  const dispatchNote =
    parsed.data.note?.trim() ||
    `Central office dispatch sent to ${correspondence.assignedToDepartment.name}${
      correspondence.assignedToUser
        ? ` and ${formatUserLabel(correspondence.assignedToUser, "the selected user")}`
        : ""
    }.`;

  const dispatch = await db.$transaction(async (tx) => {
    const createdDispatch = await tx.correspondenceDispatch.create({
      data: {
        organizationId,
        correspondenceId: correspondence.id,
        dispatchedToDepartmentId: correspondence.assignedToDepartmentId,
        dispatchedToUserId: correspondence.assignedToUserId,
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
        toDepartmentId: correspondence.assignedToDepartmentId,
        toUserId: correspondence.assignedToUserId,
        status: CorrespondenceStatus.DISPATCHED,
        note: `Created explicit central-office dispatch record for correspondence ${correspondence.referenceNumber}.`,
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
      dispatchedToUserId: correspondence.assignedToUser?.id,
      dispatchedToUserEmail: correspondence.assignedToUser?.email,
      dispatchedToDepartmentId: correspondence.assignedToDepartment?.id,
      departmentName: correspondence.assignedToDepartment?.name,
      dueDateLabel: new Intl.DateTimeFormat("en-KE", {
        dateStyle: "medium",
      }).format(correspondence.dueDate ?? undefined),
    });

    return createdDispatch;
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/correspondences");
  revalidatePath(`/dashboard/correspondences/${correspondence.id}`);

  return {
    ok: true,
    message: "Dispatch record created successfully.",
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
