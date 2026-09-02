"use server";

import {
  AttachmentOwnerType,
  AuditAction,
  CorrespondenceStatus,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { uploadFileToCloudinary } from "@/lib/cloudinary";
import {
  type CorrespondenceAttachmentActionState,
  getCorrespondenceAttachmentValuesFromFormData,
} from "@/features/correspondence/lib/correspondence.shared";
import { requireOrganizationPermission } from "@/features/auth/utils/require-organization-permission";
import {
  ForbiddenError,
  MissingOrganizationError,
  UnauthorizedError,
} from "@/features/auth/utils/auth-errors";

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

export async function uploadCorrespondenceAttachmentAction(
  _previousState: CorrespondenceAttachmentActionState,
  formData: FormData,
): Promise<CorrespondenceAttachmentActionState> {
  const values = getCorrespondenceAttachmentValuesFromFormData(formData);
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

  if (!values.correspondenceId) {
    return {
      ok: false,
      message: "Invalid correspondence record.",
      fieldErrors: {
        correspondenceId: ["Invalid correspondence record."],
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
    !file.type ||
    !ALLOWED_ATTACHMENT_MIME_TYPES.includes(
      file.type as (typeof ALLOWED_ATTACHMENT_MIME_TYPES)[number],
    )
  ) {
    return {
      ok: false,
      message:
        "That file type is not supported for correspondence attachments.",
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
    const access = await requireOrganizationPermission("attachments.upload");
    organizationId = access.organization.id;
    actorUserId = access.userId;
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return {
        ok: false,
        message: "You must be signed in to attach supporting files.",
        values,
      };
    }

    if (error instanceof MissingOrganizationError) {
      return {
        ok: false,
        message:
          "An active organization is required before uploading attachments.",
        values,
      };
    }

    if (error instanceof ForbiddenError) {
      return {
        ok: false,
        message:
          "Your role cannot upload correspondence attachments in this organization.",
        values,
      };
    }

    return {
      ok: false,
      message: "We could not verify your attachment access right now.",
      values,
    };
  }

  const correspondence = await db.correspondence.findFirst({
    where: {
      id: values.correspondenceId,
      organizationId,
    },
    select: {
      id: true,
      referenceNumber: true,
      subject: true,
      status: true,
    },
  });

  if (!correspondence) {
    return {
      ok: false,
      message: "That correspondence record no longer exists.",
      values,
    };
  }

  if (
    correspondence.status === CorrespondenceStatus.CLOSED ||
    correspondence.status === CorrespondenceStatus.CANCELLED
  ) {
    return {
      ok: false,
      message:
        "Closed or cancelled correspondence is locked. Reopen the file before uploading more supporting files.",
      values,
    };
  }

  try {
    const upload = await uploadFileToCloudinary(file, {
      folder: `organizations/${organizationId}/correspondence/${correspondence.id}`,
      publicIdPrefix: "correspondence-attachment",
    });

    const attachment = await db.$transaction(async (tx) => {
      const created = await tx.attachment.create({
        data: {
          organizationId,
          ownerType: AttachmentOwnerType.CORRESPONDENCE,
          correspondenceId: correspondence.id,
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
          message: `Attached file ${file.name} to correspondence ${correspondence.referenceNumber}: ${correspondence.subject}`,
          correspondenceId: correspondence.id,
        },
      });

      return created;
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/correspondences");
    revalidatePath(`/dashboard/correspondences/${correspondence.id}`);

    return {
      ok: true,
      message: "Attachment uploaded successfully.",
      values: {
        correspondenceId: correspondence.id,
        fileName: "",
      },
      data: {
        correspondenceId: correspondence.id,
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
