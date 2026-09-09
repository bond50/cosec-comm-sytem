import "server-only";

import { AttachmentOwnerType, AuditAction, type Prisma } from "@prisma/client";
import { uploadFileToCloudinary } from "@/lib/cloudinary";

export const MAX_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024;
export const ALLOWED_ATTACHMENT_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg",
  "image/png",
  "text/plain",
] as const;

export type AttachmentFileValidation =
  { ok: true; file: File | null } | { ok: false; message: string };

/**
 * Reads an optional "file" field out of submitted FormData and validates it
 * (size + type) when present. Returns `{ ok: true, file: null }` when no
 * file was attached at all — callers that treat the attachment as optional
 * (registering correspondence, returning feedback) can proceed without one;
 * callers where a file is mandatory (the standalone attachment upload
 * action) should reject `file: null` themselves.
 */
export function validateOptionalAttachmentFile(
  formData: FormData,
): AttachmentFileValidation {
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return { ok: true, file: null };
  }

  if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
    return { ok: false, message: "Attachment size must be 10 MB or less." };
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
        "Supported file types are PDF, Word, Excel, JPEG, PNG, and text files.",
    };
  }

  return { ok: true, file };
}

/**
 * Uploads a validated file to Cloudinary. Deliberately kept outside any
 * Prisma transaction — network calls don't belong inside a `$transaction`.
 */
export function uploadCorrespondenceAttachmentFile(
  file: File,
  params: { organizationId: string; correspondenceId: string },
) {
  return uploadFileToCloudinary(file, {
    folder: `organizations/${params.organizationId}/correspondence/${params.correspondenceId}`,
    publicIdPrefix: "correspondence-attachment",
  });
}

/**
 * Creates the Attachment + audit log rows for a file already uploaded to
 * Cloudinary. Runs inside the caller's transaction so it can be composed
 * with correspondence creation, feedback, or the standalone upload action.
 */
export async function recordCorrespondenceAttachment(
  tx: Prisma.TransactionClient,
  params: {
    organizationId: string;
    correspondenceId: string;
    referenceNumber: string;
    subject: string;
    actorUserId: string;
    file: File;
    upload: { publicId: string; secureUrl: string; bytes: number };
  },
): Promise<{ id: string }> {
  const created = await tx.attachment.create({
    data: {
      organizationId: params.organizationId,
      ownerType: AttachmentOwnerType.CORRESPONDENCE,
      correspondenceId: params.correspondenceId,
      fileName: params.upload.publicId,
      originalName: params.file.name,
      mimeType: params.file.type || "application/octet-stream",
      fileSize: params.upload.bytes,
      storagePath: params.upload.secureUrl,
      uploadedByUserId: params.actorUserId,
    },
    select: {
      id: true,
    },
  });

  await tx.auditLog.create({
    data: {
      organizationId: params.organizationId,
      actorUserId: params.actorUserId,
      entityType: "Attachment",
      entityId: created.id,
      action: AuditAction.UPDATE,
      message: `Attached file ${params.file.name} to correspondence ${params.referenceNumber}: ${params.subject}`,
      correspondenceId: params.correspondenceId,
    },
  });

  return created;
}
