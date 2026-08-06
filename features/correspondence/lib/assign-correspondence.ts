"use server";

import { AuditAction, CorrespondenceStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  type CorrespondenceAssignActionState,
  correspondenceAssignSchema,
  getCorrespondenceAssignValuesFromFormData,
  getCorrespondenceFieldErrors,
} from "@/features/correspondence/lib/correspondence.shared";
import { requireOrganizationPermission } from "@/features/auth/utils/require-organization-permission";
import { hasCountySecretaryAuthority } from "@/features/auth/utils/role-access";
import {
  ForbiddenError,
  MissingOrganizationError,
  UnauthorizedError,
} from "@/features/auth/utils/auth-errors";
import { notifyCorrespondenceRoutingRecorded } from "@/features/correspondence/lib/correspondence-notifications";

export async function assignCorrespondenceAction(
  _previousState: CorrespondenceAssignActionState,
  formData: FormData,
): Promise<CorrespondenceAssignActionState> {
  const values = getCorrespondenceAssignValuesFromFormData(formData);

  const parsed = correspondenceAssignSchema.safeParse(values);
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
        message: "You must be signed in to assign correspondence.",
        values: parsed.data,
      };
    }

    if (error instanceof MissingOrganizationError) {
      return {
        ok: false,
        message:
          "An active organization is required before assigning correspondence.",
        values: parsed.data,
      };
    }

    if (error instanceof ForbiddenError) {
      return {
        ok: false,
        message:
          "Your role cannot make central-office routing decisions in this organization.",
        values: parsed.data,
      };
    }

    return {
      ok: false,
      message:
        "We could not verify your central-office routing access right now.",
      values: parsed.data,
    };
  }

  const assignedByUserId = parsed.data.assignedByUserId ?? actorUserId;

  const [assignerMembership, department, correspondence, assigneeUser] =
    await Promise.all([
      db.organizationMembership.findFirst({
        where: {
          organizationId,
          userId: assignedByUserId,
          status: "ACTIVE",
        },
        select: {
          userId: true,
          roles: true,
        },
      }),
      db.department.findFirst({
        where: {
          id: parsed.data.assignedToDepartmentId,
          organizationId,
          status: "ACTIVE",
        },
        select: {
          id: true,
          name: true,
        },
      }),
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
          assignedToDepartmentId: true,
          assignedToUserId: true,
          reviewedByUserId: true,
        },
      }),
      parsed.data.assignedToUserId
        ? db.user.findFirst({
            where: {
              id: parsed.data.assignedToUserId,
            },
            select: {
              id: true,
              name: true,
              email: true,
            },
          })
        : Promise.resolve(null),
    ]);

  if (!assignerMembership) {
    return {
      ok: false,
      message:
        "The assigning user must be an active member of the current organization.",
      fieldErrors: {
        assignedByUserId: [
          "The assigning user must be an active member of the current organization.",
        ],
      },
      values: parsed.data,
    };
  }

  if (!hasCountySecretaryAuthority(assignerMembership.roles)) {
    return {
      ok: false,
      message:
        "Only the County Secretary authority path can record a routing decision for correspondence.",
      fieldErrors: {
        assignedByUserId: [
          "Choose an assigning user from the Reviewing Officer / Management authority path.",
        ],
      },
      values: parsed.data,
    };
  }

  if (!department) {
    return {
      ok: false,
      message:
        "The selected department must be active and belong to the current organization.",
      fieldErrors: {
        assignedToDepartmentId: [
          "The selected department must be active and belong to the current organization.",
        ],
      },
      values: parsed.data,
    };
  }

  if (!correspondence) {
    return {
      ok: false,
      message: "That correspondence record no longer exists.",
      values: parsed.data,
    };
  }

  if (correspondence.status !== CorrespondenceStatus.UNDER_REVIEW) {
    return {
      ok: false,
      message:
        "Only correspondence under review can move from central-office review into dispatch.",
      fieldErrors: {
        status: ["Only correspondence under review can move into dispatch."],
      },
      values: parsed.data,
    };
  }

  if (parsed.data.assignedToUserId) {
    const assigneeMembership = await db.organizationMembership.findFirst({
      where: {
        organizationId,
        userId: parsed.data.assignedToUserId,
        departmentId: parsed.data.assignedToDepartmentId,
        status: "ACTIVE",
      },
      select: {
        userId: true,
      },
    });

    if (!assigneeMembership) {
      return {
        ok: false,
        message:
          "The selected user must be an active member of the chosen department.",
        fieldErrors: {
          assignedToUserId: [
            "The selected user must be an active member of the chosen department.",
          ],
        },
        values: parsed.data,
      };
    }
  }

  const dueDate = new Date(parsed.data.dueDate);
  const assignmentNote = parsed.data.assignedToUserId
    ? `Central office routed correspondence ${correspondence.referenceNumber} to ${department.name} and the selected user.`
    : `Central office routed correspondence ${correspondence.referenceNumber} to ${department.name}.`;
  const dueDateLabel = new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
  }).format(dueDate);

  await db.$transaction(async (tx) => {
    await tx.correspondence.update({
      where: {
        id: correspondence.id,
      },
      data: {
        assignedToDepartmentId: parsed.data.assignedToDepartmentId,
        assignedToUserId: parsed.data.assignedToUserId ?? null,
        assignedByUserId,
        dueDate,
        status: CorrespondenceStatus.DISPATCHED,
      },
    });

    await tx.correspondenceMovement.create({
      data: {
        organizationId,
        correspondenceId: correspondence.id,
        fromDepartmentId: correspondence.assignedToDepartmentId,
        fromUserId:
          correspondence.assignedToUserId ?? correspondence.reviewedByUserId,
        toDepartmentId: parsed.data.assignedToDepartmentId,
        toUserId: parsed.data.assignedToUserId ?? null,
        status: CorrespondenceStatus.DISPATCHED,
        note: assignmentNote,
        createdByUserId: actorUserId,
      },
    });

    const auditLog = await tx.auditLog.create({
      data: {
        organizationId,
        actorUserId,
        entityType: "Correspondence",
        entityId: correspondence.id,
        action: AuditAction.UPDATE,
        message: `Updated assignment for correspondence ${correspondence.referenceNumber}: ${correspondence.subject}`,
        correspondenceId: correspondence.id,
      },
      select: {
        id: true,
      },
    });

    await notifyCorrespondenceRoutingRecorded({
      tx,
      organizationId,
      correspondenceId: correspondence.id,
      referenceNumber: correspondence.referenceNumber,
      actorUserId,
      auditLogId: auditLog.id,
      departmentName: department.name,
      assignedUserName: assigneeUser?.name || assigneeUser?.email || null,
      dueDateLabel,
    });
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/correspondences");
  revalidatePath(`/dashboard/correspondences/${correspondence.id}`);

  return {
    ok: true,
    message: "Routing decision saved successfully.",
    values: {
      ...parsed.data,
      assignedByUserId,
      dueDate: parsed.data.dueDate,
      status: CorrespondenceStatus.DISPATCHED,
    },
    data: {
      correspondenceId: correspondence.id,
      organizationId,
    },
  };
}
