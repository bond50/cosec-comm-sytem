"use server";

import { AuditAction } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  getMeetingFieldErrors,
  getMeetingUpdateValuesFromFormData,
  meetingUpdateSchema,
  type MeetingUpdateActionState,
} from "@/features/meetings/lib/meetings.shared";
import { requireOrganizationPermission } from "@/features/auth/utils/require-organization-permission";
import {
  ForbiddenError,
  MissingOrganizationError,
  UnauthorizedError,
} from "@/features/auth/utils/auth-errors";

function meetingRuntimeSupportsDecisions() {
  const runtimeModels = (
    db as typeof db & {
      _runtimeDataModel?: {
        models?: Record<string, { fields?: { name?: string }[] }>;
      };
    }
  )._runtimeDataModel?.models;

  return Boolean(
    runtimeModels?.Meeting?.fields?.some((field) => field.name === "decisions"),
  );
}

export async function updateMeetingAction(
  _previousState: MeetingUpdateActionState,
  formData: FormData,
): Promise<MeetingUpdateActionState> {
  const values = getMeetingUpdateValuesFromFormData(formData);
  const parsed = meetingUpdateSchema.safeParse(values);

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

    const meeting = await db.meeting.findFirst({
      where: {
        id: parsed.data.meetingId,
        organizationId: access.organization.id,
      },
      select: {
        id: true,
        title: true,
        correspondenceId: true,
        _count: {
          select: {
            actionPoints: true,
          },
        },
      },
    });

    if (!meeting) {
      return {
        ok: false,
        message: "That meeting record no longer exists.",
        values: parsed.data,
      };
    }

    const [organizer, chairperson, correspondence] = await Promise.all([
      parsed.data.organizerUserId
        ? db.organizationMembership.findFirst({
            where: {
              organizationId: access.organization.id,
              userId: parsed.data.organizerUserId,
              status: "ACTIVE",
            },
            select: { userId: true },
          })
        : Promise.resolve(null),
      parsed.data.chairpersonUserId
        ? db.organizationMembership.findFirst({
            where: {
              organizationId: access.organization.id,
              userId: parsed.data.chairpersonUserId,
              status: "ACTIVE",
            },
            select: { userId: true },
          })
        : Promise.resolve(null),
      parsed.data.correspondenceId
        ? db.correspondence.findFirst({
            where: {
              organizationId: access.organization.id,
              id: parsed.data.correspondenceId,
            },
            select: { id: true, referenceNumber: true },
          })
        : Promise.resolve(null),
    ]);

    if (parsed.data.organizerUserId && !organizer) {
      return {
        ok: false,
        message: "The selected organizer is not an active organization member.",
        fieldErrors: {
          organizerUserId: [
            "The selected organizer is not an active organization member.",
          ],
        },
        values: parsed.data,
      };
    }

    if (parsed.data.chairpersonUserId && !chairperson) {
      return {
        ok: false,
        message:
          "The selected chairperson is not an active organization member.",
        fieldErrors: {
          chairpersonUserId: [
            "The selected chairperson is not an active organization member.",
          ],
        },
        values: parsed.data,
      };
    }

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

    if (
      parsed.data.status === "CLOSED" &&
      !parsed.data.resolutions &&
      meeting._count.actionPoints === 0
    ) {
      return {
        ok: false,
        message:
          "A meeting can only be closed after resolutions are recorded or action points are issued.",
        fieldErrors: {
          resolutions: [
            "Record resolutions or create at least one action point before closing this meeting.",
          ],
        },
        values: parsed.data,
      };
    }

    await db.$transaction(async (tx) => {
      await tx.meeting.update({
        where: {
          id: meeting.id,
        },
        data: {
          title: parsed.data.title,
          description: parsed.data.description,
          agenda: parsed.data.agenda,
          discussionSummary: parsed.data.discussionSummary,
          resolutions: parsed.data.resolutions,
          ...(meetingRuntimeSupportsDecisions()
            ? { decisions: parsed.data.decisions }
            : {}),
          venue: parsed.data.venue,
          startsAt: new Date(parsed.data.startsAt),
          endsAt: parsed.data.endsAt ? new Date(parsed.data.endsAt) : null,
          organizerUserId: parsed.data.organizerUserId,
          chairpersonUserId: parsed.data.chairpersonUserId,
          correspondenceId: parsed.data.correspondenceId,
          status: parsed.data.status,
        },
      });

      await tx.auditLog.create({
        data: {
          organizationId: access.organization.id,
          actorUserId: access.userId,
          entityType: "Meeting",
          entityId: meeting.id,
          action: AuditAction.UPDATE,
          message: `Updated meeting record ${meeting.title}.`,
        },
      });
    });

    revalidatePath("/dashboard/meetings");
    revalidatePath(`/dashboard/meetings/${meeting.id}`);
    if (meeting.correspondenceId) {
      revalidatePath(`/dashboard/correspondences/${meeting.correspondenceId}`);
    }
    if (
      parsed.data.correspondenceId &&
      parsed.data.correspondenceId !== meeting.correspondenceId
    ) {
      revalidatePath(
        `/dashboard/correspondences/${parsed.data.correspondenceId}`,
      );
    }

    return {
      ok: true,
      message: "Meeting updated.",
      values: parsed.data,
      data: {
        meetingId: meeting.id,
        organizationId: access.organization.id,
      },
    };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return {
        ok: false,
        message: "You must be signed in to update meetings.",
        values: parsed.data,
      };
    }

    if (error instanceof MissingOrganizationError) {
      return {
        ok: false,
        message: "An active organization is required before updating meetings.",
        values: parsed.data,
      };
    }

    if (error instanceof ForbiddenError) {
      return {
        ok: false,
        message: "Your role cannot update meetings in this organization.",
        values: parsed.data,
      };
    }

    return {
      ok: false,
      message: "We could not update the meeting right now.",
      values: parsed.data,
    };
  }
}
