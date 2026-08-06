"use server";

import { AttachmentOwnerType, AuditAction } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireOrganizationPermission } from "@/features/auth/utils/require-organization-permission";
import {
  ForbiddenError,
  MissingOrganizationError,
  UnauthorizedError,
} from "@/features/auth/utils/auth-errors";
import {
  type MeetingAttachmentActionState,
  getMeetingAttachmentValuesFromFormData,
} from "@/features/meetings/lib/meetings.shared";
import { uploadFileToCloudinary } from "@/lib/cloudinary";
import { db } from "@/lib/db";

const MAX_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_ATTACHMENT_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg",
  "image/png",
  "text/plain",
] as const;

export async function uploadMeetingAttachmentAction(
  _previousState: MeetingAttachmentActionState,
  formData: FormData,
): Promise<MeetingAttachmentActionState> {
  const values = getMeetingAttachmentValuesFromFormData(formData);
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return {
      ok: false,
      message: "Select a file to attach.",
      fieldErrors: {
        fileName: ["Select a file to attach."],
      },
      values,
    };
  }

  if (!values.meetingId) {
    return {
      ok: false,
      message: "Invalid meeting record.",
      fieldErrors: {
        meetingId: ["Invalid meeting record."],
      },
      values,
    };
  }

  if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
    return {
      ok: false,
      message: "Attachment size must be 10 MB or less.",
      fieldErrors: {
        fileName: ["Attachment size must be 10 MB or less."],
      },
      values,
    };
  }

  if (
    file.type &&
    !ALLOWED_ATTACHMENT_MIME_TYPES.includes(
      file.type as (typeof ALLOWED_ATTACHMENT_MIME_TYPES)[number],
    )
  ) {
    return {
      ok: false,
      message: "That file type is not supported for meeting attachments.",
      fieldErrors: {
        fileName: [
          "Supported file types are PDF, Word, Excel, JPEG, PNG, and text files.",
        ],
      },
      values,
    };
  }

  let organizationId: string;
  let actorUserId: string;

  try {
    const access = await requireOrganizationPermission("meetings.manage");
    organizationId = access.organization.id;
    actorUserId = access.userId;
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return {
        ok: false,
        message: "You must be signed in to attach meeting files.",
        values,
      };
    }

    if (error instanceof MissingOrganizationError) {
      return {
        ok: false,
        message:
          "An active organization is required before uploading meeting attachments.",
        values,
      };
    }

    if (error instanceof ForbiddenError) {
      return {
        ok: false,
        message:
          "Your role cannot upload meeting attachments in this organization.",
        values,
      };
    }

    return {
      ok: false,
      message: "We could not verify your meeting attachment access right now.",
      values,
    };
  }

  const meeting = await db.meeting.findFirst({
    where: {
      id: values.meetingId,
      organizationId,
    },
    select: {
      id: true,
      title: true,
    },
  });

  if (!meeting) {
    return {
      ok: false,
      message: "That meeting record no longer exists.",
      values,
    };
  }

  try {
    const upload = await uploadFileToCloudinary(file, {
      folder: `organizations/${organizationId}/meetings/${meeting.id}`,
      publicIdPrefix: "meeting-attachment",
    });

    const attachment = await db.$transaction(async (tx) => {
      const created = await tx.attachment.create({
        data: {
          organizationId,
          ownerType: AttachmentOwnerType.MEETING,
          meetingId: meeting.id,
          fileName: upload.publicId,
          originalName: file.name,
          mimeType: file.type || "application/octet-stream",
          fileSize: upload.bytes,
          storagePath: upload.secureUrl,
          uploadedByUserId: actorUserId,
        },
        select: {
          id: true,
        },
      });

      await tx.auditLog.create({
        data: {
          organizationId,
          actorUserId,
          entityType: "Attachment",
          entityId: created.id,
          action: AuditAction.UPDATE,
          message: `Attached file ${file.name} to meeting ${meeting.title}.`,
        },
      });

      return created;
    });

    revalidatePath("/dashboard/meetings");
    revalidatePath(`/dashboard/meetings/${meeting.id}`);

    return {
      ok: true,
      message: "Attachment uploaded successfully.",
      values: {
        meetingId: meeting.id,
        fileName: "",
      },
      data: {
        meetingId: meeting.id,
        attachmentId: attachment.id,
        organizationId,
      },
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "We could not upload the attachment right now.";

    return {
      ok: false,
      message,
      values,
    };
  }
}
