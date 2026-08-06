"use server";

import { AuditAction } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  getMeetingActionPointUpdateValuesFromFormData,
  getMeetingFieldErrors,
  meetingActionPointUpdateSchema,
  type MeetingActionPointUpdateActionState,
} from "@/features/meetings/lib/meetings.shared";
import { requireOrganizationPermission } from "@/features/auth/utils/require-organization-permission";
import {
  ForbiddenError,
  MissingOrganizationError,
  UnauthorizedError,
} from "@/features/auth/utils/auth-errors";
import { createNotifications } from "@/features/notifications/lib/notifications";
import {
  excludeActor,
  getDirectUserRecipient,
  getExecutionRecipients,
} from "@/features/notifications/lib/notification-routing";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
  }).format(value);
}

function formatUserLabel(
  user: { name: string | null; email: string | null } | null | undefined,
) {
  return user?.name || user?.email || "Not assigned";
}

function formatDepartmentLabel(
  department: { name: string; code: string | null } | null | undefined,
) {
  if (!department) return "Not assigned";
  return department.code
    ? `${department.name} (${department.code})`
    : department.name;
}

export async function updateMeetingActionPointAction(
  _previousState: MeetingActionPointUpdateActionState,
  formData: FormData,
): Promise<MeetingActionPointUpdateActionState> {
  const values = getMeetingActionPointUpdateValuesFromFormData(formData);
  const parsed = meetingActionPointUpdateSchema.safeParse(values);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please correct the highlighted action point fields.",
      fieldErrors: getMeetingFieldErrors(parsed.error),
      values,
    };
  }

  try {
    const access = await requireOrganizationPermission("meetings.manage");

    const actionPoint = await db.meetingActionPoint.findFirst({
      where: {
        id: parsed.data.actionPointId,
        organizationId: access.organization.id,
      },
      select: {
        id: true,
        meetingId: true,
        actionPoint: true,
        status: true,
        dueDate: true,
        assignedToUserId: true,
        assignedToDepartmentId: true,
        remarks: true,
        assignedToUser: {
          select: {
            name: true,
            email: true,
          },
        },
        assignedToDepartment: {
          select: {
            name: true,
            code: true,
          },
        },
      },
    });

    if (!actionPoint) {
      return {
        ok: false,
        message: "That action point no longer exists.",
        values: parsed.data,
      };
    }

    const [assignee, department] = await Promise.all([
      parsed.data.assignedToUserId
        ? db.organizationMembership.findFirst({
            where: {
              organizationId: access.organization.id,
              userId: parsed.data.assignedToUserId,
              status: "ACTIVE",
            },
            select: {
              userId: true,
              user: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          })
        : Promise.resolve(null),
      parsed.data.assignedToDepartmentId
        ? db.department.findFirst({
            where: {
              organizationId: access.organization.id,
              id: parsed.data.assignedToDepartmentId,
            },
            select: { id: true, name: true, code: true },
          })
        : Promise.resolve(null),
    ]);

    if (parsed.data.assignedToUserId && !assignee) {
      return {
        ok: false,
        message: "The selected assignee is not an active organization member.",
        fieldErrors: {
          assignedToUserId: [
            "The selected assignee is not an active organization member.",
          ],
        },
        values: parsed.data,
      };
    }

    if (parsed.data.assignedToDepartmentId && !department) {
      return {
        ok: false,
        message: "The selected department is not valid for this organization.",
        fieldErrors: {
          assignedToDepartmentId: [
            "The selected department is not valid for this organization.",
          ],
        },
        values: parsed.data,
      };
    }

    const newDueDate = new Date(parsed.data.dueDate);
    const changes: string[] = [];

    if (actionPoint.status !== parsed.data.status) {
      changes.push(
        `Status changed from ${actionPoint.status.replaceAll("_", " ")} to ${parsed.data.status.replaceAll("_", " ")}.`,
      );
    }

    if (actionPoint.assignedToUserId !== parsed.data.assignedToUserId) {
      changes.push(
        `Assigned user changed from ${formatUserLabel(actionPoint.assignedToUser)} to ${formatUserLabel(assignee?.user)}.`,
      );
    }

    if (
      actionPoint.assignedToDepartmentId !== parsed.data.assignedToDepartmentId
    ) {
      changes.push(
        `Assigned department changed from ${formatDepartmentLabel(actionPoint.assignedToDepartment)} to ${formatDepartmentLabel(department)}.`,
      );
    }

    if (actionPoint.dueDate.getTime() !== newDueDate.getTime()) {
      changes.push(
        `Due date changed from ${formatDate(actionPoint.dueDate)} to ${formatDate(newDueDate)}.`,
      );
    }

    if ((actionPoint.remarks ?? "") !== (parsed.data.remarks ?? "")) {
      changes.push("Remarks updated.");
    }

    await db.$transaction(async (tx) => {
      await tx.meetingActionPoint.update({
        where: {
          id: actionPoint.id,
        },
        data: {
          assignedToUserId: parsed.data.assignedToUserId,
          assignedToDepartmentId: parsed.data.assignedToDepartmentId,
          dueDate: newDueDate,
          status: parsed.data.status,
          remarks: parsed.data.remarks,
        },
      });

      const auditLog = await tx.auditLog.create({
        data: {
          organizationId: access.organization.id,
          actorUserId: access.userId,
          entityType: "MeetingActionPoint",
          entityId: actionPoint.id,
          action: AuditAction.UPDATE,
          message:
            changes.length > 0
              ? changes.join(" ")
              : `Updated action point "${actionPoint.actionPoint}".`,
        },
        select: {
          id: true,
        },
      });

      if (
        actionPoint.assignedToUserId !== parsed.data.assignedToUserId ||
        actionPoint.assignedToDepartmentId !==
          parsed.data.assignedToDepartmentId
      ) {
        await createNotifications({
          tx,
          organizationId: access.organization.id,
          recipients: excludeActor(
            await getExecutionRecipients(
              { tx, organizationId: access.organization.id },
              {
                assignedUserId: parsed.data.assignedToUserId,
                assignedDepartmentId: parsed.data.assignedToDepartmentId,
              },
            ),
            access.userId,
          ),
          title: "Action point assigned",
          message: `You were assigned: ${actionPoint.actionPoint}.`,
          type: "ACTION_POINT_ASSIGNED",
          kind: "ACTION_REQUIRED",
          entityType: "MeetingActionPoint",
          entityId: actionPoint.id,
          href: `/dashboard/meetings/${actionPoint.meetingId}`,
          auditLogId: auditLog.id,
        });
      } else if (actionPoint.dueDate.getTime() !== newDueDate.getTime()) {
        await createNotifications({
          tx,
          organizationId: access.organization.id,
          recipients: excludeActor(
            await getDirectUserRecipient(
              { tx, organizationId: access.organization.id },
              parsed.data.assignedToUserId,
            ),
            access.userId,
          ),
          title: "Action point due date updated",
          message: `Due date updated for: ${actionPoint.actionPoint}.`,
          type: "ACTION_POINT_DUE_DATE_UPDATED",
          kind: "UPDATE",
          entityType: "MeetingActionPoint",
          entityId: actionPoint.id,
          href: `/dashboard/meetings/${actionPoint.meetingId}`,
          auditLogId: auditLog.id,
        });
      }
    });

    revalidatePath("/dashboard/meetings");
    revalidatePath(`/dashboard/meetings/${actionPoint.meetingId}`);

    return {
      ok: true,
      message: "Action point updated.",
      values: parsed.data,
      data: {
        meetingId: actionPoint.meetingId,
        actionPointId: actionPoint.id,
        organizationId: access.organization.id,
      },
    };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return {
        ok: false,
        message: "You must be signed in to update action points.",
        values: parsed.data,
      };
    }

    if (error instanceof MissingOrganizationError) {
      return {
        ok: false,
        message:
          "An active organization is required before updating action points.",
        values: parsed.data,
      };
    }

    if (error instanceof ForbiddenError) {
      return {
        ok: false,
        message: "Your role cannot update action points in this organization.",
        values: parsed.data,
      };
    }

    return {
      ok: false,
      message: "We could not update the action point right now.",
      values: parsed.data,
    };
  }
}
