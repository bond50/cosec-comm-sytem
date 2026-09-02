"use server";

import { AuditAction } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  getMeetingCreateValuesFromFormData,
  getMeetingFieldErrors,
  initialMeetingCreateState,
  meetingCreateSchema,
  type MeetingCreateActionState,
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
} from "@/features/notifications/lib/notification-routing";

export async function createMeetingAction(
  _previousState: MeetingCreateActionState,
  formData: FormData,
): Promise<MeetingCreateActionState> {
  const values = getMeetingCreateValuesFromFormData(formData);
  const parsed = meetingCreateSchema.safeParse(values);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please correct the highlighted meeting fields.",
      fieldErrors: getMeetingFieldErrors(parsed.error),
      values,
    };
  }

  try {
    const access = await requireOrganizationPermission("meetings.manage");

    const correspondence = parsed.data.correspondenceId
      ? await db.correspondence.findFirst({
          where: {
            organizationId: access.organization.id,
            id: parsed.data.correspondenceId,
          },
          select: {
            id: true,
            referenceNumber: true,
            assignedToUserId: true,
            assignedToUser: {
              select: {
                email: true,
              },
            },
          },
        })
      : null;

    if (parsed.data.correspondenceId && !correspondence) {
      return {
        ok: false,
        message:
          "The selected correspondence is not valid for this organization.",
        fieldErrors: {
          correspondenceId: [
            "The selected correspondence is not valid for this organization.",
          ],
        },
        values: parsed.data,
      };
    }

    const meeting = await db.$transaction(async (tx) => {
      const created = await tx.meeting.create({
        data: {
          organizationId: access.organization.id,
          title: parsed.data.title,
          description: parsed.data.description,
          agenda: parsed.data.agenda,
          venue: parsed.data.venue,
          startsAt: new Date(parsed.data.startsAt),
          endsAt: parsed.data.endsAt ? new Date(parsed.data.endsAt) : undefined,
          organizer: parsed.data.organizer,
          chairperson: parsed.data.chairperson,
          correspondenceId: parsed.data.correspondenceId,
          status: parsed.data.status,
        },
        select: {
          id: true,
        },
      });

      const auditLog = await tx.auditLog.create({
        data: {
          organizationId: access.organization.id,
          actorUserId: access.userId,
          entityType: "Meeting",
          entityId: created.id,
          action: AuditAction.CREATE,
          message: correspondence
            ? `Created meeting record ${parsed.data.title} linked to ${correspondence.referenceNumber}.`
            : `Created meeting record ${parsed.data.title}.`,
        },
        select: {
          id: true,
        },
      });

      await createNotifications({
        tx,
        organizationId: access.organization.id,
        recipients: excludeActor(
          await getDirectUserRecipient(
            { tx, organizationId: access.organization.id },
            correspondence?.assignedToUserId,
          ),
          access.userId,
        ),
        title: "Meeting scheduled",
        message: `Meeting scheduled: ${parsed.data.title}.`,
        type: "MEETING_SCHEDULED",
        kind: "UPDATE",
        entityType: "Meeting",
        entityId: created.id,
        href: `/dashboard/meetings/${created.id}`,
        auditLogId: auditLog.id,
      });

      return created;
    });

    revalidatePath("/dashboard/meetings");

    return {
      ...initialMeetingCreateState,
      ok: true,
      message: "Meeting created.",
      data: {
        meetingId: meeting.id,
        organizationId: access.organization.id,
      },
    };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return {
        ok: false,
        message: "You must be signed in to create meetings.",
        values: parsed.data,
      };
    }

    if (error instanceof MissingOrganizationError) {
      return {
        ok: false,
        message: "An active organization is required before creating meetings.",
        values: parsed.data,
      };
    }

    if (error instanceof ForbiddenError) {
      return {
        ok: false,
        message: "Your role cannot create meetings in this organization.",
        values: parsed.data,
      };
    }

    return {
      ok: false,
      message: "We could not create the meeting right now.",
      values: parsed.data,
    };
  }
}
