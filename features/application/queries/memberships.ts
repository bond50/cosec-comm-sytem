import "server-only";

import { MembershipStatus, Prisma, type UserRole } from "@prisma/client";
import { db } from "@/lib/db";

const membershipWithOrganizationInclude = {
  organization: true,
} satisfies Prisma.OrganizationMembershipInclude;

const membershipSummarySelect = {
  id: true,
  organizationId: true,
  userId: true,
  role: true,
  roles: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.OrganizationMembershipSelect;

const membershipSummarySelectWithoutRoles = {
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
  roles: true,
  status: true,
  departmentId: true,
  department: {
    select: {
      id: true,
      name: true,
      kind: true,
    },
  },
  user: {
    select: {
      name: true,
      email: true,
    },
  },
} satisfies Prisma.OrganizationMembershipSelect;

const organizationMembershipListSelectWithoutRoles = {
  id: true,
  userId: true,
  role: true,
  status: true,
  departmentId: true,
  department: {
    select: {
      id: true,
      name: true,
      kind: true,
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
  roles: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  department: {
    select: {
      id: true,
      name: true,
      code: true,
      kind: true,
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

const membershipDetailSelectWithoutRoles = {
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
      kind: true,
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
  roles: true,
} satisfies Prisma.OrganizationMembershipSelect;

const assignableDepartmentHeadCandidateSelectWithoutRoles = {
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

function isUnknownRolesSelectError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientValidationError &&
    error.message.includes("Unknown field `roles`")
  );
}

function normalizeMembershipRoles<
  T extends { role: UserRole; roles?: UserRole[] },
>(membership: T): Omit<T, "roles"> & { roles: UserRole[] } {
  return {
    ...membership,
    roles:
      Array.isArray(membership.roles) && membership.roles.length > 0
        ? membership.roles
        : [membership.role],
  };
}

export async function getUserMemberships(
  userId: string,
): Promise<MembershipSummary[]> {
  if (!userId) return [];

  try {
    const memberships = await db.organizationMembership.findMany({
      where: { userId },
      orderBy: [{ status: "asc" }, { createdAt: "asc" }],
      select: membershipSummarySelect,
    });

    return memberships.map((membership) =>
      normalizeMembershipRoles(membership),
    );
  } catch (error) {
    if (!isUnknownRolesSelectError(error)) throw error;

    const memberships = await db.organizationMembership.findMany({
      where: { userId },
      orderBy: [{ status: "asc" }, { createdAt: "asc" }],
      select: membershipSummarySelectWithoutRoles,
    });

    return memberships.map((membership) =>
      normalizeMembershipRoles(membership),
    ) as MembershipSummary[];
  }
}

export async function getActiveMembershipByUserId(
  userId: string,
  organizationId?: string | null,
): Promise<ActiveMembership | null> {
  if (!userId) return null;

  const membership = await db.organizationMembership.findFirst({
    where: {
      userId,
      status: MembershipStatus.ACTIVE,
      ...(organizationId ? { organizationId } : {}),
    },
    orderBy: {
      createdAt: "asc",
    },
    include: membershipWithOrganizationInclude,
  });

  return membership ? normalizeMembershipRoles(membership) : null;
}

export async function getActiveMembershipsByUserId(
  userId: string,
): Promise<ActiveMembership[]> {
  if (!userId) return [];

  const memberships = await db.organizationMembership.findMany({
    where: {
      userId,
      status: MembershipStatus.ACTIVE,
    },
    orderBy: {
      createdAt: "asc",
    },
    include: membershipWithOrganizationInclude,
  });

  return memberships.map((membership) => normalizeMembershipRoles(membership));
}

export async function getMembershipsByOrganization(
  organizationId: string,
): Promise<OrganizationMembershipListItem[]> {
  if (!organizationId) return [];

  const where = {
    organizationId,
  } as const;
  const orderBy: Prisma.OrganizationMembershipOrderByWithRelationInput[] = [
    { status: "asc" },
    { user: { name: "asc" } },
    { user: { email: "asc" } },
    { createdAt: "asc" },
  ];

  try {
    const memberships = await db.organizationMembership.findMany({
      where,
      orderBy,
      select: organizationMembershipListSelect,
    });

    return memberships.map((membership) =>
      normalizeMembershipRoles(membership),
    );
  } catch (error) {
    if (!isUnknownRolesSelectError(error)) throw error;

    const memberships = await db.organizationMembership.findMany({
      where,
      orderBy,
      select: organizationMembershipListSelectWithoutRoles,
    });

    return memberships.map((membership) =>
      normalizeMembershipRoles(membership),
    ) as OrganizationMembershipListItem[];
  }
}

export async function getMembershipDetailByUserId(
  organizationId: string,
  userId: string,
): Promise<OrganizationMembershipDetail | null> {
  if (!organizationId || !userId) return null;

  const where = {
    organizationId,
    userId,
  } as const;

  try {
    const membership = await db.organizationMembership.findFirst({
      where,
      select: membershipDetailSelect,
    });

    return membership ? normalizeMembershipRoles(membership) : null;
  } catch (error) {
    if (!isUnknownRolesSelectError(error)) throw error;

    const membership = await db.organizationMembership.findFirst({
      where,
      select: membershipDetailSelectWithoutRoles,
    });

    return membership
      ? (normalizeMembershipRoles(membership) as OrganizationMembershipDetail)
      : null;
  }
}

export async function getAssignableDepartmentHeadCandidates(
  organizationId: string,
): Promise<AssignableDepartmentHeadCandidate[]> {
  if (!organizationId) return [];

  const where = {
    organizationId,
    status: MembershipStatus.ACTIVE,
  } as const;
  const orderBy: Prisma.OrganizationMembershipOrderByWithRelationInput[] = [
    { user: { name: "asc" } },
    { user: { email: "asc" } },
    { createdAt: "asc" },
  ];

  try {
    const memberships = await db.organizationMembership.findMany({
      where,
      orderBy,
      select: assignableDepartmentHeadCandidateSelect,
    });

    return memberships.map((membership) =>
      normalizeMembershipRoles(membership),
    );
  } catch (error) {
    if (!isUnknownRolesSelectError(error)) throw error;

    const memberships = await db.organizationMembership.findMany({
      where,
      orderBy,
      select: assignableDepartmentHeadCandidateSelectWithoutRoles,
    });

    return memberships.map((membership) =>
      normalizeMembershipRoles(membership),
    ) as AssignableDepartmentHeadCandidate[];
  }
}
