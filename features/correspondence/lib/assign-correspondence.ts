"use server";

import {
  AuditAction,
  CorrespondenceStatus,
  DispatchStatus,
} from "@prisma/client";
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
import {
  notifyCorrespondenceDispatchIssued,
  notifyCorrespondenceRoutingRecorded,
} from "@/features/correspondence/lib/correspondence-notifications";
import { formatUserLabel } from "@/features/application/lib/user-label";

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

  const assignedByUserId = actorUserId;
  const targetDepartmentIds = parsed.data.targets.map((t) => t.departmentId);
  const targetUserIds = parsed.data.targets
    .map((t) => t.userId)
    .filter((id): id is string => !!id);

  const [assignerMembership, departments, correspondence, assigneeUsers] =
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
      db.department.findMany({
        where: {
          id: { in: targetDepartmentIds },
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
      targetUserIds.length
        ? db.user.findMany({
            where: {
              id: { in: targetUserIds },
            },
            select: {
              id: true,
              name: true,
              email: true,
              designation: true,
            },
          })
        : Promise.resolve([]),
    ]);

  if (!assignerMembership) {
    return {
      ok: false,
      message:
        "Your membership in the current organization could not be verified.",
      values: parsed.data,
    };
  }

  if (!hasCountySecretaryAuthority(assignerMembership.roles)) {
    return {
      ok: false,
      message:
        "Only the County Secretary authority path can record a routing decision for correspondence.",
      values: parsed.data,
    };
  }

  const departmentById = new Map(departments.map((d) => [d.id, d]));
  const missingDepartment = targetDepartmentIds.find(
    (id) => !departmentById.has(id),
  );

  if (missingDepartment) {
    return {
      ok: false,
      message:
        "Every selected department must be active and belong to the current organization.",
      fieldErrors: {
        targets: [
          "Every selected department must be active and belong to the current organization.",
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

  if (targetUserIds.length) {
    const activeMemberships = await db.organizationMembership.findMany({
      where: {
        organizationId,
        status: "ACTIVE",
        OR: parsed.data.targets
          .filter((t) => !!t.userId)
          .map((t) => ({ userId: t.userId, departmentId: t.departmentId })),
      },
      select: { userId: true, departmentId: true },
    });
    const validPairs = new Set(
      activeMemberships.map((m) => `${m.userId}::${m.departmentId}`),
    );

    const invalidTarget = parsed.data.targets.find(
      (t) => t.userId && !validPairs.has(`${t.userId}::${t.departmentId}`),
    );

    if (invalidTarget) {
      return {
        ok: false,
        message:
          "Every named receiving officer must be an active member of the department they're routed to.",
        fieldErrors: {
          targets: [
            "Every named receiving officer must be an active member of the department they're routed to.",
          ],
        },
        values: parsed.data,
      };
    }
  }

  const assigneeUserById = new Map(assigneeUsers.map((u) => [u.id, u]));
  const dueDate = new Date(parsed.data.dueDate);
  const dueDateLabel = new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
  }).format(dueDate);
  const now = new Date();

  const primaryTarget = parsed.data.targets[0];
  const primaryDepartment = departmentById.get(primaryTarget.departmentId)!;
  const departmentNames = parsed.data.targets
    .map((t) => departmentById.get(t.departmentId)!.name)
    .join(", ");
  const assignmentNote =
    parsed.data.targets.length > 1
      ? `Central office routed correspondence ${correspondence.referenceNumber} to ${departmentNames}.`
      : primaryTarget.userId
        ? `Central office routed correspondence ${correspondence.referenceNumber} to ${primaryDepartment.name} and the selected user.`
        : `Central office routed correspondence ${correspondence.referenceNumber} to ${primaryDepartment.name}.`;

  await db.$transaction(async (tx) => {
    await tx.correspondence.update({
      where: {
        id: correspondence.id,
      },
      data: {
        assignedToDepartmentId: primaryTarget.departmentId,
        assignedToUserId: primaryTarget.userId ?? null,
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
        toDepartmentId: primaryTarget.departmentId,
        toUserId: primaryTarget.userId ?? null,
        status: CorrespondenceStatus.DISPATCHED,
        note: assignmentNote,
        createdByUserId: actorUserId,
      },
    });

    const routingAuditLog = await tx.auditLog.create({
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
      auditLogId: routingAuditLog.id,
      departmentName: departmentNames,
      assignedUserName:
        parsed.data.targets.length === 1
          ? formatUserLabel(
              assigneeUserById.get(primaryTarget.userId ?? "") ?? null,
              null,
            )
          : null,
      dueDateLabel,
    });

    for (const target of parsed.data.targets) {
      const targetDepartment = departmentById.get(target.departmentId)!;
      const targetUser = target.userId
        ? (assigneeUserById.get(target.userId) ?? null)
        : null;

      const createdDispatch = await tx.correspondenceDispatch.create({
        data: {
          organizationId,
          correspondenceId: correspondence.id,
          dispatchedToDepartmentId: target.departmentId,
          dispatchedToUserId: target.userId ?? null,
          dispatchDate: now,
          note: targetUser
            ? `Central office dispatch sent to ${targetDepartment.name} and ${formatUserLabel(targetUser, "the selected user")}.`
            : `Central office dispatch sent to ${targetDepartment.name}.`,
          status: DispatchStatus.SENT,
          createdByUserId: actorUserId,
        },
        select: { id: true },
      });

      const dispatchAuditLog = await tx.auditLog.create({
        data: {
          organizationId,
          actorUserId,
          entityType: "CorrespondenceDispatch",
          entityId: createdDispatch.id,
          action: AuditAction.DISPATCH,
          message: `Created central-office dispatch record for correspondence ${correspondence.referenceNumber}: ${correspondence.subject}`,
          correspondenceId: correspondence.id,
        },
        select: { id: true },
      });

      await notifyCorrespondenceDispatchIssued({
        tx,
        organizationId,
        correspondenceId: correspondence.id,
        referenceNumber: correspondence.referenceNumber,
        actorUserId,
        auditLogId: dispatchAuditLog.id,
        dispatchedToUserId: targetUser?.id,
        dispatchedToUserEmail: targetUser?.email,
        dispatchedToDepartmentId: targetDepartment.id,
        departmentName: targetDepartment.name,
        dueDateLabel,
      });
    }
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/correspondences");
  revalidatePath(`/dashboard/correspondences/${correspondence.id}`);

  return {
    ok: true,
    message:
      parsed.data.targets.length > 1
        ? `Routing decision saved and dispatched to ${parsed.data.targets.length} departments successfully.`
        : "Routing decision saved and dispatched successfully.",
    values: {
      ...parsed.data,
      dueDate: parsed.data.dueDate,
      status: CorrespondenceStatus.DISPATCHED,
    },
    data: {
      correspondenceId: correspondence.id,
      organizationId,
    },
  };
}
