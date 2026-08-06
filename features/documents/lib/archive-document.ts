"use server";

import { AuditAction, DocumentStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  documentArchiveSchema,
  getDocumentArchiveValuesFromFormData,
  getDocumentFieldErrors,
  type DocumentArchiveActionState,
} from "@/features/documents/lib/documents.shared";
import { requireOrganizationPermission } from "@/features/auth/utils/require-organization-permission";
import {
  ForbiddenError,
  MissingOrganizationError,
  UnauthorizedError,
} from "@/features/auth/utils/auth-errors";

export async function archiveDocumentAction(
  _previousState: DocumentArchiveActionState,
  formData: FormData,
): Promise<DocumentArchiveActionState> {
  const values = getDocumentArchiveValuesFromFormData(formData);
  const parsed = documentArchiveSchema.safeParse(values);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Invalid document record.",
      fieldErrors: getDocumentFieldErrors(parsed.error),
      values,
    };
  }

  try {
    const access = await requireOrganizationPermission("documents.archive");
    const document = await db.document.findFirst({
      where: {
        id: parsed.data.documentId,
        organizationId: access.organization.id,
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
        values: parsed.data,
      };
    }

    if (document.isArchived) {
      return {
        ok: false,
        message: "That document is already archived.",
        values: parsed.data,
      };
    }

    await db.$transaction(async (tx) => {
      await tx.document.update({
        where: {
          id: document.id,
        },
        data: {
          isArchived: true,
          archivedAt: new Date(),
          archivedByUserId: access.userId,
          status: DocumentStatus.ARCHIVED,
        },
      });

      await tx.auditLog.create({
        data: {
          organizationId: access.organization.id,
          actorUserId: access.userId,
          entityType: "Document",
          entityId: document.id,
          action: AuditAction.CLOSE,
          message: `Archived document record ${document.title}.`,
        },
      });
    });

    revalidatePath("/dashboard/documents");

    return {
      ok: true,
      message: "Document archived successfully.",
      values: parsed.data,
      data: {
        documentId: document.id,
        organizationId: access.organization.id,
      },
    };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return {
        ok: false,
        message: "You must be signed in to archive documents.",
        values: parsed.data,
      };
    }

    if (error instanceof MissingOrganizationError) {
      return {
        ok: false,
        message:
          "An active organization is required before archiving documents.",
        values: parsed.data,
      };
    }

    if (error instanceof ForbiddenError) {
      return {
        ok: false,
        message: "Your role cannot archive documents in this organization.",
        values: parsed.data,
      };
    }

    return {
      ok: false,
      message: "We could not archive the document right now.",
      values: parsed.data,
    };
  }
}
