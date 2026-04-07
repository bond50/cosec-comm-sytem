import "server-only";

import {
  type MembershipStatus,
  type Prisma,
  type UserRole,
} from "@prisma/client";
import { db } from "@/lib/db";
import { requireCurrentOrganization } from "@/features/auth/utils/current-organization";

const departmentMemberSelect = {
  userId: true,
  role: true,
  status: true,
  user: {
    select: {
      name: true,
      email: true,
    },
  },
} satisfies Prisma.OrganizationMembershipSelect;

export type DepartmentMember = {
  userId: string;
  name: string | null;
  email: string | null;
  role: UserRole;
  status: MembershipStatus;
};

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

  const memberships = await db.organizationMembership.findMany({
    where: {
      organizationId: organization.id,
      departmentId: department.id,
    },
    orderBy: [
      { user: { name: "asc" } },
      { user: { email: "asc" } },
      { createdAt: "asc" },
    ],
    select: departmentMemberSelect,
  });

  return memberships.map((membership) => ({
    userId: membership.userId,
    name: membership.user.name,
    email: membership.user.email,
    role: membership.role,
    status: membership.status,
  }));
}
