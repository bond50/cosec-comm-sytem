"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  Building2,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  FileInput,
  FolderOpen,
  KeyRound,
  LogOut,
  PanelLeft,
  Search,
  Users,
  Workflow,
} from "lucide-react";
import type { UserRole } from "@prisma/client";
import { logout } from "@/features/auth/actions/logout";
import { switchOrganization } from "@/features/auth/actions/switch-organization";
import { DashboardHeaderTitle } from "@/app/dashboard/dashboard-header-title";
import { DashboardCommandPalette } from "@/app/dashboard/dashboard-command-palette";
import { DashboardNotificationsMenu } from "@/app/dashboard/dashboard-notifications-menu";
import type {
  NotificationGroup,
  NotificationItem,
} from "@/features/notifications/queries/notifications";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  getPrimaryRoleLabel,
  getRoleLabels,
  hasCorrespondenceWorkspaceAccess,
  hasDocumentWorkspaceAccess,
  hasFoundationPermission,
  hasMeetingWorkspaceAccess,
} from "@/features/auth/utils/role-access";

type DashboardHeaderProps = {
  organizationName: string;
  hasActiveOrganization: boolean;
  activeOrganizations: {
    id: string;
    name: string;
    slug: string;
    role: UserRole;
    roles: UserRole[];
    isCurrent: boolean;
  }[];
  user: {
    id: string;
    name: string | null;
    email: string | null;
    organizationRole: UserRole | null;
    organizationRoles: UserRole[] | null;
  } | null;
  notifications: {
    unreadCount: number;
    unreadActionRequiredCount: number;
    unreadReminderCount: number;
    items: NotificationItem[];
    unreadItems: NotificationItem[];
    groups: NotificationGroup[];
    unreadGroups: NotificationGroup[];
  };
  searchHistory: {
    saved: {
      id: string;
      query: string;
      normalizedQuery: string;
      isSaved: boolean;
      searchCount: number;
      lastSearchedAt: Date;
    }[];
    recent: {
      id: string;
      query: string;
      normalizedQuery: string;
      isSaved: boolean;
      searchCount: number;
      lastSearchedAt: Date;
    }[];
    frequent: {
      id: string;
      query: string;
      normalizedQuery: string;
      isSaved: boolean;
      searchCount: number;
      lastSearchedAt: Date;
    }[];
    stats: {
      savedCount: number;
      recentCount: number;
      frequentCount: number;
    };
  };
  onOpenNavigation: () => void;
};

function getInitials(name: string | null, email: string | null) {
  const source = name?.trim() || email?.trim() || "U";
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
}

export function DashboardHeader({
  organizationName,
  hasActiveOrganization,
  activeOrganizations,
  user,
  notifications,
  searchHistory,
  onOpenNavigation,
}: DashboardHeaderProps) {
  const initials = getInitials(user?.name ?? null, user?.email ?? null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSwitching, startSwitchTransition] = useTransition();
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const currentQuery = searchParams.get("q") ?? "";
  const organizationRoleLabel = user?.organizationRoles?.length
    ? getPrimaryRoleLabel(user.organizationRoles)
    : "No assigned role";
  const organizationRoleSummary = user?.organizationRoles?.length
    ? getRoleLabels(user.organizationRoles).join(", ")
    : "No assigned role";
  const showAccessLink = hasFoundationPermission(
    user?.organizationRoles,
    "access.view",
  );
  const showMembersLink = hasFoundationPermission(
    user?.organizationRoles,
    "members.view",
  );
  const showDepartmentsLink = hasFoundationPermission(
    user?.organizationRoles,
    "departments.view",
  );
  const showCorrespondenceRegisterLink = hasFoundationPermission(
    user?.organizationRoles,
    "correspondence.register",
  );
  const showDocumentsLink = hasDocumentWorkspaceAccess(user?.organizationRoles);
  const showMeetingsLink = hasMeetingWorkspaceAccess(user?.organizationRoles);
  const showCorrespondenceListLink = hasCorrespondenceWorkspaceAccess(
    user?.organizationRoles,
  );
  const showWorkspaceSwitcher = activeOrganizations.length > 1;

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandPaletteOpen(true);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  function handleOrganizationSwitch(organizationId: string) {
    startSwitchTransition(async () => {
      const formData = new FormData();
      formData.set("organizationId", organizationId);
      const result = await switchOrganization(formData);

      if (result.ok) {
        router.refresh();
      }
    });
  }

  function handleLogout() {
    startSwitchTransition(async () => {
      await logout();
      router.refresh();
    });
  }

  return (
    <>
      <DashboardCommandPalette
        key={commandPaletteOpen ? `open:${currentQuery}` : "closed"}
        open={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        currentQuery={currentQuery}
        roles={user?.organizationRoles ?? null}
        searchHistory={searchHistory}
        notifications={notifications.items}
      />

      <header className="sticky top-0 z-30 border-b border-black/10 bg-[var(--brand-header)]">
        <div className="flex h-[78px] items-center justify-between gap-6 px-5 sm:px-6 lg:px-8">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <button
              type="button"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white lg:hidden"
              aria-label="Navigation"
              onClick={onOpenNavigation}
            >
              <PanelLeft className="h-5 w-5" />
            </button>

            <div className="min-w-0 max-w-[360px] flex-1">
              <DashboardHeaderTitle />
            </div>
          </div>

          <div className="hidden flex-1 justify-center md:flex">
            <button
              type="button"
              className="flex h-12 w-full max-w-[460px] items-center gap-3 rounded-2xl border border-white/20 bg-transparent px-4 text-left transition hover:bg-white/10"
              onClick={() => setCommandPaletteOpen(true)}
              aria-label="Open workspace search"
            >
              <Search className="h-4.5 w-4.5 text-white/70" />
              <span className="min-w-0 flex-1 truncate text-sm text-white/70">
                {currentQuery || "Search workspace"}
              </span>
              <span className="rounded-lg border border-white/20 bg-transparent px-2 py-1 text-[0.68rem] font-medium text-white/70">
                Ctrl K
              </span>
            </button>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white transition hover:bg-white/15 md:hidden"
              aria-label="Open workspace search"
              onClick={() => setCommandPaletteOpen(true)}
            >
              <Search className="h-4.5 w-4.5" />
            </button>

            <div className="hidden items-center gap-2 xl:flex">
              {showWorkspaceSwitcher ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="hidden min-w-[220px] items-center justify-between gap-3 rounded-2xl border border-transparent px-4 py-2.5 text-left transition hover:bg-white/10 2xl:flex"
                    >
                      <div className="min-w-0">
                        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-white/60">
                          Workspace
                        </p>
                        <p className="truncate text-sm font-medium text-white">
                          {hasActiveOrganization
                            ? organizationName
                            : "Setup required"}
                        </p>
                      </div>
                      <ChevronDown className="h-4 w-4 text-white/70" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[320px]">
                    <DropdownMenuLabel className="px-3 py-2.5">
                      <div className="text-sm font-semibold text-slate-950">
                        Switch workspace
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        Choose the active organization for this session.
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {activeOrganizations.map((organization) => (
                      <DropdownMenuItem
                        key={organization.id}
                        asChild
                        disabled={organization.isCurrent || isSwitching}
                      >
                        <button
                          type="button"
                          className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm"
                          onClick={() =>
                            handleOrganizationSwitch(organization.id)
                          }
                        >
                          <div className="min-w-0">
                            <div className="truncate font-medium text-slate-800">
                              {organization.name}
                            </div>
                            <div className="truncate text-xs text-slate-500">
                              {getPrimaryRoleLabel(organization.roles)}
                            </div>
                          </div>
                          {organization.isCurrent ? (
                            <span className="rounded-full bg-slate-900 px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-white">
                              Current
                            </span>
                          ) : null}
                        </button>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="hidden min-w-[220px] rounded-2xl border border-transparent px-4 py-2.5 2xl:block">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-white/60">
                    Workspace
                  </p>
                  <p className="truncate text-sm font-medium text-white">
                    {hasActiveOrganization
                      ? organizationName
                      : "Setup required"}
                  </p>
                </div>
              )}
            </div>

            <DashboardNotificationsMenu notifications={notifications} />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center gap-3 rounded-2xl border border-transparent px-3 py-2 transition hover:bg-white/10"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--brand-sidebar)] text-xs font-semibold text-white">
                    {initials}
                  </div>
                  <div className="hidden min-w-0 text-left sm:block">
                    <p className="truncate text-sm font-medium text-white">
                      {user?.name || "Authenticated User"}
                    </p>
                    <p className="truncate text-xs text-white/70">
                      Role: {organizationRoleLabel}
                    </p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-white/70" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[300px]">
                <DropdownMenuLabel className="px-3 py-2.5">
                  <div className="text-sm font-semibold text-slate-950">
                    {user?.name || "Authenticated User"}
                  </div>
                  <div className="mt-1 text-xs font-medium text-slate-500">
                    {user?.email || "No email"}
                  </div>
                  <div className="mt-3 space-y-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <span className="font-semibold uppercase tracking-[0.12em] text-slate-400">
                        Role
                      </span>
                      <span className="font-medium text-slate-700">
                        {organizationRoleLabel}
                      </span>
                    </div>
                    <div className="text-xs leading-5 text-slate-500">
                      {organizationRoleSummary}
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {showWorkspaceSwitcher ? (
                  <>
                    <DropdownMenuLabel className="px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                      Workspaces
                    </DropdownMenuLabel>
                    {activeOrganizations.map((organization) => (
                      <DropdownMenuItem
                        key={organization.id}
                        asChild
                        disabled={organization.isCurrent || isSwitching}
                      >
                        <button
                          type="button"
                          className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-700"
                          onClick={() =>
                            handleOrganizationSwitch(organization.id)
                          }
                        >
                          <span className="inline-flex min-w-0 items-center gap-3">
                            <Building2 className="h-4 w-4" />
                            <span className="truncate">
                              {organization.name}
                            </span>
                          </span>
                          {organization.isCurrent ? (
                            <span className="rounded-full bg-slate-100 px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-slate-600">
                              Current
                            </span>
                          ) : null}
                        </button>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                  </>
                ) : null}
                {showMembersLink ? (
                  <DropdownMenuItem asChild>
                    <Link
                      href={
                        hasActiveOrganization
                          ? "/dashboard/members"
                          : "/dashboard/organization/setup"
                      }
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700"
                    >
                      <Users className="h-4 w-4" />
                      Members
                    </Link>
                  </DropdownMenuItem>
                ) : null}
                {showDepartmentsLink ? (
                  <DropdownMenuItem asChild>
                    <Link
                      href={
                        hasActiveOrganization
                          ? "/dashboard/departments"
                          : "/dashboard/organization/setup"
                      }
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700"
                    >
                      <Workflow className="h-4 w-4" />
                      Departments
                    </Link>
                  </DropdownMenuItem>
                ) : null}
                {showCorrespondenceListLink ? (
                  <DropdownMenuItem asChild>
                    <Link
                      href={
                        hasActiveOrganization
                          ? "/dashboard/correspondences"
                          : "/dashboard/organization/setup"
                      }
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700"
                    >
                      <ClipboardList className="h-4 w-4" />
                      Correspondence
                    </Link>
                  </DropdownMenuItem>
                ) : null}
                {showDocumentsLink ? (
                  <DropdownMenuItem asChild>
                    <Link
                      href={
                        hasActiveOrganization
                          ? "/dashboard/documents"
                          : "/dashboard/organization/setup"
                      }
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700"
                    >
                      <FolderOpen className="h-4 w-4" />
                      Documents
                    </Link>
                  </DropdownMenuItem>
                ) : null}
                {showMeetingsLink ? (
                  <DropdownMenuItem asChild>
                    <Link
                      href={
                        hasActiveOrganization
                          ? "/dashboard/meetings"
                          : "/dashboard/organization/setup"
                      }
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700"
                    >
                      <CalendarDays className="h-4 w-4" />
                      Meetings
                    </Link>
                  </DropdownMenuItem>
                ) : null}
                {showCorrespondenceRegisterLink ? (
                  <DropdownMenuItem asChild>
                    <Link
                      href={
                        hasActiveOrganization
                          ? "/dashboard/correspondences/register"
                          : "/dashboard/organization/setup"
                      }
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700"
                    >
                      <FileInput className="h-4 w-4" />
                      Register correspondence
                    </Link>
                  </DropdownMenuItem>
                ) : null}
                {showAccessLink ? (
                  <DropdownMenuItem asChild>
                    <Link
                      href="/dashboard/access"
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700"
                    >
                      <KeyRound className="h-4 w-4" />
                      Roles & Access
                    </Link>
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild variant="destructive">
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4" />
                    Log out
                  </button>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
    </>
  );
}
