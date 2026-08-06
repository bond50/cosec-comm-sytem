import Link from "next/link";
import type { UserRole } from "@prisma/client";
import {
  Bell,
  CalendarDays,
  ClipboardList,
  Clock3,
  FileClock,
  FolderKanban,
  TimerReset,
  TriangleAlert,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExportActions } from "@/components/ui/export-actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getPrimaryRoleLabel,
  hasFoundationPermission,
} from "@/features/auth/utils/role-access";
import type { CorrespondenceDashboardMetrics } from "@/features/correspondence/queries/correspondence-dashboard";

type DashboardOverviewProps = {
  organizationName: string;
  organizationRoles: UserRole[] | null;
  correspondenceMetrics: CorrespondenceDashboardMetrics;
  notificationSummary: {
    unreadCount: number;
    unreadActionRequiredCount: number;
    unreadReminderCount: number;
  };
};

function formatSlaComplianceLabel(rate: number | null) {
  return rate === null ? "No data yet" : `${rate}%`;
}

function formatDateLabel(value: Date | null | undefined) {
  if (!value) return "Not set";

  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
  }).format(value);
}

export function DashboardOverview({
  organizationName,
  organizationRoles,
  correspondenceMetrics,
  notificationSummary,
}: DashboardOverviewProps) {
  const canManageMembers = hasFoundationPermission(
    organizationRoles,
    "members.manage",
  );
  const canManageDepartments = hasFoundationPermission(
    organizationRoles,
    "departments.manage",
  );
  const canViewAccess = hasFoundationPermission(
    organizationRoles,
    "access.view",
  );
  const canRegisterCorrespondence = hasFoundationPermission(
    organizationRoles,
    "correspondence.register",
  );
  const roleLabel = organizationRoles?.length
    ? getPrimaryRoleLabel(organizationRoles)
    : "Authenticated member";

  const headerActions = [
    canManageMembers
      ? {
          href: "/dashboard/members?create=1",
          label: "Create member",
          primary: true,
        }
      : null,
    {
      href: "/dashboard/departments",
      label: canManageDepartments ? "Manage departments" : "View departments",
    },
    canViewAccess ? { href: "/dashboard/access", label: "Access model" } : null,
  ].filter(Boolean) as { href: string; label: string; primary?: boolean }[];

  const metrics = [
    {
      label: "Overdue",
      value: correspondenceMetrics.overdueCount,
      icon: TriangleAlert,
      tone: "bg-rose-50 text-rose-600",
    },
    {
      label: "Urgent",
      value: correspondenceMetrics.urgentCount,
      icon: FileClock,
      tone: "bg-amber-50 text-amber-600",
    },
    {
      label: "Pending dispatch",
      value: correspondenceMetrics.pendingDispatchCount,
      icon: Clock3,
      tone: "bg-[#e6f1f8] text-[#1868a6]",
    },
    {
      label: "Pending actions",
      value: correspondenceMetrics.pendingActionPointCount,
      icon: ClipboardList,
      tone: "bg-[#e6f1f8] text-[#1868a6]",
    },
    {
      label: "Unread",
      value: notificationSummary.unreadCount,
      icon: Bell,
      tone: "bg-[#e6f1f8] text-[#1868a6]",
    },
    {
      label: "SLA on time",
      value: formatSlaComplianceLabel(correspondenceMetrics.slaComplianceRate),
      icon: TimerReset,
      tone: "bg-emerald-50 text-emerald-600",
    },
  ];

  const quickLinks = [
    {
      href: "/dashboard/correspondences",
      label: "Correspondence",
      icon: ClipboardList,
    },
    canRegisterCorrespondence
      ? {
          href: "/dashboard/correspondences/register",
          label: "Register",
          icon: FileClock,
        }
      : null,
    {
      href: "/dashboard/documents",
      label: "Documents",
      icon: FolderKanban,
    },
    {
      href: "/dashboard/meetings",
      label: "Meetings",
      icon: CalendarDays,
    },
  ].filter(Boolean) as {
    href: string;
    label: string;
    icon: typeof ClipboardList;
  }[];

  const departmentWorkloadPreview =
    correspondenceMetrics.departmentWorkload.slice(0, 5);
  const departmentWorkloadHeader = [
    "Department",
    "Code",
    "Active",
    "In progress",
    "Urgent",
    "Overdue",
  ];
  const departmentWorkloadRows = correspondenceMetrics.departmentWorkload.map(
    (department) => [
      department.departmentName,
      department.departmentCode || "No code",
      String(department.activeCount),
      String(department.inProgressCount),
      String(department.urgentCount),
      String(department.overdueCount),
    ],
  );

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-5">
      <header className="rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-[1.5rem] font-semibold tracking-[-0.03em] text-slate-950">
              Dashboard
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              {organizationName} · {roleLabel}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {headerActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className={
                  action.primary
                    ? "inline-flex h-10 items-center justify-center rounded-xl border border-[#1868a6] bg-[#1868a6] px-4 text-sm font-semibold text-white transition hover:bg-[#0f4c79]"
                    : "inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                }
              >
                {action.label}
              </Link>
            ))}
          </div>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map((metric) => {
          const Icon = metric.icon;

          return (
            <Card
              key={metric.label}
              className="rounded-2xl border-slate-200 shadow-sm"
            >
              <CardContent className="flex items-center justify-between px-5 py-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    {metric.label}
                  </p>
                  <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                    {metric.value}
                  </p>
                </div>
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${metric.tone}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {quickLinks.map((link) => {
          const Icon = link.icon;

          return (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition hover:bg-slate-50"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e6f1f8] text-[#1868a6]">
                <Icon className="h-5 w-5" />
              </span>
              <span className="text-sm font-medium text-slate-800">
                {link.label}
              </span>
            </Link>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardHeader className="px-6 py-5">
            <CardTitle className="text-[1.05rem] text-slate-950">
              Overdue
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 px-6 pb-6">
            {correspondenceMetrics.overdueItems.length ? (
              correspondenceMetrics.overdueItems.map((item) => (
                <Link
                  key={item.id}
                  href={`/dashboard/correspondences/${item.id}`}
                  className="block rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 transition hover:bg-rose-100"
                >
                  <div className="font-medium text-slate-900">
                    {item.referenceNumber}
                  </div>
                  <div className="mt-1 text-sm text-slate-600">
                    {item.subject}
                  </div>
                  <div className="mt-2 text-xs text-rose-700">
                    Due {formatDateLabel(item.dueDate)} ·{" "}
                    {item.assignedToDepartment?.name ||
                      item.assignedToUser?.name ||
                      "Unassigned"}
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-sm text-slate-600">Nothing overdue.</p>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardHeader className="px-6 py-5">
            <CardTitle className="text-[1.05rem] text-slate-950">
              Recent correspondence
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 px-6 pb-6">
            {correspondenceMetrics.recentCorrespondence.length ? (
              correspondenceMetrics.recentCorrespondence.map((item) => (
                <Link
                  key={item.id}
                  href={`/dashboard/correspondences/${item.id}`}
                  className="block rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 transition hover:bg-slate-100"
                >
                  <div className="font-medium text-slate-900">
                    {item.referenceNumber}
                  </div>
                  <div className="mt-1 text-sm text-slate-600">
                    {item.subject}
                  </div>
                  <div className="mt-2 text-xs text-slate-500">
                    {item.status.replaceAll("_", " ")} ·{" "}
                    {formatDateLabel(item.receivedAt)}
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-sm text-slate-600">Nothing registered yet.</p>
            )}
          </CardContent>
        </Card>
      </section>

      <Card className="rounded-2xl border-slate-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between px-6 py-5">
          <CardTitle className="text-[1.05rem] text-slate-950">
            Department performance
          </CardTitle>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <ExportActions
              caption="Department performance"
              fileName="department-performance-report"
              headerRow={departmentWorkloadHeader}
              rows={departmentWorkloadRows}
            />
            <Link
              href="/dashboard/correspondences"
              className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Open workspace
            </Link>
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-2">
          {departmentWorkloadPreview.length ? (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-200 bg-slate-50/70">
                  <TableHead className="px-6">Department</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>In progress</TableHead>
                  <TableHead>Urgent</TableHead>
                  <TableHead>Overdue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departmentWorkloadPreview.map((department) => (
                  <TableRow
                    key={department.departmentId}
                    className="border-slate-200"
                  >
                    <TableCell className="px-6 py-4">
                      <div className="font-medium text-slate-950">
                        {department.departmentName}
                      </div>
                      <div className="text-sm text-slate-500">
                        {department.departmentCode || "No code"}
                      </div>
                    </TableCell>
                    <TableCell className="py-4 text-slate-700">
                      {department.activeCount}
                    </TableCell>
                    <TableCell className="py-4 text-slate-700">
                      {department.inProgressCount}
                    </TableCell>
                    <TableCell className="py-4">
                      <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-amber-700">
                        {department.urgentCount}
                      </span>
                    </TableCell>
                    <TableCell className="py-4">
                      <span className="inline-flex rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-rose-700">
                        {department.overdueCount}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="px-6 py-6 text-sm text-slate-600">
              No department performance data yet.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
