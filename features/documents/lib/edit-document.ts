"use server";

import {
  AuditAction,
  DepartmentKind,
  DepartmentStatus,
  Prisma,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  documentUpdateSchema,
  getDocumentFieldErrors,
  getDocumentUpdateValuesFromFormData,
  type DocumentUpdateActionState,
} from "@/features/documents/lib/documents.shared";
import { requireOrganizationPermission } from "@/features/auth/utils/require-organization-permission";
import {
  ForbiddenError,
  MissingOrganizationError,
  UnauthorizedError,
} from "@/features/auth/utils/auth-errors";

export async function editDocumentAction(
  _previousState: DocumentUpdateActionState,
  formData: FormData,
): Promise<DocumentUpdateActionState> {
  const values = getDocumentUpdateValuesFromFormData(formData);
  const parsed = documentUpdateSchema.safeParse(values);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please correct the highlighted document fields.",
      fieldErrors: getDocumentFieldErrors(parsed.error),
      values,
    };
  }

  try {
    const access = await requireOrganizationPermission("documents.manage");
    const document = await db.document.findFirst({
      where: {
        id: parsed.data.documentId,
        organizationId: access.organization.id,
      },
      select: {
        id: true,
        title: true,
        isArchived: true,
        correspondenceId: true,
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
        message: "Archived document records cannot be edited.",
        values: parsed.data,
      };
    }

    const [category, correspondence, holder] = await Promise.all([
      parsed.data.categoryId
        ? db.documentCategory.findFirst({
            where: {
              id: parsed.data.categoryId,
              organizationId: access.organization.id,
            },
            select: { id: true },
          })
        : Promise.resolve(null),
      parsed.data.correspondenceId
        ? db.correspondence.findFirst({
            where: {
              id: parsed.data.correspondenceId,
              organizationId: access.organization.id,
            },
            select: { id: true },
          })
        : Promise.resolve(null),
      parsed.data.currentHolderUserId
        ? db.organizationMembership.findFirst({
            where: {
              organizationId: access.organization.id,
              userId: parsed.data.currentHolderUserId,
              status: "ACTIVE",
            },
            select: { userId: true },
          })
        : Promise.resolve(null),
    ]);

    if (parsed.data.categoryId && !category) {
      return {
        ok: false,
        message: "The selected category is not valid for this organization.",
        fieldErrors: {
          categoryId: [
            "The selected category is not valid for this organization.",
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

    if (parsed.data.currentHolderUserId && !holder) {
      return {
        ok: false,
        message:
          "The selected holder must be an active member of this organization.",
        fieldErrors: {
          currentHolderUserId: [
            "The selected holder must be an active member of this organization.",
          ],
        },
        values: parsed.data,
      };
    }

    let originOffice = parsed.data.originOffice ?? null;
    let sourceDepartmentId: string | null = null;

    if (parsed.data.sourceType === "INTERNAL") {
      const sourceDepartment = await db.department.findFirst({
        where: {
          id: parsed.data.sourceDepartmentId,
          organizationId: access.organization.id,
          kind: DepartmentKind.EXECUTION,
          status: DepartmentStatus.ACTIVE,
        },
        select: { id: true, name: true, code: true },
      });

      if (!sourceDepartment) {
        return {
          ok: false,
          message: "Select a valid internal source department.",
          fieldErrors: {
            sourceDepartmentId: [
              "Select an active executing department from this organization.",
            ],
          },
          values: parsed.data,
        };
      }

      originOffice = sourceDepartment.code
        ? `${sourceDepartment.name} (${sourceDepartment.code})`
        : sourceDepartment.name;
      sourceDepartmentId = sourceDepartment.id;
    }

    await db.$transaction(async (tx) => {
      await tx.document.update({
        where: {
          id: document.id,
        },
        data: {
          correspondenceId: parsed.data.correspondenceId,
          categoryId: parsed.data.categoryId,
          title: parsed.data.title,
          description: parsed.data.description,
          sourceType: parsed.data.sourceType,
          sourceDepartmentId,
          originOffice,
          broughtBy: parsed.data.broughtBy,
          medium: parsed.data.medium,
          currentHolderUserId: parsed.data.currentHolderUserId,
          currentLocation: parsed.data.currentLocation,
          status: parsed.data.status,
        },
      });

      await tx.auditLog.create({
        data: {
          organizationId: access.organization.id,
          actorUserId: access.userId,
          entityType: "Document",
          entityId: document.id,
          action: AuditAction.UPDATE,
          message: `Updated document record ${document.title}.`,
          correspondenceId: parsed.data.correspondenceId,
        },
      });
    });

    revalidatePath("/dashboard/documents");
    revalidatePath(`/dashboard/documents/${document.id}`);
    if (document.correspondenceId) {
      revalidatePath(`/dashboard/correspondences/${document.correspondenceId}`);
    }
    if (
      parsed.data.correspondenceId &&
      parsed.data.correspondenceId !== document.correspondenceId
    ) {
      revalidatePath(
        `/dashboard/correspondences/${parsed.data.correspondenceId}`,
      );
    }

    return {
      ok: true,
      message: "Document details updated.",
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
        message: "You must be signed in to edit document records.",
        values: parsed.data,
      };
    }

    if (error instanceof MissingOrganizationError) {
      return {
        ok: false,
        message: "An active organization is required before editing documents.",
        values: parsed.data,
      };
    }

    if (error instanceof ForbiddenError) {
      return {
        ok: false,
        message: "Your role cannot edit document records in this organization.",
        values: parsed.data,
      };
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      return {
        ok: false,
        message: "One of the selected linked records is no longer valid.",
        values: parsed.data,
      };
    }

    return {
      ok: false,
      message: "We could not update the document record right now.",
      values: parsed.data,
    };
  }
}
