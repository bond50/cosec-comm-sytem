import { UserRole } from "@prisma/client";

export const EDITABLE_MEMBERSHIP_ROLES = [
  UserRole.ORG_ADMIN,
  UserRole.REGISTRY_OFFICER,
  UserRole.REVIEWING_OFFICER,
  UserRole.DEPARTMENT_USER,
  UserRole.MANAGEMENT,
  UserRole.USER,
] as const;

export const ADMIN_MEMBERSHIP_ROLES = [
  UserRole.SUPER_ADMIN,
  UserRole.ORG_ADMIN,
] as const;

export const MEMBERSHIP_ROLE_PRECEDENCE = [
  UserRole.SUPER_ADMIN,
  UserRole.ORG_ADMIN,
  UserRole.REVIEWING_OFFICER,
  UserRole.MANAGEMENT,
  UserRole.REGISTRY_OFFICER,
  UserRole.DEPARTMENT_USER,
  UserRole.USER,
] as const;

export type MembershipRoleInput = UserRole | UserRole[] | null | undefined;

export function normalizeMembershipRoles(
  roles: MembershipRoleInput,
): UserRole[] {
  const normalized = Array.isArray(roles) ? roles : roles ? [roles] : [];
  const seen = new Set<UserRole>();

  for (const role of normalized) {
    seen.add(role);
  }

  return MEMBERSHIP_ROLE_PRECEDENCE.filter((role) => seen.has(role));
}

export function resolvePrimaryRole(
  roles: MembershipRoleInput,
): UserRole | null {
  const normalized = normalizeMembershipRoles(roles);
  return normalized[0] ?? null;
}

export function isAdminRole(roles: MembershipRoleInput): boolean {
  const normalized = normalizeMembershipRoles(roles);

  return normalized.some((role) =>
    ADMIN_MEMBERSHIP_ROLES.includes(
      role as (typeof ADMIN_MEMBERSHIP_ROLES)[number],
    ),
  );
}

export function hasMembershipRole(
  roles: MembershipRoleInput,
  expectedRole: UserRole,
): boolean {
  return normalizeMembershipRoles(roles).includes(expectedRole);
}
