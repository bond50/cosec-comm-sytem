import "server-only";

import { MembershipStatus, Prisma, type UserRole } from "@prisma/client";
import { db } from "@/lib/db";

const activeOrganizationMembershipSelect = {
  role: true,
  roles: true,
  organization: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
} as const;

const activeOrganizationMembershipSelectWithoutRoles = {
  role: true,
  organization: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
} as const;

export type ActiveOrganizationMembershipOption = {
  role: UserRole;
  roles: UserRole[];
  organization: {
    id: string;
    name: string;
    slug: string;
  };
};

function isUnknownRolesSelectError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientValidationError &&
    error.message.includes("Unknown field `roles`")
  );
}

function normalizeActiveOrganizationMembership<
  T extends {
    role: UserRole;
    roles?: UserRole[];
    organization: {
      id: string;
      name: string;
      slug: string;
    };
  } | null,
>(membership: T): ActiveOrganizationMembershipOption | null {
  if (!membership) return null;

  return {
    role: membership.role,
    roles:
      membership.roles && membership.roles.length > 0
        ? membership.roles
        : [membership.role],
    organization: membership.organization,
  };
}

export async function getActiveOrganizationMembershipByUserId(
  userId: string,
  organizationId?: string | null,
) {
  const where = {
    userId,
    status: MembershipStatus.ACTIVE,
    ...(organizationId ? { organizationId } : {}),
  } as const;

  try {
    const membership = await db.organizationMembership.findFirst({
      where,
      select: activeOrganizationMembershipSelect,
      orderBy: {
        createdAt: "asc",
      },
    });

    return normalizeActiveOrganizationMembership(membership);
  } catch (error) {
    if (!isUnknownRolesSelectError(error)) throw error;

    const membership = await db.organizationMembership.findFirst({
      where,
      select: activeOrganizationMembershipSelectWithoutRoles,
      orderBy: {
        createdAt: "asc",
      },
    });

    return normalizeActiveOrganizationMembership(membership);
  }
}

export async function getActiveOrganizationMembershipsByUserId(
  userId: string,
): Promise<ActiveOrganizationMembershipOption[]> {
  if (!userId) return [];

  const where = {
    userId,
    status: MembershipStatus.ACTIVE,
  } as const;

  try {
    const memberships = await db.organizationMembership.findMany({
      where,
      select: activeOrganizationMembershipSelect,
      orderBy: {
        createdAt: "asc",
      },
    });

    return memberships.map((membership) =>
      normalizeActiveOrganizationMembership(membership),
    ) as ActiveOrganizationMembershipOption[];
  } catch (error) {
    if (!isUnknownRolesSelectError(error)) throw error;

    const memberships = await db.organizationMembership.findMany({
      where,
      select: activeOrganizationMembershipSelectWithoutRoles,
      orderBy: {
        createdAt: "asc",
      },
    });

    return memberships.map((membership) =>
      normalizeActiveOrganizationMembership(membership),
    ) as ActiveOrganizationMembershipOption[];
  }
}
