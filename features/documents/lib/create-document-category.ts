"use server";

import { AuditAction, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  documentCategoryCreateSchema,
  getDocumentCategoryCreateValuesFromFormData,
  getDocumentFieldErrors,
  type DocumentCategoryCreateActionState,
} from "@/features/documents/lib/documents.shared";
import { requireOrganizationPermission } from "@/features/auth/utils/require-organization-permission";
import {
  ForbiddenError,
  MissingOrganizationError,
  UnauthorizedError,
} from "@/features/auth/utils/auth-errors";

export async function createDocumentCategoryAction(
  _previousState: DocumentCategoryCreateActionState,
  formData: FormData,
): Promise<DocumentCategoryCreateActionState> {
  const values = getDocumentCategoryCreateValuesFromFormData(formData);
  const parsed = documentCategoryCreateSchema.safeParse(values);

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

    const category = await db.$transaction(async (tx) => {
      const created = await tx.documentCategory.create({
        data: {
          organizationId: access.organization.id,
          name: parsed.data.name,
          description: parsed.data.description,
        },
        select: {
          id: true,
        },
      });

      await tx.auditLog.create({
        data: {
          organizationId: access.organization.id,
          actorUserId: access.userId,
          entityType: "DocumentCategory",
          entityId: created.id,
          action: AuditAction.CREATE,
          message: `Created document category ${parsed.data.name}.`,
        },
      });

      return created;
    });

    revalidatePath("/dashboard/documents");

    return {
      ok: true,
      message: "Document category created.",
      values: {
        name: "",
        description: "",
      },
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
          "An active organization is required before creating categories.",
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
      message: "We could not create the document category right now.",
      values: parsed.data,
    };
  }
}
