import { UserRole } from "@prisma/client";

export const ADMIN_MEMBERSHIP_ROLES = [
  UserRole.SUPER_ADMIN,
  UserRole.ORG_ADMIN,
] as const;

export function isAdminRole(role: UserRole | null | undefined): boolean {
  return ADMIN_MEMBERSHIP_ROLES.includes(
    role as (typeof ADMIN_MEMBERSHIP_ROLES)[number],
  );
}
