"use server";

import { AuditAction, MeetingStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  getMeetingActionPointCreateValuesFromFormData,
  getMeetingFieldErrors,
  meetingActionPointCreateSchema,
  type MeetingActionPointCreateActionState,
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
  getExecutionRecipients,
} from "@/features/notifications/lib/notification-routing";

export async function createMeetingActionPointAction(
  _previousState: MeetingActionPointCreateActionState,
  formData: FormData,
): Promise<MeetingActionPointCreateActionState> {
  const values = getMeetingActionPointCreateValuesFromFormData(formData);
  const parsed = meetingActionPointCreateSchema.safeParse(values);

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

    const [meeting, assignee, department] = await Promise.all([
      db.meeting.findFirst({
        where: {
          id: parsed.data.meetingId,
          organizationId: access.organization.id,
        },
        select: {
          id: true,
          title: true,
          status: true,
        },
      }),
      parsed.data.assignedToUserId
        ? db.organizationMembership.findFirst({
            where: {
              organizationId: access.organization.id,
              userId: parsed.data.assignedToUserId,
              status: "ACTIVE",
            },
            select: { userId: true, user: { select: { email: true } } },
          })
        : Promise.resolve(null),
      parsed.data.assignedToDepartmentId
        ? db.department.findFirst({
            where: {
              organizationId: access.organization.id,
              id: parsed.data.assignedToDepartmentId,
            },
            select: { id: true },
          })
        : Promise.resolve(null),
    ]);

    if (!meeting) {
      return {
        ok: false,
        message: "That meeting record no longer exists.",
        values: parsed.data,
      };
    }

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

    const actionPoint = await db.$transaction(async (tx) => {
      const created = await tx.meetingActionPoint.create({
        data: {
          organizationId: access.organization.id,
          meetingId: meeting.id,
          actionPoint: parsed.data.actionPoint,
          assignedToUserId: parsed.data.assignedToUserId,
          assignedToDepartmentId: parsed.data.assignedToDepartmentId,
          dueDate: new Date(parsed.data.dueDate),
          remarks: parsed.data.remarks,
          createdByUserId: access.userId,
        },
        select: {
          id: true,
        },
      });

      const auditLog = await tx.auditLog.create({
        data: {
          organizationId: access.organization.id,
          actorUserId: access.userId,
          entityType: "MeetingActionPoint",
          entityId: created.id,
          action: AuditAction.CREATE,
          message: `Created action point for meeting ${meeting.title}.`,
        },
        select: {
          id: true,
        },
      });

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
        message: `Action point assigned: ${parsed.data.actionPoint}.`,
        type: "ACTION_POINT_ASSIGNED",
        kind: "ACTION_REQUIRED",
        entityType: "MeetingActionPoint",
        entityId: created.id,
        href: `/dashboard/meetings/${meeting.id}`,
        auditLogId: auditLog.id,
      });

      if (
        meeting.status !== MeetingStatus.CANCELLED &&
        meeting.status !== MeetingStatus.CLOSED &&
        meeting.status !== MeetingStatus.COMPLETED &&
        meeting.status !== MeetingStatus.ACTION_POINTS_ISSUED
      ) {
        await tx.meeting.update({
          where: {
            id: meeting.id,
          },
          data: {
            status: MeetingStatus.ACTION_POINTS_ISSUED,
          },
        });

        await tx.auditLog.create({
          data: {
            organizationId: access.organization.id,
            actorUserId: access.userId,
            entityType: "Meeting",
            entityId: meeting.id,
            action: AuditAction.UPDATE,
            message: `Marked meeting ${meeting.title} as action points issued after creating an action point.`,
          },
        });
      }

      return created;
    });

    revalidatePath("/dashboard/meetings");
    revalidatePath(`/dashboard/meetings/${meeting.id}`);

    return {
      ok: true,
      message: "Action point created.",
      values: {
        meetingId: meeting.id,
        actionPoint: "",
        assignedToUserId: "",
        assignedToDepartmentId: "",
        dueDate: parsed.data.dueDate,
        remarks: "",
      },
      data: {
        meetingId: meeting.id,
        actionPointId: actionPoint.id,
        organizationId: access.organization.id,
      },
    };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return {
        ok: false,
        message: "You must be signed in to create action points.",
        values: parsed.data,
      };
    }

    if (error instanceof MissingOrganizationError) {
      return {
        ok: false,
        message:
          "An active organization is required before creating action points.",
        values: parsed.data,
      };
    }

    if (error instanceof ForbiddenError) {
      return {
        ok: false,
        message: "Your role cannot create action points in this organization.",
        values: parsed.data,
      };
    }

    return {
      ok: false,
      message: "We could not create the action point right now.",
      values: parsed.data,
    };
  }
}
