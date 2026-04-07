import Link from "next/link";
import {
  Bell,
  ChevronDown,
  LogOut,
  KeyRound,
  MoonStar,
  PanelLeft,
  Search,
  Users,
  Workflow,
} from "lucide-react";
import type { UserRole } from "@prisma/client";
import { logout } from "@/features/auth/actions/logout";
import { DashboardHeaderTitle } from "@/app/dashboard/dashboard-header-title";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  getRoleLabel,
  hasFoundationPermission,
} from "@/features/auth/utils/role-access";

type DashboardHeaderProps = {
  organizationName: string;
  hasActiveOrganization: boolean;
  user: {
    name: string | null;
    email: string | null;
    organizationRole: UserRole | null;
  } | null;
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
  user,
  onOpenNavigation,
}: DashboardHeaderProps) {
  const initials = getInitials(user?.name ?? null, user?.email ?? null);
  const organizationRoleLabel = user?.organizationRole
    ? getRoleLabel(user.organizationRole)
    : "No assigned role";
  const showAccessLink = hasFoundationPermission(
    user?.organizationRole,
    "access.view",
  );

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex h-[78px] items-center justify-between gap-6 px-5 sm:px-6 lg:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <button
            type="button"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm lg:hidden"
            aria-label="Navigation"
            onClick={onOpenNavigation}
          >
            <PanelLeft className="h-5 w-5" />
          </button>

          <div className="min-w-0 max-w-[360px] flex-1">
            <DashboardHeaderTitle />
          </div>
        </div>

        <div className="hidden flex-1 justify-center xl:flex">
          <label className="flex h-12 w-full max-w-[460px] items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 shadow-sm">
            <Search className="h-4.5 w-4.5 text-slate-400" />
            <input
              type="search"
              placeholder="Search workspace"
              className="w-full border-0 bg-transparent p-0 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
              aria-label="Search workspace"
            />
            <span className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[0.68rem] font-medium text-slate-400">
              Ctrl K
            </span>
          </label>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <div className="hidden items-center gap-2 xl:flex">
            <div className="hidden min-w-[220px] rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 2xl:block">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Workspace
              </p>
              <p className="truncate text-sm font-medium text-slate-700">
                {hasActiveOrganization ? organizationName : "Setup required"}
              </p>
            </div>
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50"
              aria-label="Theme options"
            >
              <MoonStar className="h-4.5 w-4.5" />
            </button>
            <button
              type="button"
              className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50"
              aria-label="Notifications"
            >
              <Bell className="h-4.5 w-4.5" />
              <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-orange-400" />
            </button>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm transition hover:bg-slate-50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#465fff] text-xs font-semibold text-white">
                  {initials}
                </div>
                <div className="hidden min-w-0 text-left sm:block">
                  <p className="truncate text-sm font-medium text-slate-900">
                    {user?.name || "Authenticated User"}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    Role: {organizationRoleLabel}
                  </p>
                </div>
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[280px]">
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
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
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
              <form action={logout}>
                <DropdownMenuItem asChild variant="destructive">
                  <button
                    type="submit"
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium"
                  >
                    <LogOut className="h-4 w-4" />
                    Log out
                  </button>
                </DropdownMenuItem>
              </form>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
