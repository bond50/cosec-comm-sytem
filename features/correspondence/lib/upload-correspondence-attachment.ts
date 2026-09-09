"use server";

import { CorrespondenceStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  type CorrespondenceAttachmentActionState,
  getCorrespondenceAttachmentValuesFromFormData,
} from "@/features/correspondence/lib/correspondence.shared";
import {
  recordCorrespondenceAttachment,
  uploadCorrespondenceAttachmentFile,
  validateOptionalAttachmentFile,
} from "@/features/correspondence/lib/correspondence-attachment";
import { requireOrganizationPermission } from "@/features/auth/utils/require-organization-permission";
import {
  ForbiddenError,
  MissingOrganizationError,
  UnauthorizedError,
} from "@/features/auth/utils/auth-errors";

export async function uploadCorrespondenceAttachmentAction(
  _previousState: CorrespondenceAttachmentActionState,
  formData: FormData,
): Promise<CorrespondenceAttachmentActionState> {
  const values = getCorrespondenceAttachmentValuesFromFormData(formData);
  const validation = validateOptionalAttachmentFile(formData);

  if (!validation.ok) {
    return {
      ok: false,
      message: validation.message,
      fieldErrors: {
        fileName: [validation.message],
      },
      values,
    };
  }

  if (!validation.file) {
    return {
      ok: false,
      message: "Select a file to attach.",
      fieldErrors: {
        fileName: ["Select a file to attach."],
      },
      values,
    };
  }

  const file = validation.file;

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
    const upload = await uploadCorrespondenceAttachmentFile(file, {
      organizationId,
      correspondenceId: correspondence.id,
    });

    const attachment = await db.$transaction(async (tx) =>
      recordCorrespondenceAttachment(tx, {
        organizationId,
        correspondenceId: correspondence.id,
        referenceNumber: correspondence.referenceNumber,
        subject: correspondence.subject,
        actorUserId,
        file,
        upload,
      }),
    );

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
