import { UserRole } from "@prisma/client";

export type FoundationPermission =
  | "dashboard.view"
  | "access.view"
  | "members.view"
  | "members.manage"
  | "departments.view"
  | "departments.manage"
  | "correspondence.register"
  | "correspondence.review"
  | "correspondence.dispatch"
  | "correspondence.work"
  | "correspondence.close";

export type RoleDefinition = {
  role: UserRole;
  label: string;
  summary: string;
  responsibilities: string[];
};

export type AccessMapEntry = {
  kind: "page" | "action";
  target: string;
  permission: FoundationPermission | "organization.setup.create";
  allowedRoles: UserRole[] | null;
  description: string;
};

export const FOUNDATION_PERMISSION_LABELS: Record<
  FoundationPermission,
  string
> = {
  "dashboard.view": "View dashboard and organization foundation pages",
  "access.view": "View role matrix and access mapping",
  "members.view": "View organization members, roles, and assignments",
  "members.manage": "Create and manage organization memberships",
  "departments.view": "View departments and department structure",
  "departments.manage": "Create and manage departments and assignments",
  "correspondence.register": "Receive and register incoming correspondence",
  "correspondence.review": "Review correspondence and issue instructions",
  "correspondence.dispatch": "Dispatch correspondence to responsible units",
  "correspondence.work": "Work on assigned correspondence and submit feedback",
  "correspondence.close": "Close correspondence after resolution and oversight",
};

export const FOUNDATION_PERMISSION_ROLES: Record<
  FoundationPermission,
  UserRole[]
> = {
  "dashboard.view": [
    UserRole.SUPER_ADMIN,
    UserRole.ORG_ADMIN,
    UserRole.REGISTRY_OFFICER,
    UserRole.REVIEWING_OFFICER,
    UserRole.DEPARTMENT_USER,
    UserRole.MANAGEMENT,
    UserRole.USER,
  ],
  "access.view": [
    UserRole.SUPER_ADMIN,
    UserRole.ORG_ADMIN,
    UserRole.MANAGEMENT,
  ],
  "members.view": [
    UserRole.SUPER_ADMIN,
    UserRole.ORG_ADMIN,
    UserRole.MANAGEMENT,
  ],
  "members.manage": [UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN],
  "departments.view": [
    UserRole.SUPER_ADMIN,
    UserRole.ORG_ADMIN,
    UserRole.REGISTRY_OFFICER,
    UserRole.REVIEWING_OFFICER,
    UserRole.DEPARTMENT_USER,
    UserRole.MANAGEMENT,
  ],
  "departments.manage": [UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN],
  "correspondence.register": [
    UserRole.SUPER_ADMIN,
    UserRole.ORG_ADMIN,
    UserRole.REGISTRY_OFFICER,
  ],
  "correspondence.review": [
    UserRole.SUPER_ADMIN,
    UserRole.ORG_ADMIN,
    UserRole.REVIEWING_OFFICER,
    UserRole.MANAGEMENT,
  ],
  "correspondence.dispatch": [
    UserRole.SUPER_ADMIN,
    UserRole.ORG_ADMIN,
    UserRole.REGISTRY_OFFICER,
    UserRole.REVIEWING_OFFICER,
  ],
  "correspondence.work": [
    UserRole.SUPER_ADMIN,
    UserRole.ORG_ADMIN,
    UserRole.REVIEWING_OFFICER,
    UserRole.DEPARTMENT_USER,
    UserRole.MANAGEMENT,
    UserRole.USER,
  ],
  "correspondence.close": [
    UserRole.SUPER_ADMIN,
    UserRole.ORG_ADMIN,
    UserRole.REVIEWING_OFFICER,
    UserRole.MANAGEMENT,
  ],
};

export const ROLE_DEFINITIONS: RoleDefinition[] = [
  {
    role: UserRole.SUPER_ADMIN,
    label: "County System Admin",
    summary:
      "Emergency administration role for the county deployment. Reserved for recovery, support, and exceptional governance intervention.",
    responsibilities: [
      "Recover or unblock the county workspace when normal administration is not enough.",
      "Manage members, departments, and access policy across the county deployment.",
      "Intervene in correspondence operations only when escalation or system support is required.",
    ],
  },
  {
    role: UserRole.ORG_ADMIN,
    label: "County Admin",
    summary:
      "Primary administrative owner of the county workspace. Responsible for the people and routing structure that correspondence moves through.",
    responsibilities: [
      "Create and maintain members, departments, and departmental leadership.",
      "Assign roles and keep memberships active, suspended, or inactive as needed.",
      "Oversee correspondence configuration and accountability within the county workspace.",
    ],
  },
  {
    role: UserRole.REGISTRY_OFFICER,
    label: "Registry Officer",
    summary:
      "Front-door intake role for official communication entering or leaving the organization.",
    responsibilities: [
      "Receive and register correspondence.",
      "Prepare items for review and dispatch.",
      "Use department structure for routing, but not manage governance data.",
    ],
  },
  {
    role: UserRole.REVIEWING_OFFICER,
    label: "Reviewing Officer",
    summary:
      "Review authority that interprets correspondence and issues the next operational instruction.",
    responsibilities: [
      "Review newly registered correspondence.",
      "Set instructions, recommend assignments, and support dispatch decisions.",
      "Monitor progress on reviewed items.",
    ],
  },
  {
    role: UserRole.DEPARTMENT_USER,
    label: "Department User",
    summary:
      "Execution role inside a department. Works on dispatched items and returns progress or feedback.",
    responsibilities: [
      "Handle correspondence assigned to the user or their department.",
      "Provide progress and feedback on active work.",
      "Rely on organization admins for structure and access changes.",
    ],
  },
  {
    role: UserRole.MANAGEMENT,
    label: "Management",
    summary:
      "Oversight role focused on visibility, escalation, and closure decisions rather than foundation administration.",
    responsibilities: [
      "Monitor movement and accountability across departments.",
      "Participate in review, escalation, and closure decisions.",
      "Consume dashboards and structure information without running governance CRUD.",
    ],
  },
  {
    role: UserRole.USER,
    label: "User",
    summary:
      "Basic authenticated member role. Intended for constrained workload participation once assignment flows are live.",
    responsibilities: [
      "Access the business area with limited permissions.",
      "Participate only in explicitly assigned future workflows.",
      "Rely on organization admins for role, department, and lifecycle changes.",
    ],
  },
];

export const FOUNDATION_ACCESS_MAP: AccessMapEntry[] = [
  {
    kind: "page",
    target: "/dashboard/organization/setup",
    permission: "organization.setup.create",
    allowedRoles: null,
    description:
      "Authenticated users without an active organization can create the first organization and become ORG_ADMIN.",
  },
  {
    kind: "page",
    target: "/dashboard",
    permission: "dashboard.view",
    allowedRoles: FOUNDATION_PERMISSION_ROLES["dashboard.view"],
    description:
      "Foundation dashboard summarizing members, departments, and next steps.",
  },
  {
    kind: "page",
    target: "/dashboard/access",
    permission: "access.view",
    allowedRoles: FOUNDATION_PERMISSION_ROLES["access.view"],
    description:
      "Role matrix and access mapping for the current foundation phase.",
  },
  {
    kind: "page",
    target: "/dashboard/members",
    permission: "members.view",
    allowedRoles: FOUNDATION_PERMISSION_ROLES["members.view"],
    description:
      "Organization membership directory with role, status, and department information.",
  },
  {
    kind: "page",
    target: "/dashboard/members/add",
    permission: "members.manage",
    allowedRoles: FOUNDATION_PERMISSION_ROLES["members.manage"],
    description:
      "Create a new member account or attach an existing user to the current organization.",
  },
  {
    kind: "page",
    target: "/dashboard/members/[userId]",
    permission: "members.view",
    allowedRoles: FOUNDATION_PERMISSION_ROLES["members.view"],
    description:
      "Open a member record on its own page. Editing role, status, and department still requires members.manage.",
  },
  {
    kind: "page",
    target: "/dashboard/departments",
    permission: "departments.view",
    allowedRoles: FOUNDATION_PERMISSION_ROLES["departments.view"],
    description:
      "Department directory. Department creation on this page requires departments.manage.",
  },
  {
    kind: "page",
    target: "/dashboard/departments/[departmentId]",
    permission: "departments.view",
    allowedRoles: FOUNDATION_PERMISSION_ROLES["departments.view"],
    description: "Read department details, current head, and member list.",
  },
  {
    kind: "page",
    target: "/dashboard/departments/[departmentId]?mode=edit",
    permission: "departments.manage",
    allowedRoles: FOUNDATION_PERMISSION_ROLES["departments.manage"],
    description:
      "Open the inline department editor to update name, code, description, and lifecycle status.",
  },
  {
    kind: "page",
    target: "/dashboard/departments/[departmentId]/members",
    permission: "departments.manage",
    allowedRoles: FOUNDATION_PERMISSION_ROLES["departments.manage"],
    description: "Assign organization members to a department.",
  },
  {
    kind: "page",
    target: "/dashboard/departments/[departmentId]/head",
    permission: "departments.manage",
    allowedRoles: FOUNDATION_PERMISSION_ROLES["departments.manage"],
    description: "Assign the department head from active organization members.",
  },
  {
    kind: "action",
    target: "createOrganizationAction",
    permission: "organization.setup.create",
    allowedRoles: null,
    description:
      "Create the first organization for an authenticated user without an active organization.",
  },
  {
    kind: "action",
    target: "provisionMemberAction",
    permission: "members.manage",
    allowedRoles: FOUNDATION_PERMISSION_ROLES["members.manage"],
    description:
      "Create a new user account and immediately create the organization membership.",
  },
  {
    kind: "action",
    target: "addMemberAction",
    permission: "members.manage",
    allowedRoles: FOUNDATION_PERMISSION_ROLES["members.manage"],
    description: "Attach an existing user account to the current organization.",
  },
  {
    kind: "action",
    target: "updateMemberAccessAction",
    permission: "members.manage",
    allowedRoles: FOUNDATION_PERMISSION_ROLES["members.manage"],
    description:
      "Update member identity fields plus role, status, and department assignment.",
  },
  {
    kind: "action",
    target: "createDepartmentAction",
    permission: "departments.manage",
    allowedRoles: FOUNDATION_PERMISSION_ROLES["departments.manage"],
    description: "Create a department in the current organization.",
  },
  {
    kind: "action",
    target: "updateDepartmentAction",
    permission: "departments.manage",
    allowedRoles: FOUNDATION_PERMISSION_ROLES["departments.manage"],
    description:
      "Update department details and lifecycle status for the current organization.",
  },
  {
    kind: "action",
    target: "assignMemberToDepartmentAction",
    permission: "departments.manage",
    allowedRoles: FOUNDATION_PERMISSION_ROLES["departments.manage"],
    description:
      "Assign a member to a department within the current organization.",
  },
  {
    kind: "action",
    target: "assignDepartmentHeadAction",
    permission: "departments.manage",
    allowedRoles: FOUNDATION_PERMISSION_ROLES["departments.manage"],
    description:
      "Assign a department head from the active organization member pool.",
  },
];

export function hasFoundationPermission(
  role: UserRole | null | undefined,
  permission: FoundationPermission,
): boolean {
  if (!role) return false;

  return FOUNDATION_PERMISSION_ROLES[permission].includes(role);
}

export function getRoleDefinition(role: UserRole): RoleDefinition {
  return (
    ROLE_DEFINITIONS.find((definition) => definition.role === role) ??
    ROLE_DEFINITIONS[ROLE_DEFINITIONS.length - 1]
  );
}

export function getRoleLabel(role: UserRole): string {
  return getRoleDefinition(role).label;
}

export function isFoundationAdminRole(
  role: UserRole | null | undefined,
): boolean {
  return hasFoundationPermission(role, "members.manage");
}
