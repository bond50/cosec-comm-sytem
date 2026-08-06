"use server";

import { AuditAction, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  documentCategoryUpdateSchema,
  getDocumentCategoryUpdateValuesFromFormData,
  getDocumentFieldErrors,
  type DocumentCategoryUpdateActionState,
} from "@/features/documents/lib/documents.shared";
import { requireOrganizationPermission } from "@/features/auth/utils/require-organization-permission";
import {
  ForbiddenError,
  MissingOrganizationError,
  UnauthorizedError,
} from "@/features/auth/utils/auth-errors";

export async function updateDocumentCategoryAction(
  _previousState: DocumentCategoryUpdateActionState,
  formData: FormData,
): Promise<DocumentCategoryUpdateActionState> {
  const values = getDocumentCategoryUpdateValuesFromFormData(formData);
  const parsed = documentCategoryUpdateSchema.safeParse(values);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please correct the highlighted category fields.",
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
      select: { id: true },
    });

    if (!category) {
      return {
        ok: false,
        message: "That document category no longer exists.",
        values: parsed.data,
      };
    }

    await db.$transaction(async (tx) => {
      await tx.documentCategory.update({
        where: { id: category.id },
        data: {
          name: parsed.data.name,
          description: parsed.data.description,
        },
      });

      await tx.auditLog.create({
        data: {
          organizationId: access.organization.id,
          actorUserId: access.userId,
          entityType: "DocumentCategory",
          entityId: category.id,
          action: AuditAction.UPDATE,
          message: `Updated document category ${parsed.data.name}.`,
        },
      });
    });

    revalidatePath("/dashboard/documents");

    return {
      ok: true,
      message: "Document category updated.",
      values: parsed.data,
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
          "An active organization is required before updating categories.",
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

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        ok: false,
        message:
          "That category name already exists in the current organization.",
        fieldErrors: {
          name: [
            "That category name already exists in the current organization.",
          ],
        },
        values: parsed.data,
      };
    }

    return {
      ok: false,
      message: "We could not update the document category right now.",
      values: parsed.data,
    };
  }
}
