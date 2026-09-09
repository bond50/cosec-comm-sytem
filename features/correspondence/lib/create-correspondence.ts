"use server";

import {
  AuditAction,
  CorrespondenceStatus,
  DepartmentKind,
  DepartmentStatus,
  Prisma,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  type CorrespondenceCreateActionState,
  correspondenceCreateSchema,
  getCorrespondenceCreateValuesFromFormData,
  getCorrespondenceFieldErrors,
} from "@/features/correspondence/lib/correspondence.shared";
import { generateCorrespondenceReferenceNumber } from "@/features/correspondence/lib/correspondence-reference";
import {
  recordCorrespondenceAttachment,
  uploadCorrespondenceAttachmentFile,
  validateOptionalAttachmentFile,
} from "@/features/correspondence/lib/correspondence-attachment";
import { normalizeSenderOfficeName } from "@/features/correspondence/queries/sender-offices";
import { requireOrganizationPermission } from "@/features/auth/utils/require-organization-permission";
import {
  ForbiddenError,
  MissingOrganizationError,
  UnauthorizedError,
} from "@/features/auth/utils/auth-errors";
import { notifyCorrespondenceAwaitingReview } from "@/features/correspondence/lib/correspondence-notifications";

export async function createCorrespondenceAction(
  _previousState: CorrespondenceCreateActionState,
  formData: FormData,
): Promise<CorrespondenceCreateActionState> {
  const values = getCorrespondenceCreateValuesFromFormData(formData);

  const parsed = correspondenceCreateSchema.safeParse(values);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please correct the highlighted fields.",
      fieldErrors: getCorrespondenceFieldErrors(parsed.error),
      values,
    };
  }

  const attachmentValidation = validateOptionalAttachmentFile(formData);
  if (!attachmentValidation.ok) {
    return {
      ok: false,
      message: attachmentValidation.message,
      fieldErrors: {
        fileName: [attachmentValidation.message],
      },
      values: parsed.data,
    };
  }
  const attachmentFile = attachmentValidation.file;

  let organizationId: string;
  let actorUserId: string;
  let organizationName: string;
  let organizationSlug: string;

  try {
    const access = await requireOrganizationPermission(
      "correspondence.register",
    );
    organizationId = access.organization.id;
    organizationName = access.organization.name;
    organizationSlug = access.organization.slug;
    actorUserId = access.userId;
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return {
        ok: false,
        message: "You must be signed in to register correspondence.",
        values: parsed.data,
      };
    }

    if (error instanceof MissingOrganizationError) {
      return {
        ok: false,
        message:
          "An active organization is required before registering correspondence.",
        values: parsed.data,
      };
    }

    if (error instanceof ForbiddenError) {
      return {
        ok: false,
        message:
          "Your role cannot register correspondence in this organization.",
        values: parsed.data,
      };
    }

    return {
      ok: false,
      message:
        "We could not verify your organization right now. Please try again.",
      values: parsed.data,
    };
  }

  const receivedByUserId = actorUserId;
  let senderOffice = parsed.data.senderOffice;
  let sourceDepartmentId: string | null = null;

  if (parsed.data.sourceType === "INTERNAL") {
    const sourceDepartment = await db.department.findFirst({
      where: {
        id: parsed.data.sourceDepartmentId,
        organizationId,
        kind: DepartmentKind.EXECUTION,
        status: DepartmentStatus.ACTIVE,
      },
      select: {
        id: true,
        name: true,
        code: true,
      },
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

    senderOffice = sourceDepartment.code
      ? `${sourceDepartment.name} (${sourceDepartment.code})`
      : sourceDepartment.name;
    sourceDepartmentId = sourceDepartment.id;
  }

  try {
    const correspondence = await db.$transaction(async (tx) => {
      const senderOfficeDirectory = (
        tx as typeof tx & {
          correspondenceSenderOffice?: {
            upsert: (args: unknown) => Promise<unknown>;
          };
        }
      ).correspondenceSenderOffice;

      const referenceNumber = await generateCorrespondenceReferenceNumber(tx, {
        organizationId,
        organizationName,
        organizationSlug,
        now: new Date(parsed.data.receivedAt),
      });

      const created = await tx.correspondence.create({
        data: {
          organizationId,
          referenceNumber,
          type: parsed.data.type,
          subject: parsed.data.subject,
          description: parsed.data.description,
          senderName: parsed.data.senderName,
          senderOffice,
          sourceType: parsed.data.sourceType,
          sourceDepartmentId,
          deliveredBy: parsed.data.deliveredBy,
          deliveryMethod: parsed.data.deliveryMethod,
          deliveryMethodOther:
            parsed.data.deliveryMethod === "OTHER"
              ? parsed.data.deliveryMethodOther
              : null,
          receivedAt: new Date(parsed.data.receivedAt),
          receivedByUserId,
          priority: parsed.data.priority,
          confidentiality: parsed.data.confidentiality,
          status: CorrespondenceStatus.NEW,
        },
        select: {
          id: true,
          organizationId: true,
          referenceNumber: true,
          subject: true,
        },
      });

      await tx.correspondenceMovement.create({
        data: {
          organizationId,
          correspondenceId: created.id,
          toUserId: receivedByUserId,
          status: CorrespondenceStatus.NEW,
          note: `Registered correspondence ${created.referenceNumber}.`,
          createdByUserId: actorUserId,
        },
      });

      const auditLog = await tx.auditLog.create({
        data: {
          organizationId,
          actorUserId,
          entityType: "Correspondence",
          entityId: created.id,
          action: AuditAction.CREATE,
          message: `Registered correspondence ${created.referenceNumber}: ${created.subject}`,
          correspondenceId: created.id,
        },
        select: {
          id: true,
        },
      });

      if (senderOfficeDirectory) {
        await senderOfficeDirectory.upsert({
          where: {
            organizationId_normalizedName: {
              organizationId,
              normalizedName: normalizeSenderOfficeName(senderOffice),
            },
          },
          update: {
            name: senderOffice,
            usageCount: {
              increment: 1,
            },
            lastUsedAt: new Date(),
          },
          create: {
            organizationId,
            name: senderOffice,
            normalizedName: normalizeSenderOfficeName(senderOffice),
            lastUsedAt: new Date(),
          },
        });
      }

      await notifyCorrespondenceAwaitingReview({
        tx,
        organizationId,
        correspondenceId: created.id,
        referenceNumber: created.referenceNumber,
        actorUserId,
        auditLogId: auditLog.id,
      });

      return created;
    });

    let attachmentWarning: string | null = null;

    if (attachmentFile) {
      try {
        const upload = await uploadCorrespondenceAttachmentFile(
          attachmentFile,
          { organizationId, correspondenceId: correspondence.id },
        );

        await db.$transaction(async (tx) =>
          recordCorrespondenceAttachment(tx, {
            organizationId,
            correspondenceId: correspondence.id,
            referenceNumber: correspondence.referenceNumber,
            subject: correspondence.subject,
            actorUserId,
            file: attachmentFile,
            upload,
          }),
        );
      } catch {
        attachmentWarning =
          " The attachment could not be uploaded — attach it from the correspondence detail page.";
      }
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/correspondences");
    revalidatePath("/dashboard/correspondences/register");

    return {
      ok: true,
      message: `Correspondence registered successfully as ${correspondence.referenceNumber}.${attachmentWarning ?? ""}`,
      values: {
        ...parsed.data,
        subject: "",
        description: "",
        senderName: "",
        senderOffice: "",
        sourceDepartmentId:
          parsed.data.sourceType === "INTERNAL"
            ? parsed.data.sourceDepartmentId || ""
            : "",
        deliveredBy: "",
      },
      data: {
        correspondenceId: correspondence.id,
        organizationId: correspondence.organizationId,
        referenceNumber: correspondence.referenceNumber,
        senderOffice,
      },
    };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        ok: false,
        message:
          "We could not allocate a unique reference number right now. Please try again.",
        values: parsed.data,
      };
    }

    return {
      ok: false,
      message:
        "We could not register the correspondence right now. Please try again.",
      values: parsed.data,
    };
  }
}
