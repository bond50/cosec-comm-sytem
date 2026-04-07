import Link from "next/link";
import type { UserRole } from "@prisma/client";
import {
  ArrowRight,
  Building2,
  CircleCheckBig,
  FolderKanban,
  UserPlus,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { DepartmentSummary } from "@/features/application/queries/departments";
import type { OrganizationMembershipListItem } from "@/features/application/queries/memberships";
import {
  getRoleLabel,
  hasFoundationPermission,
} from "@/features/auth/utils/role-access";

type DashboardOverviewProps = {
  organizationName: string;
  memberships: OrganizationMembershipListItem[];
  departments: DepartmentSummary[];
  organizationRole: UserRole | null;
};

function getInitialActions(
  memberships: OrganizationMembershipListItem[],
  departments: DepartmentSummary[],
) {
  const actions = [];

  if (memberships.length <= 1) {
    actions.push(
      "Create another member account so work can be assigned beyond the organization admin.",
    );
  }

  if (departments.length === 0) {
    actions.push(
      "Create the first department so correspondence can be routed to a responsible unit.",
    );
  }

  if (!actions.length) {
    actions.push(
      "Your organization foundations are in place. Continue by managing departments and preparing for correspondence intake.",
    );
  }

  return actions;
}

export function DashboardOverview({
  organizationName,
  memberships,
  departments,
  organizationRole,
}: DashboardOverviewProps) {
  const activeMembers = memberships.filter(
    (membership) => membership.status === "ACTIVE",
  );
  const assignedMembers = memberships.filter(
    (membership) => membership.department,
  );
  const nextActions = getInitialActions(memberships, departments);
  const readinessChecks = [
    {
      label: "Member coverage",
      value: memberships.length > 1 ? "Ready" : "Needs setup",
      detail:
        memberships.length > 1
          ? "More than one member can share accountability."
          : "Add at least one more member beyond the initial admin.",
      isComplete: memberships.length > 1,
    },
    {
      label: "Department structure",
      value: departments.length > 0 ? "Ready" : "Needs setup",
      detail:
        departments.length > 0
          ? "Routing units are available for dispatch decisions."
          : "Create the first department before workflow intake.",
      isComplete: departments.length > 0,
    },
    {
      label: "Assignment coverage",
      value: assignedMembers.length > 0 ? "Started" : "Not started",
      detail:
        assignedMembers.length > 0
          ? `${assignedMembers.length} member${assignedMembers.length === 1 ? "" : "s"} already mapped to a department.`
          : "No members are attached to departments yet.",
      isComplete: assignedMembers.length > 0,
    },
  ];
  const readinessCount = readinessChecks.filter(
    (check) => check.isComplete,
  ).length;
  const readinessLabel = `${readinessCount}/${readinessChecks.length} foundations in place`;
  const departmentPreview = departments.slice(0, 4);
  const canManageMembers = hasFoundationPermission(
    organizationRole,
    "members.manage",
  );
  const canManageDepartments = hasFoundationPermission(
    organizationRole,
    "departments.manage",
  );
  const canViewAccess = hasFoundationPermission(
    organizationRole,
    "access.view",
  );
  const roleLabel = organizationRole
    ? getRoleLabel(organizationRole)
    : "Authenticated member";
  const roleSummary = canManageMembers
    ? "This role can govern the foundation layer: people, departments, and access."
    : organizationRole === "REGISTRY_OFFICER"
      ? "This role is aligned to intake and dispatch preparation, not governance setup."
      : organizationRole === "REVIEWING_OFFICER"
        ? "This role is aligned to review and instruction, not member or department administration."
        : organizationRole === "MANAGEMENT"
          ? "This role focuses on oversight and closure decisions instead of foundation CRUD."
          : "This role currently consumes the workspace with limited administration rights.";
  const roleActions = [
    canManageMembers
      ? {
          href: "/dashboard/members/add",
          label: "Create member",
          primary: true,
        }
      : null,
    {
      href: "/dashboard/departments",
      label: canManageDepartments ? "Manage departments" : "View departments",
    },
    canViewAccess
      ? {
          href: "/dashboard/access",
          label: "Review access model",
        }
      : null,
  ].filter(Boolean) as { href: string; label: string; primary?: boolean }[];
  const immediateActions = [
    canManageMembers
      ? {
          href: "/dashboard/members/add",
          title: "Create or add members",
          detail:
            "Provision a real account or attach an existing user to the organization.",
        }
      : {
          href: "/dashboard/members",
          title: "Review memberships",
          detail:
            "Check who is active, which roles are assigned, and where department coverage is missing.",
        },
    {
      href: "/dashboard/departments",
      title: canManageDepartments
        ? "Build departments"
        : "Review routing units",
      detail: canManageDepartments
        ? "Create routing units before correspondence starts moving."
        : "Understand the current department structure that work will move through.",
    },
    canViewAccess
      ? {
          href: "/dashboard/access",
          title: "Review access model",
          detail:
            "Confirm role boundaries and who can administer foundation data.",
        }
      : {
          href: "/dashboard/members",
          title: "Review assigned structure",
          detail:
            "Use the current membership and department structure as the context for your role.",
        },
  ];

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-5">
      <header className="grid gap-5 rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-sm xl:grid-cols-[minmax(0,1.45fr)_320px]">
        <div className="space-y-4">
          <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-500">
            Organization dashboard
          </div>
          <div className="space-y-2">
            <h1 className="text-[1.5rem] font-semibold leading-tight tracking-[-0.03em] text-slate-950">
              Dashboard
            </h1>
            <p className="max-w-3xl text-sm font-medium leading-6 text-slate-700">
              {organizationName}
            </p>
            <p className="max-w-3xl text-sm leading-6 text-slate-600">
              {roleSummary}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {roleActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className={
                  action.primary
                    ? "inline-flex h-10 items-center justify-center rounded-xl border border-[#465fff] bg-[#465fff] px-4 text-sm font-semibold text-white transition hover:bg-[#3641f5]"
                    : "inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                }
              >
                {action.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Active role
          </p>
          <p className="mt-3 text-xl font-semibold tracking-[-0.03em] text-slate-950">
            {roleLabel}
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            {readinessLabel}. Dashboard actions are filtered to what this role
            should actually do.
          </p>

          <div className="mt-5 space-y-3">
            {readinessChecks.map((check) => (
              <div
                key={check.label}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-slate-950">
                    {check.label}
                  </div>
                  <span
                    className={
                      check.isComplete
                        ? "rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-emerald-700"
                        : "rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-amber-700"
                    }
                  >
                    {check.value}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {check.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardContent className="flex items-start justify-between px-6 py-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Members
              </p>
              <p className="mt-3 text-[1.75rem] font-semibold tracking-[-0.04em] text-slate-950">
                {memberships.length}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {activeMembers.length} active memberships
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eef2ff] text-[#465fff]">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardContent className="flex items-start justify-between px-6 py-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Departments
              </p>
              <p className="mt-3 text-[1.75rem] font-semibold tracking-[-0.04em] text-slate-950">
                {departments.length}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Organization routing units
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eef2ff] text-[#465fff]">
              <Building2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardContent className="flex items-start justify-between px-6 py-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Assigned members
              </p>
              <p className="mt-3 text-[1.75rem] font-semibold tracking-[-0.04em] text-slate-950">
                {assignedMembers.length}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Members mapped to departments
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eef2ff] text-[#465fff]">
              <FolderKanban className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardContent className="flex items-start justify-between px-6 py-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Next step
              </p>
              <p className="mt-3 text-base font-semibold text-slate-950">
                {memberships.length <= 1
                  ? "Member onboarding"
                  : "Routing setup"}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {memberships.length <= 1
                  ? "Create usable accounts first"
                  : departments.length === 0
                    ? "Create the first department"
                    : "Map members to departments"}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eef2ff] text-[#465fff]">
              <UserPlus className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between px-6 py-5">
            <div>
              <CardTitle className="text-[1.05rem] text-slate-950">
                Immediate actions
              </CardTitle>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Use these actions to complete the current foundation phase.
              </p>
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="grid gap-3 md:grid-cols-2">
              {immediateActions.map((action) => (
                <Link
                  key={action.href + action.title}
                  href={action.href}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 transition hover:border-slate-300 hover:bg-slate-100"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-slate-950">
                      {action.title}
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-400" />
                  </div>
                  <div className="mt-1 text-sm leading-6 text-slate-600">
                    {action.detail}
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardHeader className="px-6 py-5">
            <CardTitle className="text-[1.05rem] text-slate-950">
              Foundation checklist
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 px-6 pb-6">
            {nextActions.map((action) => (
              <div
                key={action}
                className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
              >
                <CircleCheckBig className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                <div className="text-sm leading-6 text-slate-700">{action}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border-slate-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between px-6 py-5">
          <div>
            <CardTitle className="text-[1.05rem] text-slate-950">
              Department routing snapshot
            </CardTitle>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Early visibility into which routing units already exist.
            </p>
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-2">
          {departmentPreview.length ? (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-200 bg-slate-50/70">
                  <TableHead className="px-6">Department</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="px-6 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departmentPreview.map((department) => (
                  <TableRow key={department.id} className="border-slate-200">
                    <TableCell className="px-6 py-4 font-medium text-slate-950">
                      {department.name}
                    </TableCell>
                    <TableCell className="py-4 text-slate-600">
                      {department.code || "No code"}
                    </TableCell>
                    <TableCell className="py-4 text-slate-600">
                      {department.status}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right">
                      <Link
                        href={`/dashboard/departments/${department.id}`}
                        className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                      >
                        View department
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="px-6 py-6 text-sm leading-6 text-slate-600">
              No departments exist yet. Create the first routing unit before
              correspondence is assigned or dispatched.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
