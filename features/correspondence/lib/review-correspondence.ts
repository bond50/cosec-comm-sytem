"use server";

import { AuditAction, CorrespondenceStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  type CorrespondenceReviewActionState,
  correspondenceReviewSchema,
  getCorrespondenceFieldErrors,
  getCorrespondenceReviewValuesFromFormData,
} from "@/features/correspondence/lib/correspondence.shared";
import { requireOrganizationPermission } from "@/features/auth/utils/require-organization-permission";
import { hasCountySecretaryAuthority } from "@/features/auth/utils/role-access";
import {
  ForbiddenError,
  MissingOrganizationError,
  UnauthorizedError,
} from "@/features/auth/utils/auth-errors";
import { notifyCorrespondenceReviewed } from "@/features/correspondence/lib/correspondence-notifications";

export async function reviewCorrespondenceAction(
  _previousState: CorrespondenceReviewActionState,
  formData: FormData,
): Promise<CorrespondenceReviewActionState> {
  const values = getCorrespondenceReviewValuesFromFormData(formData);

  const parsed = correspondenceReviewSchema.safeParse(values);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please correct the highlighted fields.",
      fieldErrors: getCorrespondenceFieldErrors(parsed.error),
      values,
    };
  }

  let organizationId: string;
  let actorUserId: string;

  try {
    const access = await requireOrganizationPermission("correspondence.review");
    organizationId = access.organization.id;
    actorUserId = access.userId;
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return {
        ok: false,
        message: "You must be signed in to review correspondence.",
        values: parsed.data,
      };
    }

    if (error instanceof MissingOrganizationError) {
      return {
        ok: false,
        message:
          "An active organization is required before reviewing correspondence.",
        values: parsed.data,
      };
    }

    if (error instanceof ForbiddenError) {
      return {
        ok: false,
        message:
          "Your role is not part of the County Secretary review authority path in this organization.",
        values: parsed.data,
      };
    }

    return {
      ok: false,
      message:
        "We could not verify your County Secretary review access right now.",
      values: parsed.data,
    };
  }

  const reviewedByUserId = actorUserId;

  const [reviewerMembership, correspondence] = await Promise.all([
    db.organizationMembership.findFirst({
      where: {
        organizationId,
        userId: actorUserId,
        status: "ACTIVE",
      },
      select: {
        userId: true,
        roles: true,
      },
    }),
    db.correspondence.findFirst({
      where: {
        id: parsed.data.correspondenceId,
        organizationId,
      },
      select: {
        id: true,
        referenceNumber: true,
        subject: true,
        status: true,
        assignedToDepartmentId: true,
        assignedToUserId: true,
        receivedByUserId: true,
      },
    }),
  ]);

  if (!reviewerMembership) {
    return {
      ok: false,
      message: "Your active organization membership could not be verified.",
      values: parsed.data,
    };
  }

  if (!hasCountySecretaryAuthority(reviewerMembership.roles)) {
    return {
      ok: false,
      message:
        "Only the County Secretary authority path can record review instructions.",
      values: parsed.data,
    };
  }

  if (!correspondence) {
    return {
      ok: false,
      message: "That correspondence record no longer exists.",
      values: parsed.data,
    };
  }

  const reviewAllowedStatuses: CorrespondenceStatus[] = [
    CorrespondenceStatus.NEW,
    CorrespondenceStatus.UNDER_REVIEW,
    CorrespondenceStatus.DISPATCHED,
    CorrespondenceStatus.IN_PROGRESS,
    CorrespondenceStatus.AWAITING_FEEDBACK,
  ];

  if (!reviewAllowedStatuses.includes(correspondence.status)) {
    return {
      ok: false,
      message:
        "Only active correspondence can receive another County Secretary review.",
      fieldErrors: {
        status: [
          "Closed, cancelled, or completed correspondence must be reopened before review.",
        ],
      },
      values: parsed.data,
    };
  }

  const reviewedAt = new Date();

  const nextStatus =
    correspondence.status === CorrespondenceStatus.NEW
      ? CorrespondenceStatus.UNDER_REVIEW
      : correspondence.status;

  await db.$transaction(async (tx) => {
    await tx.correspondence.update({
      where: {
        id: correspondence.id,
      },
      data: {
        reviewedAt,
        reviewedByUserId,
        instructions: parsed.data.instructions,
        status: nextStatus,
      },
    });

    await tx.correspondenceMovement.create({
      data: {
        organizationId,
        correspondenceId: correspondence.id,
        fromDepartmentId: correspondence.assignedToDepartmentId,
        fromUserId:
          correspondence.assignedToUserId ?? correspondence.receivedByUserId,
        toDepartmentId: correspondence.assignedToDepartmentId,
        toUserId: reviewedByUserId,
        status: nextStatus,
        note: `Reviewed correspondence ${correspondence.referenceNumber} and updated instructions.`,
        createdByUserId: actorUserId,
        movedAt: reviewedAt,
      },
    });

    const auditLog = await tx.auditLog.create({
      data: {
        organizationId,
        actorUserId,
        entityType: "Correspondence",
        entityId: correspondence.id,
        action: AuditAction.REVIEW,
        message: `Reviewed correspondence ${correspondence.referenceNumber}: ${correspondence.subject}`,
        correspondenceId: correspondence.id,
      },
      select: {
        id: true,
      },
    });

    await notifyCorrespondenceReviewed({
      tx,
      organizationId,
      correspondenceId: correspondence.id,
      referenceNumber: correspondence.referenceNumber,
      actorUserId,
      auditLogId: auditLog.id,
    });
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/correspondences");
  revalidatePath(`/dashboard/correspondences/${correspondence.id}`);

  return {
    ok: true,
    message: "Review details saved successfully.",
    values: {
      ...parsed.data,
      status: nextStatus,
    },
    data: {
      correspondenceId: correspondence.id,
      organizationId,
    },
  };
}
