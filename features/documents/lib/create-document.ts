"use server";

import {
  AuditAction,
  DepartmentKind,
  DepartmentStatus,
  Prisma,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { generateDocumentReferenceNumber } from "@/features/documents/lib/document-reference";
import {
  documentCreateSchema,
  getDocumentCreateValuesFromFormData,
  getDocumentFieldErrors,
  type DocumentCreateActionState,
} from "@/features/documents/lib/documents.shared";
import { requireOrganizationPermission } from "@/features/auth/utils/require-organization-permission";
import {
  ForbiddenError,
  MissingOrganizationError,
  UnauthorizedError,
} from "@/features/auth/utils/auth-errors";

export async function createDocumentAction(
  _previousState: DocumentCreateActionState,
  formData: FormData,
): Promise<DocumentCreateActionState> {
  const values = getDocumentCreateValuesFromFormData(formData);
  const parsed = documentCreateSchema.safeParse(values);

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

    const document = await db.$transaction(async (tx) => {
      const referenceNumber = await generateDocumentReferenceNumber(tx, {
        organizationId: access.organization.id,
        organizationName: access.organization.name,
        organizationSlug: access.organization.slug,
      });

      const created = await tx.document.create({
        data: {
          organizationId: access.organization.id,
          correspondenceId: parsed.data.correspondenceId,
          categoryId: parsed.data.categoryId,
          referenceNumber,
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
          createdByUserId: access.userId,
        },
        select: {
          id: true,
        },
      });

      await tx.auditLog.create({
        data: {
          organizationId: access.organization.id,
          actorUserId: access.userId,
          entityType: "Document",
          entityId: created.id,
          action: AuditAction.CREATE,
          message: `Created document record ${referenceNumber}: ${parsed.data.title}.`,
          correspondenceId: parsed.data.correspondenceId,
        },
      });

      return created;
    });

    revalidatePath("/dashboard/documents");
    if (parsed.data.correspondenceId) {
      revalidatePath(
        `/dashboard/correspondences/${parsed.data.correspondenceId}`,
      );
    }

    return {
      ok: true,
      message: "Document record created.",
      values: {
        title: "",
        description: "",
        categoryId: "",
        correspondenceId: "",
        sourceType: "EXTERNAL",
        sourceDepartmentId: "",
        originOffice: "",
        broughtBy: "",
        medium: parsed.data.medium,
        currentHolderUserId: "",
        currentLocation: "",
        status: parsed.data.status,
      },
      data: {
        documentId: document.id,
        organizationId: access.organization.id,
      },
    };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return {
        ok: false,
        message: "You must be signed in to create document records.",
        values: parsed.data,
      };
    }

    if (error instanceof MissingOrganizationError) {
      return {
        ok: false,
        message:
          "An active organization is required before creating documents.",
        values: parsed.data,
      };
    }

    if (error instanceof ForbiddenError) {
      return {
        ok: false,
        message:
          "Your role cannot create document records in this organization.",
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
      message: "We could not create the document record right now.",
      values: parsed.data,
    };
  }
}
