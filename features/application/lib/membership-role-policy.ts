import { DepartmentKind, type UserRole } from "@prisma/client";

export const CENTRAL_OFFICE_ALLOWED_MEMBERSHIP_ROLES = [
  "ORG_ADMIN",
  "REGISTRY_OFFICER",
  "REVIEWING_OFFICER",
  "MANAGEMENT",
  "USER",
] as const satisfies readonly UserRole[];

export const EXECUTION_ALLOWED_MEMBERSHIP_ROLES = [
  "DEPARTMENT_USER",
  "USER",
] as const satisfies readonly UserRole[];

export function getAllowedMembershipRolesForDepartmentKind(
  kind: DepartmentKind,
): UserRole[] {
  return kind === DepartmentKind.CENTRAL_OFFICE
    ? [...CENTRAL_OFFICE_ALLOWED_MEMBERSHIP_ROLES]
    : [...EXECUTION_ALLOWED_MEMBERSHIP_ROLES];
}

export function getMembershipRolePolicyHint(kind: DepartmentKind | null) {
  if (kind === DepartmentKind.CENTRAL_OFFICE) {
    return "Registry Officer, Reviewing Officer, Management, and Org Admin are central-office roles.";
  }

  if (kind === DepartmentKind.EXECUTION) {
    return "Execution departments are for Department User work. Registry and reviewing authority stay in the central office.";
  }

  return "Select a department first. Role options depend on whether the member belongs to the central office or an execution department.";
}

export function getMembershipRoleGuidance(role: UserRole) {
  switch (role) {
    case "REGISTRY_OFFICER":
      return "Only valid in the central office.";
    case "REVIEWING_OFFICER":
      return "Central-office review and routing authority.";
    case "MANAGEMENT":
      return "Central-office oversight aligned with the County Secretary path.";
    case "ORG_ADMIN":
      return "Administrative county workspace control.";
    case "DEPARTMENT_USER":
      return "Execution role for dispatched departmental work.";
    case "USER":
      return "Basic constrained participation role.";
    default:
      return undefined;
  }
}

export function areMembershipRolesAllowedForDepartmentKind(
  roles: UserRole[],
  kind: DepartmentKind,
) {
  const allowed = new Set(getAllowedMembershipRolesForDepartmentKind(kind));
  return roles.every((role) => allowed.has(role));
}
