import Link from "next/link";
import {
  ArrowRight,
  ClipboardList,
  FileInput,
  MessageSquareText,
  TriangleAlert,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { CorrespondencesWorkspace } from "@/app/dashboard/correspondences/correspondences-workspace";
import { getDepartmentsByOrganization } from "@/features/application/queries/departments";
import { requireCorrespondenceWorkspaceAccess } from "@/features/auth/utils/require-organization-permission";
import { hasFoundationPermission } from "@/features/auth/utils/role-access";
import { getCorrespondenceList } from "@/features/correspondence/queries/correspondence-list";
import { getSenderOfficeSuggestions } from "@/features/correspondence/queries/sender-offices";

type CorrespondencesPageProps = {
  searchParams?: Promise<{
    status?: string;
    deadline?: string;
  }>;
};

const filterableStatuses = new Set([
  "NEW",
  "UNDER_REVIEW",
  "DISPATCHED",
  "IN_PROGRESS",
  "AWAITING_FEEDBACK",
  "COMPLETED",
  "CANCELLED",
  "CLOSED",
]);

const filterableDeadlines = new Set([
  "OVERDUE",
  "NO_DUE_DATE",
  "DUE_TODAY",
  "ON_TRACK",
]);

export default async function CorrespondencesPage({
  searchParams,
}: CorrespondencesPageProps) {
  const access = await requireCorrespondenceWorkspaceAccess();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const [correspondences, senderOfficeSuggestions, departments] =
    await Promise.all([
      getCorrespondenceList(access.organization.id),
      getSenderOfficeSuggestions(access.organization.id),
      getDepartmentsByOrganization(access.organization.id),
    ]);

  const canRegister = hasFoundationPermission(
    access.organizationRoles,
    "correspondence.register",
  );
  const pendingReviewCount = correspondences.filter(
    (correspondence) => correspondence.status === "NEW",
  ).length;
  const pendingDispatchCount = correspondences.filter(
    (correspondence) => correspondence.status === "UNDER_REVIEW",
  ).length;
  const overdueCount = correspondences.filter(
    (correspondence) => correspondence.isOverdue,
  ).length;
  const awaitingFeedbackCount = correspondences.filter(
    (correspondence) => correspondence.status === "AWAITING_FEEDBACK",
  ).length;
  const initialColumnFilters = [
    resolvedSearchParams?.status &&
    filterableStatuses.has(resolvedSearchParams.status)
      ? { id: "status", value: resolvedSearchParams.status }
      : null,
    resolvedSearchParams?.deadline &&
    filterableDeadlines.has(resolvedSearchParams.deadline)
      ? { id: "overdue", value: resolvedSearchParams.deadline }
      : null,
  ].filter(
    (filter): filter is { id: string; value: string } => filter !== null,
  );
  const statCards = [
    {
      label: "Pending review",
      value: pendingReviewCount,
      href: "/dashboard/correspondences?status=NEW",
      tone: "bg-[#e6f1f8] text-[#1868a6]",
      icon: ClipboardList,
    },
    {
      label: "Pending dispatch",
      value: pendingDispatchCount,
      href: "/dashboard/correspondences?status=UNDER_REVIEW",
      tone: "bg-indigo-50 text-indigo-600",
      icon: FileInput,
    },
    {
      label: "Overdue",
      value: overdueCount,
      href: "/dashboard/correspondences?deadline=OVERDUE",
      tone: "bg-rose-50 text-rose-600",
      icon: TriangleAlert,
    },
    {
      label: "Awaiting feedback",
      value: awaitingFeedbackCount,
      href: "/dashboard/correspondences?status=AWAITING_FEEDBACK",
      tone: "bg-[#f0fbf5] text-[#0f6b3a]",
      icon: MessageSquareText,
    },
  ];

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-5">
      <header className="rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-[1.5rem] font-semibold tracking-[-0.03em] text-slate-950">
              Correspondence
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              {access.organization.name} · Registry and movement tracking
            </p>
          </div>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;

          return (
            <Link key={stat.label} href={stat.href} className="group block">
              <Card className="h-full rounded-2xl border-slate-200 shadow-sm transition hover:-translate-y-0.5 hover:border-[#a9cfe3] hover:shadow-md">
                <CardContent className="flex items-center justify-between gap-4 px-5 py-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      {stat.label}
                    </p>
                    <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                      {stat.value}
                    </p>
                    <p className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#1868a6] opacity-0 transition group-hover:opacity-100">
                      View filtered list
                      <ArrowRight className="h-3.5 w-3.5" />
                    </p>
                  </div>
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${stat.tone}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </section>

      <CorrespondencesWorkspace
        organizationName={access.organization.name}
        correspondences={correspondences}
        canRegister={canRegister}
        senderOfficeSuggestions={senderOfficeSuggestions.map(
          (office) => office.name,
        )}
        initialColumnFilters={initialColumnFilters}
        sourceDepartmentOptions={departments
          .filter(
            (department) =>
              department.status === "ACTIVE" && department.kind === "EXECUTION",
          )
          .map((department) => ({
            id: department.id,
            label: department.code
              ? `${department.name} (${department.code})`
              : department.name,
          }))}
      />
    </div>
  );
}
