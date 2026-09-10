import { UserRole } from "@prisma/client";
import {
  hasMembershipRole,
  normalizeMembershipRoles,
  resolvePrimaryRole,
  type MembershipRoleInput,
} from "@/features/auth/utils/roles";

export type FoundationPermission =
  | "dashboard.view"
  | "reports.view"
  | "access.view"
  | "members.view"
  | "members.manage"
  | "departments.view"
  | "departments.manage"
  | "documents.view"
  | "documents.manage"
  | "documents.archive"
  | "meetings.view"
  | "meetings.manage"
  | "correspondence.register"
  | "correspondence.review"
  | "correspondence.dispatch"
  | "correspondence.work"
  | "correspondence.close"
  | "attachments.upload";

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
  "dashboard.view":
    "View the county operations dashboard and office workspaces",
  "reports.view": "View organization-wide correspondence reports and analytics",
  "access.view": "View role matrix and access mapping",
  "members.view": "View county users, roles, and department placement",
  "members.manage": "Create and manage county user access",
  "departments.view": "View departments and department structure",
  "departments.manage": "Create and manage departments and assignments",
  "documents.view": "View the document registry and supporting records",
  "documents.manage": "Create document categories and document records",
  "documents.archive": "Archive completed or inactive document records",
  "meetings.view": "View meetings and action point workspaces",
  "meetings.manage": "Create and manage meetings",
  "correspondence.register": "Receive and register incoming correspondence",
  "correspondence.review": "Review correspondence and issue instructions",
  "correspondence.dispatch":
    "Route and dispatch correspondence to receiving offices",
  "correspondence.work": "Acknowledge dispatches and return office feedback",
  "correspondence.close": "Verify feedback and close or cancel correspondence",
  "attachments.upload":
    "Upload supporting files to correspondence, documents, and meetings",
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
  "reports.view": [
    UserRole.SUPER_ADMIN,
    UserRole.ORG_ADMIN,
    UserRole.REVIEWING_OFFICER,
    UserRole.MANAGEMENT,
  ],
  "access.view": [
    UserRole.SUPER_ADMIN,
    UserRole.ORG_ADMIN,
    UserRole.REVIEWING_OFFICER,
    UserRole.MANAGEMENT,
  ],
  "members.view": [
    UserRole.SUPER_ADMIN,
    UserRole.ORG_ADMIN,
    UserRole.REVIEWING_OFFICER,
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
  "documents.view": [
    UserRole.SUPER_ADMIN,
    UserRole.ORG_ADMIN,
    UserRole.REGISTRY_OFFICER,
    UserRole.REVIEWING_OFFICER,
    UserRole.DEPARTMENT_USER,
    UserRole.MANAGEMENT,
  ],
  "documents.manage": [
    UserRole.SUPER_ADMIN,
    UserRole.ORG_ADMIN,
    UserRole.REGISTRY_OFFICER,
    UserRole.REVIEWING_OFFICER,
    UserRole.MANAGEMENT,
  ],
  "documents.archive": [
    UserRole.SUPER_ADMIN,
    UserRole.ORG_ADMIN,
    UserRole.REVIEWING_OFFICER,
    UserRole.MANAGEMENT,
  ],
  "meetings.view": [
    UserRole.SUPER_ADMIN,
    UserRole.ORG_ADMIN,
    UserRole.REVIEWING_OFFICER,
    UserRole.DEPARTMENT_USER,
    UserRole.MANAGEMENT,
  ],
  "meetings.manage": [
    UserRole.SUPER_ADMIN,
    UserRole.ORG_ADMIN,
    UserRole.REVIEWING_OFFICER,
    UserRole.MANAGEMENT,
  ],
  "correspondence.register": [UserRole.SUPER_ADMIN, UserRole.REGISTRY_OFFICER],
  "correspondence.review": [
    UserRole.SUPER_ADMIN,
    UserRole.REVIEWING_OFFICER,
    UserRole.MANAGEMENT,
  ],
  "correspondence.dispatch": [
    UserRole.SUPER_ADMIN,
    UserRole.REVIEWING_OFFICER,
    UserRole.MANAGEMENT,
  ],
  "correspondence.work": [
    UserRole.SUPER_ADMIN,
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
  "attachments.upload": [
    UserRole.SUPER_ADMIN,
    UserRole.ORG_ADMIN,
    UserRole.REGISTRY_OFFICER,
    UserRole.REVIEWING_OFFICER,
    UserRole.DEPARTMENT_USER,
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
      "Maintain county structure and access without being the default operational authority for correspondence workflow decisions.",
    ],
  },
  {
    role: UserRole.REGISTRY_OFFICER,
    label: "Registry Officer",
    summary:
      "Front-door intake role for official communication entering the county workflow through the central office.",
    responsibilities: [
      "Receive and register correspondence.",
      "Prepare items for review by the central authority path.",
      "Support routing preparation without owning the final dispatch decision by default.",
    ],
  },
  {
    role: UserRole.REVIEWING_OFFICER,
    label: "Reviewing Officer",
    summary:
      "Main central-office workflow authority. This is the operational role that reviews correspondence and makes the routing decision.",
    responsibilities: [
      "Review newly registered correspondence.",
      "Set instructions, assign responsibility, and make dispatch decisions.",
      "Verify completion and drive closure decisions as the County Secretary workflow path.",
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
      "Oversight label for the same County Secretary authority path. Use this when the office wants visibility or control recorded as management as well.",
    responsibilities: [
      "Monitor movement and accountability across departments.",
      "Share review, dispatch, escalation, and closure authority with the reviewing path when assigned.",
      "Use alongside Reviewing Officer when the same office holder needs both operational and oversight visibility.",
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
    target: "/dashboard/reports",
    permission: "reports.view",
    allowedRoles: FOUNDATION_PERMISSION_ROLES["reports.view"],
    description:
      "Organization-wide correspondence SLA, workload, and trend reporting.",
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
    target: "/dashboard/notifications",
    permission: "dashboard.view",
    allowedRoles: FOUNDATION_PERMISSION_ROLES["dashboard.view"],
    description:
      "Notification workspace for grouped workflow alerts, reminders, unread filtering, and personal delivery preferences.",
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
    kind: "page",
    target: "/dashboard/documents",
    permission: "documents.view",
    allowedRoles: FOUNDATION_PERMISSION_ROLES["documents.view"],
    description:
      "Document registry for organization-scoped supporting records, categories, linked correspondence, and archive status.",
  },
  {
    kind: "page",
    target: "/dashboard/documents/[id]",
    permission: "documents.view",
    allowedRoles: FOUNDATION_PERMISSION_ROLES["documents.view"],
    description:
      "Open a single document record with linked correspondence, attachments, and archive state.",
  },
  {
    kind: "page",
    target: "/dashboard/meetings",
    permission: "meetings.view",
    allowedRoles: FOUNDATION_PERMISSION_ROLES["meetings.view"],
    description:
      "Meetings workspace for scheduling, listing, and later action point tracking inside the current organization.",
  },
  {
    kind: "page",
    target: "/dashboard/meetings/[id]",
    permission: "meetings.view",
    allowedRoles: FOUNDATION_PERMISSION_ROLES["meetings.view"],
    description:
      "Open a meeting record with its schedule, content summary, and action point tracking.",
  },
  {
    kind: "page",
    target: "/dashboard/correspondences",
    permission: "dashboard.view",
    allowedRoles: FOUNDATION_PERMISSION_ROLES["dashboard.view"],
    description:
      "County correspondence register for intake, review, dispatch, deadlines, feedback, and accountability.",
  },
  {
    kind: "page",
    target: "/dashboard/correspondences/register",
    permission: "correspondence.register",
    allowedRoles: FOUNDATION_PERMISSION_ROLES["correspondence.register"],
    description:
      "Register a new incoming correspondence record using the county intake fields.",
  },
  {
    kind: "page",
    target: "/dashboard/correspondences/[id]",
    permission: "dashboard.view",
    allowedRoles: FOUNDATION_PERMISSION_ROLES["dashboard.view"],
    description:
      "Full correspondence file with intake, review, routing, dispatch, feedback, verification, attachments, and accountability sections.",
  },
  {
    kind: "page",
    target: "/dashboard/correspondences/[id]?print=1",
    permission: "dashboard.view",
    allowedRoles: FOUNDATION_PERMISSION_ROLES["dashboard.view"],
    description:
      "Printable correspondence detail for office records, handover, and hard-copy filing.",
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
  {
    kind: "action",
    target: "updateNotificationPreferencesAction",
    permission: "dashboard.view",
    allowedRoles: FOUNDATION_PERMISSION_ROLES["dashboard.view"],
    description:
      "Update the current user's notification delivery preferences for the active organization.",
  },
  {
    kind: "action",
    target: "createDocumentCategoryAction",
    permission: "documents.manage",
    allowedRoles: FOUNDATION_PERMISSION_ROLES["documents.manage"],
    description: "Create a document category for the current organization.",
  },
  {
    kind: "action",
    target: "createDocumentAction",
    permission: "documents.manage",
    allowedRoles: FOUNDATION_PERMISSION_ROLES["documents.manage"],
    description:
      "Create a standalone document registry record and optionally link it to correspondence.",
  },
  {
    kind: "action",
    target: "archiveDocumentAction",
    permission: "documents.archive",
    allowedRoles: FOUNDATION_PERMISSION_ROLES["documents.archive"],
    description:
      "Archive a document record while preserving the audit trail and organization scope.",
  },
  {
    kind: "action",
    target: "uploadDocumentAttachmentAction",
    permission: "attachments.upload",
    allowedRoles: FOUNDATION_PERMISSION_ROLES["attachments.upload"],
    description:
      "Upload supporting files directly onto a document registry record.",
  },
  {
    kind: "action",
    target: "createMeetingAction",
    permission: "meetings.manage",
    allowedRoles: FOUNDATION_PERMISSION_ROLES["meetings.manage"],
    description: "Create a meeting record scoped to the current organization.",
  },
  {
    kind: "action",
    target: "createMeetingActionPointAction",
    permission: "meetings.manage",
    allowedRoles: FOUNDATION_PERMISSION_ROLES["meetings.manage"],
    description:
      "Create a meeting action point and optionally assign it to a department or user.",
  },
  {
    kind: "action",
    target: "updateMeetingActionPointAction",
    permission: "meetings.manage",
    allowedRoles: FOUNDATION_PERMISSION_ROLES["meetings.manage"],
    description:
      "Update action point assignee, due date, status, and remarks for the current meeting. The assignee or their department may also update status and remarks on their own action point without this permission.",
  },
  {
    kind: "action",
    target: "uploadMeetingAttachmentAction",
    permission: "attachments.upload",
    allowedRoles: FOUNDATION_PERMISSION_ROLES["attachments.upload"],
    description: "Upload supporting files directly onto a meeting record.",
  },
  {
    kind: "action",
    target: "createCorrespondenceAction",
    permission: "correspondence.register",
    allowedRoles: FOUNDATION_PERMISSION_ROLES["correspondence.register"],
    description:
      "Register correspondence and create the first movement and audit entries.",
  },
  {
    kind: "action",
    target: "reviewCorrespondenceAction",
    permission: "correspondence.review",
    allowedRoles: FOUNDATION_PERMISSION_ROLES["correspondence.review"],
    description:
      "Record County Secretary review instructions, timestamp, and reviewing officer identity for a correspondence item.",
  },
  {
    kind: "action",
    target: "assignCorrespondenceAction",
    permission: "correspondence.dispatch",
    allowedRoles: FOUNDATION_PERMISSION_ROLES["correspondence.dispatch"],
    description:
      "Record the central-office routing decision — one or more receiving departments, optional receiving officers, and a mandatory due date — and dispatch to every selected department at once.",
  },
  {
    kind: "action",
    target: "createDispatchAction",
    permission: "correspondence.dispatch",
    allowedRoles: FOUNDATION_PERMISSION_ROLES["correspondence.dispatch"],
    description:
      "Route an already-dispatched correspondence to an additional department in parallel, once its previous routing decision has been recorded.",
  },
  {
    kind: "action",
    target: "acknowledgeDispatchAction",
    permission: "correspondence.work",
    allowedRoles: FOUNDATION_PERMISSION_ROLES["correspondence.work"],
    description:
      "Confirm receipt of a dispatch as the receiving officer, receiving department, or oversight role.",
  },
  {
    kind: "action",
    target: "receiveDispatchFeedbackAction",
    permission: "correspondence.work",
    allowedRoles: FOUNDATION_PERMISSION_ROLES["correspondence.work"],
    description:
      "Return receiving-office feedback after acknowledgement and keep the movement trail explicit.",
  },
  {
    kind: "action",
    target: "uploadCorrespondenceAttachmentAction",
    permission: "attachments.upload",
    allowedRoles: FOUNDATION_PERMISSION_ROLES["attachments.upload"],
    description:
      "Upload supporting files to a correspondence record without collapsing into the documents module.",
  },
  {
    kind: "action",
    target: "closeCorrespondenceAction",
    permission: "correspondence.close",
    allowedRoles: FOUNDATION_PERMISSION_ROLES["correspondence.close"],
    description:
      "Verify returned feedback and close or cancel the correspondence file with an accountability note.",
  },
  {
    kind: "action",
    target: "reopenCorrespondenceAction",
    permission: "correspondence.close",
    allowedRoles: FOUNDATION_PERMISSION_ROLES["correspondence.close"],
    description:
      "Reopen closed or cancelled correspondence for another central-office review with a required justification.",
  },
];

export function hasFoundationPermission(
  roles: MembershipRoleInput,
  permission: FoundationPermission,
): boolean {
  return normalizeMembershipRoles(roles).some((role) =>
    FOUNDATION_PERMISSION_ROLES[permission].includes(role),
  );
}

export function hasCorrespondenceWorkspaceAccess(
  roles: MembershipRoleInput,
): boolean {
  return (
    hasFoundationPermission(roles, "correspondence.register") ||
    hasFoundationPermission(roles, "correspondence.review") ||
    hasFoundationPermission(roles, "correspondence.dispatch") ||
    hasFoundationPermission(roles, "correspondence.work") ||
    hasFoundationPermission(roles, "correspondence.close")
  );
}

export function hasOrgWideCorrespondenceVisibility(
  roles: MembershipRoleInput,
): boolean {
  return (
    hasFoundationPermission(roles, "reports.view") ||
    hasMembershipRole(roles, UserRole.REGISTRY_OFFICER)
  );
}

export function hasCountySecretaryAuthority(
  roles: MembershipRoleInput,
): boolean {
  return (
    hasMembershipRole(roles, UserRole.SUPER_ADMIN) ||
    hasMembershipRole(roles, UserRole.REVIEWING_OFFICER) ||
    hasMembershipRole(roles, UserRole.MANAGEMENT)
  );
}

/**
 * Full confidentiality clearance: can see every correspondence record at
 * every confidentiality tier, org-wide.
 */
export function hasFullCorrespondenceClearance(
  roles: MembershipRoleInput,
): boolean {
  return (
    hasCountySecretaryAuthority(roles) ||
    hasMembershipRole(roles, UserRole.ORG_ADMIN)
  );
}

/**
 * Intake clearance (Registry Officer): sees every correspondence record
 * org-wide up to CONFIDENTIAL; HIGHLY_CONFIDENTIAL records are visible only
 * while still being registered/reviewed or if the officer is a direct
 * participant on the record.
 */
export function hasCorrespondenceIntakeClearance(
  roles: MembershipRoleInput,
): boolean {
  return hasMembershipRole(roles, UserRole.REGISTRY_OFFICER);
}

export function hasRegistryDispatchCapability(
  roles: MembershipRoleInput,
): boolean {
  return (
    hasMembershipRole(roles, UserRole.REGISTRY_OFFICER) &&
    hasFoundationPermission(roles, "correspondence.dispatch")
  );
}

export function hasDocumentWorkspaceAccess(
  roles: MembershipRoleInput,
): boolean {
  return (
    hasFoundationPermission(roles, "documents.view") ||
    hasFoundationPermission(roles, "documents.manage") ||
    hasFoundationPermission(roles, "documents.archive")
  );
}

export function hasMeetingWorkspaceAccess(roles: MembershipRoleInput): boolean {
  return (
    hasFoundationPermission(roles, "meetings.view") ||
    hasFoundationPermission(roles, "meetings.manage")
  );
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

export function getRoleLabels(roles: MembershipRoleInput): string[] {
  return normalizeMembershipRoles(roles).map((role) => getRoleLabel(role));
}

export function getPrimaryRoleLabel(roles: MembershipRoleInput): string {
  const primaryRole = resolvePrimaryRole(roles);
  return primaryRole ? getRoleLabel(primaryRole) : getRoleLabel(UserRole.USER);
}

export function isFoundationAdminRole(roles: MembershipRoleInput): boolean {
  return hasFoundationPermission(roles, "members.manage");
}
