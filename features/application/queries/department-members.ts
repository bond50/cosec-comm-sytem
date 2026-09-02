import "server-only";

import { type MembershipStatus, Prisma, type UserRole } from "@prisma/client";
import { db } from "@/lib/db";
import { requireCurrentOrganization } from "@/features/auth/utils/current-organization";

const departmentMemberSelect = {
  userId: true,
  role: true,
  roles: true,
  status: true,
  user: {
    select: {
      name: true,
      email: true,
      designation: true,
    },
  },
} satisfies Prisma.OrganizationMembershipSelect;

const departmentMemberSelectWithoutRoles = {
  userId: true,
  role: true,
  status: true,
  user: {
    select: {
      name: true,
      email: true,
      designation: true,
    },
  },
} satisfies Prisma.OrganizationMembershipSelect;

export type DepartmentMember = {
  userId: string;
  name: string | null;
  email: string | null;
  designation: string | null;
  role: UserRole;
  roles: UserRole[];
  status: MembershipStatus;
};

type DepartmentMemberQueryResult =
  | Prisma.OrganizationMembershipGetPayload<{
      select: typeof departmentMemberSelect;
    }>
  | Prisma.OrganizationMembershipGetPayload<{
      select: typeof departmentMemberSelectWithoutRoles;
    }>;

function isUnknownRolesSelectError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientValidationError &&
    error.message.includes("Unknown field `roles`")
  );
}

export async function getDepartmentMembers(
  departmentId: string,
): Promise<DepartmentMember[]> {
  if (!departmentId) return [];

  const organization = await requireCurrentOrganization();

  const department = await db.department.findFirst({
    where: {
      id: departmentId,
      organizationId: organization.id,
    },
    select: {
      id: true,
    },
  });

  if (!department) return [];

  const where = {
    organizationId: organization.id,
    departmentId: department.id,
  } as const;
  const orderBy: Prisma.OrganizationMembershipOrderByWithRelationInput[] = [
    { user: { name: "asc" } },
    { user: { email: "asc" } },
    { createdAt: "asc" },
  ];

  let memberships: DepartmentMemberQueryResult[] = [];

  try {
    memberships = await db.organizationMembership.findMany({
      where,
      orderBy,
      select: departmentMemberSelect,
    });
  } catch (error) {
    if (!isUnknownRolesSelectError(error)) throw error;

    memberships = await db.organizationMembership.findMany({
      where,
      orderBy,
      select: departmentMemberSelectWithoutRoles,
    });
  }

  return memberships.map((membership) => ({
    userId: membership.userId,
    name: membership.user.name,
    email: membership.user.email,
    designation: membership.user.designation,
    role: membership.role,
    roles:
      "roles" in membership &&
      Array.isArray(membership.roles) &&
      membership.roles.length > 0
        ? membership.roles
        : [membership.role],
    status: membership.status,
  }));
}
