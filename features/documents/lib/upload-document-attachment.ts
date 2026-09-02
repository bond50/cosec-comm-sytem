"use server";

import { AttachmentOwnerType, AuditAction } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { uploadFileToCloudinary } from "@/lib/cloudinary";
import {
  type DocumentAttachmentActionState,
  getDocumentAttachmentValuesFromFormData,
} from "@/features/documents/lib/documents.shared";
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

export async function uploadDocumentAttachmentAction(
  _previousState: DocumentAttachmentActionState,
  formData: FormData,
): Promise<DocumentAttachmentActionState> {
  const values = getDocumentAttachmentValuesFromFormData(formData);
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

  if (!values.documentId) {
    return {
      ok: false,
      message: "Invalid document record.",
      fieldErrors: {
        documentId: ["Invalid document record."],
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
      message: "That file type is not supported for document attachments.",
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
    const access = await requireOrganizationPermission("documents.manage");
    organizationId = access.organization.id;
    actorUserId = access.userId;
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return {
        ok: false,
        message: "You must be signed in to attach document files.",
        values,
      };
    }

    if (error instanceof MissingOrganizationError) {
      return {
        ok: false,
        message:
          "An active organization is required before uploading document attachments.",
        values,
      };
    }

    if (error instanceof ForbiddenError) {
      return {
        ok: false,
        message:
          "Your role cannot upload document attachments in this organization.",
        values,
      };
    }

    return {
      ok: false,
      message: "We could not verify your attachment access right now.",
      values,
    };
  }

  const document = await db.document.findFirst({
    where: {
      id: values.documentId,
      organizationId,
    },
    select: {
      id: true,
      title: true,
      isArchived: true,
    },
  });

  if (!document) {
    return {
      ok: false,
      message: "That document record no longer exists.",
      values,
    };
  }

  if (document.isArchived) {
    return {
      ok: false,
      message: "Archived document records cannot accept new attachments.",
      values,
    };
  }

  try {
    const upload = await uploadFileToCloudinary(file, {
      folder: `organizations/${organizationId}/documents/${document.id}`,
      publicIdPrefix: "document-attachment",
    });

    const attachment = await db.$transaction(async (tx) => {
      const created = await tx.attachment.create({
        data: {
          organizationId,
          ownerType: AttachmentOwnerType.DOCUMENT,
          documentId: document.id,
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
          message: `Attached file ${file.name} to document ${document.title}.`,
        },
      });

      return created;
    });

    revalidatePath("/dashboard/documents");
    revalidatePath(`/dashboard/documents/${document.id}`);

    return {
      ok: true,
      message: "Attachment uploaded successfully.",
      values: {
        documentId: document.id,
        fileName: "",
      },
      data: {
        documentId: document.id,
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
