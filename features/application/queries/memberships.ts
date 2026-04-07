import "server-only";

import { MembershipStatus, type Prisma } from "@prisma/client";
import { db } from "@/lib/db";

const membershipWithOrganizationInclude = {
  organization: true,
} satisfies Prisma.OrganizationMembershipInclude;

const membershipSummarySelect = {
  id: true,
  organizationId: true,
  userId: true,
  role: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.OrganizationMembershipSelect;

export type MembershipSummary = Prisma.OrganizationMembershipGetPayload<{
  select: typeof membershipSummarySelect;
}>;

export type ActiveMembership = Prisma.OrganizationMembershipGetPayload<{
  include: typeof membershipWithOrganizationInclude;
}>;

const organizationMembershipListSelect = {
  id: true,
  userId: true,
  role: true,
  status: true,
  departmentId: true,
  department: {
    select: {
      id: true,
      name: true,
    },
  },
  user: {
    select: {
      name: true,
      email: true,
    },
  },
} satisfies Prisma.OrganizationMembershipSelect;

export type OrganizationMembershipListItem =
  Prisma.OrganizationMembershipGetPayload<{
    select: typeof organizationMembershipListSelect;
  }>;

const membershipDetailSelect = {
  id: true,
  organizationId: true,
  userId: true,
  departmentId: true,
  role: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  department: {
    select: {
      id: true,
      name: true,
      code: true,
    },
  },
  user: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
} satisfies Prisma.OrganizationMembershipSelect;

export type OrganizationMembershipDetail =
  Prisma.OrganizationMembershipGetPayload<{
    select: typeof membershipDetailSelect;
  }>;

export const assignableDepartmentHeadCandidateSelect = {
  user: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  role: true,
} satisfies Prisma.OrganizationMembershipSelect;

export type AssignableDepartmentHeadCandidate =
  Prisma.OrganizationMembershipGetPayload<{
    select: typeof assignableDepartmentHeadCandidateSelect;
  }>;

export async function getUserMemberships(
  userId: string,
): Promise<MembershipSummary[]> {
  if (!userId) return [];

  return db.organizationMembership.findMany({
    where: { userId },
    orderBy: [{ status: "asc" }, { createdAt: "asc" }],
    select: membershipSummarySelect,
  });
}

export async function getActiveMembershipByUserId(
  userId: string,
): Promise<ActiveMembership | null> {
  if (!userId) return null;

  return db.organizationMembership.findFirst({
    where: {
      userId,
      status: MembershipStatus.ACTIVE,
    },
    orderBy: {
      createdAt: "asc",
    },
    include: membershipWithOrganizationInclude,
  });
}

export async function getMembershipsByOrganization(
  organizationId: string,
): Promise<OrganizationMembershipListItem[]> {
  if (!organizationId) return [];

  return db.organizationMembership.findMany({
    where: {
      organizationId,
    },
    orderBy: [
      { status: "asc" },
      { user: { name: "asc" } },
      { user: { email: "asc" } },
      { createdAt: "asc" },
    ],
    select: organizationMembershipListSelect,
  });
}

export async function getMembershipDetailByUserId(
  organizationId: string,
  userId: string,
): Promise<OrganizationMembershipDetail | null> {
  if (!organizationId || !userId) return null;

  return db.organizationMembership.findFirst({
    where: {
      organizationId,
      userId,
    },
    select: membershipDetailSelect,
  });
}

export async function getAssignableDepartmentHeadCandidates(
  organizationId: string,
): Promise<AssignableDepartmentHeadCandidate[]> {
  if (!organizationId) return [];

  return db.organizationMembership.findMany({
    where: {
      organizationId,
      status: MembershipStatus.ACTIVE,
    },
    orderBy: [
      { user: { name: "asc" } },
      { user: { email: "asc" } },
      { createdAt: "asc" },
    ],
    select: assignableDepartmentHeadCandidateSelect,
  });
}
