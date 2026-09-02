import "server-only";

import { CorrespondenceConfidentiality, type Prisma } from "@prisma/client";
import {
  hasCorrespondenceIntakeClearance,
  hasFullCorrespondenceClearance,
} from "@/features/auth/utils/role-access";
import type { MembershipRoleInput } from "@/features/auth/utils/roles";

export type CorrespondenceViewerScope = {
  userId: string;
  departmentId: string | null;
  roles: MembershipRoleInput;
};

export type CorrespondenceConfidentialityRecord = {
  confidentiality: CorrespondenceConfidentiality;
  assignedToDepartmentId: string | null;
  assignedToUserId: string | null;
  receivedByUserId: string | null;
  reviewedByUserId: string | null;
  assignedByUserId?: string | null;
};

/**
 * Confidentiality + assignment access policy for correspondence, shared by
 * every read path (dashboard, list, detail, search) so they can never drift
 * from each other:
 *
 * - Full clearance (ORG_ADMIN/SUPER_ADMIN/Reviewing Officer/Management):
 *   every record, every tier, org-wide.
 * - Intake clearance (Registry Officer): every record org-wide up to
 *   CONFIDENTIAL; HIGHLY_CONFIDENTIAL only if they're a direct participant.
 * - Everyone else: records assigned to their own department or to them
 *   directly, same as today, EXCEPT at HIGHLY_CONFIDENTIAL — department-wide
 *   access does not extend to that tier, only the specifically named
 *   participant can see it.
 */
export function canViewCorrespondenceConfidentiality(
  viewer: CorrespondenceViewerScope,
  record: CorrespondenceConfidentialityRecord,
): boolean {
  if (hasFullCorrespondenceClearance(viewer.roles)) return true;

  const isDirectParticipant =
    record.assignedToUserId === viewer.userId ||
    record.receivedByUserId === viewer.userId ||
    record.reviewedByUserId === viewer.userId ||
    record.assignedByUserId === viewer.userId;

  if (hasCorrespondenceIntakeClearance(viewer.roles)) {
    if (
      record.confidentiality !==
      CorrespondenceConfidentiality.HIGHLY_CONFIDENTIAL
    ) {
      return true;
    }
    return isDirectParticipant;
  }

  if (
    record.confidentiality === CorrespondenceConfidentiality.HIGHLY_CONFIDENTIAL
  ) {
    return isDirectParticipant;
  }

  const isOwnDepartment =
    !!record.assignedToDepartmentId &&
    record.assignedToDepartmentId === viewer.departmentId;

  return isDirectParticipant || isOwnDepartment;
}

/**
 * The same policy expressed as a Prisma where-clause, for scoping list and
 * summary queries instead of filtering already-loaded rows. Returns
 * `undefined` for full clearance (no filter needed).
 */
export function buildCorrespondenceVisibilityWhere(
  viewer: CorrespondenceViewerScope | undefined,
): Prisma.CorrespondenceWhereInput | undefined {
  if (!viewer) return undefined;
  if (hasFullCorrespondenceClearance(viewer.roles)) return undefined;

  const participantOr: Prisma.CorrespondenceWhereInput[] = [
    { assignedToUserId: viewer.userId },
    { receivedByUserId: viewer.userId },
    { reviewedByUserId: viewer.userId },
    { assignedByUserId: viewer.userId },
  ];

  if (hasCorrespondenceIntakeClearance(viewer.roles)) {
    return {
      OR: [
        {
          confidentiality: {
            not: CorrespondenceConfidentiality.HIGHLY_CONFIDENTIAL,
          },
        },
        {
          confidentiality: CorrespondenceConfidentiality.HIGHLY_CONFIDENTIAL,
          OR: participantOr,
        },
      ],
    };
  }

  const deptOr: Prisma.CorrespondenceWhereInput[] = viewer.departmentId
    ? [...participantOr, { assignedToDepartmentId: viewer.departmentId }]
    : participantOr;

  return {
    OR: [
      {
        confidentiality: {
          not: CorrespondenceConfidentiality.HIGHLY_CONFIDENTIAL,
        },
        OR: deptOr,
      },
      {
        confidentiality: CorrespondenceConfidentiality.HIGHLY_CONFIDENTIAL,
        OR: participantOr,
      },
    ],
  };
}
