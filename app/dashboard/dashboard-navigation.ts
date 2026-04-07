import {
  Building2,
  KeyRound,
  LayoutDashboard,
  Settings2,
  UserPlus,
  Users,
} from "lucide-react";
import type { UserRole } from "@prisma/client";
import { hasFoundationPermission } from "@/features/auth/utils/role-access";

export type DashboardNavItem = {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  match: (pathname: string) => boolean;
};

export type DashboardNavSection = {
  label: string;
  items: DashboardNavItem[];
  defaultOpen?: boolean;
};

export function getDashboardNavigation(
  hasActiveOrganization: boolean,
  organizationRole?: UserRole | null,
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
        ...(hasFoundationPermission(organizationRole, "members.view")
          ? [
              {
                label: "Members",
                href: "/dashboard/members",
                icon: Users,
                match: (pathname: string) => pathname === "/dashboard/members",
              },
            ]
          : []),
        ...(hasFoundationPermission(organizationRole, "departments.view")
          ? [
              {
                label: "Departments",
                href: "/dashboard/departments",
                icon: Building2,
                match: (pathname: string) =>
                  pathname.startsWith("/dashboard/departments"),
              },
            ]
          : []),
      ],
    },
    {
      label: "Administration",
      defaultOpen: true,
      items: [
        ...(hasFoundationPermission(organizationRole, "members.manage")
          ? [
              {
                label: "Add Member",
                href: "/dashboard/members/add",
                icon: UserPlus,
                match: (pathname: string) =>
                  pathname === "/dashboard/members/add",
              },
            ]
          : []),
        ...(hasFoundationPermission(organizationRole, "access.view")
          ? [
              {
                label: "Roles & Access",
                href: "/dashboard/access",
                icon: KeyRound,
                match: (pathname: string) => pathname === "/dashboard/access",
              },
            ]
          : []),
      ],
    },
  ].filter((section) => section.items.length > 0);
}
