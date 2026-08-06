import {
  Building2,
  ClipboardList,
  ClipboardCheck,
  FileInput,
  FolderOpen,
  CalendarDays,
  KeyRound,
  LayoutDashboard,
  PieChart,
  Settings2,
  UserPlus,
  Users,
} from "lucide-react";
import {
  hasCorrespondenceWorkspaceAccess,
  hasDocumentWorkspaceAccess,
  hasFoundationPermission,
  hasMeetingWorkspaceAccess,
} from "@/features/auth/utils/role-access";
import type { MembershipRoleInput } from "@/features/auth/utils/roles";

export type DashboardNavItem = {
  label: string;
  icon: typeof LayoutDashboard;
  href?: string;
  match?: (pathname: string) => boolean;
  items?: DashboardNavItem[];
  defaultOpen?: boolean;
  external?: boolean;
};

export type DashboardNavSection = {
  label: string;
  items: DashboardNavItem[];
  defaultOpen?: boolean;
};

export function getDashboardNavigation(
  hasActiveOrganization: boolean,
  organizationRoles?: MembershipRoleInput,
): DashboardNavSection[] {
  if (!hasActiveOrganization) {
    return [
      {
        label: "Setup",
        items: [
          {
            label: "Organization Setup",
            href: "/dashboard/organization/setup",
            icon: Settings2,
            match: (pathname) =>
              pathname.startsWith("/dashboard/organization/setup"),
          },
        ],
      },
    ];
  }

  return [
    {
      label: "Workspace",
      defaultOpen: true,
      items: [
        {
          label: "Dashboard",
          href: "/dashboard",
          icon: LayoutDashboard,
          match: (pathname: string) => pathname === "/dashboard",
        },
        {
          label: "Reports",
          href: "/dashboard/reports",
          icon: PieChart,
          match: (pathname: string) =>
            pathname.startsWith("/dashboard/reports"),
        },
        {
          label: "UAT test guide",
          href: "/uat-pass-playbook.html",
          icon: ClipboardCheck,
          external: true,
          match: () => false,
        },
        ...(hasFoundationPermission(organizationRoles, "members.view") ||
        hasFoundationPermission(organizationRoles, "departments.view")
          ? [
              {
                label: "People & structure",
                icon: Users,
                defaultOpen: true,
                items: [
                  ...(hasFoundationPermission(organizationRoles, "members.view")
                    ? [
                        {
                          label: "Members",
                          href: "/dashboard/members",
                          icon: Users,
                          match: (pathname: string) =>
                            pathname === "/dashboard/members" ||
                            /^\/dashboard\/members\/[^/]+$/.test(pathname),
                        },
                      ]
                    : []),
                  ...(hasFoundationPermission(
                    organizationRoles,
                    "departments.view",
                  )
                    ? [
                        {
                          label: "Manage entities",
                          href: "/dashboard/departments",
                          icon: Building2,
                          match: (pathname: string) =>
                            pathname.startsWith("/dashboard/departments"),
                        },
                        ...(hasFoundationPermission(
                          organizationRoles,
                          "departments.manage",
                        )
                          ? [
                              {
                                label: "Add entity",
                                href: "/dashboard/departments?create=1",
                                icon: Building2,
                                match: () => false,
                              },
                            ]
                          : []),
                      ]
                    : []),
                ],
              },
            ]
          : []),
        ...(hasCorrespondenceWorkspaceAccess(organizationRoles)
          ? [
              {
                label: "Correspondence",
                icon: ClipboardList,
                defaultOpen: true,
                items: [
                  {
                    label: "Register",
                    href: "/dashboard/correspondences/register",
                    icon: FileInput,
                    match: (pathname: string) =>
                      pathname === "/dashboard/correspondences/register",
                  },
                  {
                    label: "All correspondence",
                    href: "/dashboard/correspondences",
                    icon: ClipboardList,
                    match: (pathname: string) =>
                      pathname === "/dashboard/correspondences" ||
                      /^\/dashboard\/correspondences\/[^/]+$/.test(pathname),
                  },
                ].filter(
                  (item) =>
                    item.href !== "/dashboard/correspondences/register" ||
                    hasFoundationPermission(
                      organizationRoles,
                      "correspondence.register",
                    ),
                ),
              },
            ]
          : []),
        ...(hasDocumentWorkspaceAccess(organizationRoles) ||
        hasMeetingWorkspaceAccess(organizationRoles)
          ? [
              {
                label: "Records & meetings",
                icon: FolderOpen,
                defaultOpen: false,
                items: [
                  ...(hasDocumentWorkspaceAccess(organizationRoles)
                    ? [
                        {
                          label: "Documents",
                          href: "/dashboard/documents",
                          icon: FolderOpen,
                          match: (pathname: string) =>
                            pathname.startsWith("/dashboard/documents"),
                        },
                      ]
                    : []),
                  ...(hasMeetingWorkspaceAccess(organizationRoles)
                    ? [
                        {
                          label: "Meetings",
                          href: "/dashboard/meetings",
                          icon: CalendarDays,
                          match: (pathname: string) =>
                            pathname === "/dashboard/meetings" ||
                            (/^\/dashboard\/meetings\/[^/]+$/.test(pathname) &&
                              !pathname.startsWith(
                                "/dashboard/meetings/action-points",
                              )),
                        },
                        {
                          label: "My action points",
                          href: "/dashboard/meetings/action-points",
                          icon: ClipboardList,
                          match: (pathname: string) =>
                            pathname.startsWith(
                              "/dashboard/meetings/action-points",
                            ),
                        },
                      ]
                    : []),
                ],
              },
            ]
          : []),
      ],
    },
    {
      label: "Administration",
      defaultOpen: true,
      items: [
        ...(hasFoundationPermission(organizationRoles, "members.manage") ||
        hasFoundationPermission(organizationRoles, "access.view")
          ? [
              {
                label: "Administration tools",
                icon: Settings2,
                defaultOpen: true,
                items: [
                  ...(hasFoundationPermission(
                    organizationRoles,
                    "members.manage",
                  )
                    ? [
                        {
                          label: "Add member",
                          href: "/dashboard/members?create=1",
                          icon: UserPlus,
                          match: () => false,
                        },
                      ]
                    : []),
                  ...(hasFoundationPermission(organizationRoles, "access.view")
                    ? [
                        {
                          label: "Roles & access",
                          href: "/dashboard/access",
                          icon: KeyRound,
                          match: (pathname: string) =>
                            pathname === "/dashboard/access",
                        },
                      ]
                    : []),
                ],
              },
            ]
          : []),
      ],
    },
  ].filter((section) => section.items.length > 0);
}
