"use server";

import { AuditAction } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  documentCategoryDeleteSchema,
  getDocumentCategoryDeleteValuesFromFormData,
  getDocumentFieldErrors,
  type DocumentCategoryDeleteActionState,
} from "@/features/documents/lib/documents.shared";
import { requireOrganizationPermission } from "@/features/auth/utils/require-organization-permission";
import {
  ForbiddenError,
  MissingOrganizationError,
  UnauthorizedError,
} from "@/features/auth/utils/auth-errors";

export async function deleteDocumentCategoryAction(
  _previousState: DocumentCategoryDeleteActionState,
  formData: FormData,
): Promise<DocumentCategoryDeleteActionState> {
  const values = getDocumentCategoryDeleteValuesFromFormData(formData);
  const parsed = documentCategoryDeleteSchema.safeParse(values);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Invalid document category.",
      fieldErrors: getDocumentFieldErrors(parsed.error),
      values,
    };
  }

  try {
    const access = await requireOrganizationPermission("documents.manage");
    const category = await db.documentCategory.findFirst({
      where: {
        id: parsed.data.categoryId,
        organizationId: access.organization.id,
      },
      select: {
        id: true,
        name: true,
        _count: { select: { documents: true } },
      },
    });

    if (!category) {
      return {
        ok: false,
        message: "That document category no longer exists.",
        values: parsed.data,
      };
    }

    if (category._count.documents > 0) {
      return {
        ok: false,
        message: `"${category.name}" has ${category._count.documents} document${category._count.documents === 1 ? "" : "s"} assigned to it. Reassign or archive those documents before deleting the category.`,
        values: parsed.data,
      };
    }

    await db.$transaction(async (tx) => {
      await tx.documentCategory.delete({
        where: { id: category.id },
      });

      await tx.auditLog.create({
        data: {
          organizationId: access.organization.id,
          actorUserId: access.userId,
          entityType: "DocumentCategory",
          entityId: category.id,
          action: AuditAction.DELETE,
          message: `Deleted document category ${category.name}.`,
        },
      });
    });

    revalidatePath("/dashboard/documents");

    return {
      ok: true,
      message: "Document category deleted.",
      values: { categoryId: "" },
      data: {
        categoryId: category.id,
        organizationId: access.organization.id,
      },
    };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return {
        ok: false,
        message: "You must be signed in to manage document categories.",
        values: parsed.data,
      };
    }

    if (error instanceof MissingOrganizationError) {
      return {
        ok: false,
        message:
          "An active organization is required before deleting categories.",
        values: parsed.data,
      };
    }

    if (error instanceof ForbiddenError) {
      return {
        ok: false,
        message:
          "Your role cannot manage document categories in this organization.",
        values: parsed.data,
      };
    }

    return {
      ok: false,
      message: "We could not delete the document category right now.",
      values: parsed.data,
    };
  }
}
