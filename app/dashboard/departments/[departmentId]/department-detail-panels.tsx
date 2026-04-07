import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  ShieldCheck,
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
import type { DepartmentMember } from "@/features/application/queries/department-members";
import type { DepartmentSummary } from "@/features/application/queries/departments";

type DepartmentAction = {
  href: string;
  label: string;
  primary?: boolean;
};

type DepartmentHeroProps = {
  department: DepartmentSummary;
  eyebrow: string;
  title: string;
  description: string;
  actions?: DepartmentAction[];
};

type DepartmentSummaryCardsProps = {
  department: DepartmentSummary;
  members: DepartmentMember[];
  currentHead: DepartmentMember | null;
};

type DepartmentProfileCardProps = {
  department: DepartmentSummary;
};

type DepartmentHeadCardProps = {
  department: DepartmentSummary;
  currentHead: DepartmentMember | null;
  emptyMessage: string;
  staleMessage: string;
};

type DepartmentMembersCardProps = {
  members: DepartmentMember[];
  title?: string;
  description?: string;
  emptyMessage: string;
};

function getStatusBadgeClass(status: string) {
  if (status === "ACTIVE") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  return "border-slate-200 bg-slate-100 text-slate-700";
}

export function DepartmentHero({
  department,
  eyebrow,
  title,
  description,
  actions = [],
}: DepartmentHeroProps) {
  return (
    <header className="grid gap-6 rounded-[24px] border border-slate-200 bg-white px-6 py-6 shadow-[0_18px_48px_rgba(15,23,42,0.06)] xl:grid-cols-[minmax(0,1.45fr)_360px]">
      <div className="space-y-4">
        <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
          {eyebrow}
        </div>

        <div className="space-y-2">
          <h1 className="text-[1.85rem] font-semibold leading-tight tracking-[-0.04em] text-slate-950">
            {title}
          </h1>
          <p className="max-w-3xl text-sm leading-6 text-slate-600">
            {description}
          </p>
        </div>

        {actions.length ? (
          <div className="flex flex-wrap gap-3">
            {actions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className={
                  action.primary
                    ? "inline-flex h-10 items-center justify-center rounded-full border border-[#1f5f99] bg-[#1f5f99] px-4 text-sm font-semibold text-white transition hover:bg-[#184d7b]"
                    : "inline-flex h-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                }
              >
                {action.label}
              </Link>
            ))}
          </div>
        ) : null}
      </div>

      <div className="rounded-[22px] border border-slate-200 bg-slate-50/70 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
          Department identity
        </p>
        <p className="mt-3 text-[1.45rem] font-semibold tracking-[-0.04em] text-slate-950">
          {department.name}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <span
            className={`rounded-full border px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] ${getStatusBadgeClass(
              department.status,
            )}`}
          >
            {department.status}
          </span>
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-slate-600">
            {department.code || "No code"}
          </span>
        </div>
        <p className="mt-4 text-sm leading-6 text-slate-600">
          {department.description || "No description has been recorded yet."}
        </p>
      </div>
    </header>
  );
}

export function DepartmentSummaryCards({
  department,
  members,
  currentHead,
}: DepartmentSummaryCardsProps) {
  return (
    <section className="grid gap-4 md:grid-cols-3">
      <Card className="rounded-[22px] border-slate-200 shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
        <CardContent className="flex items-start justify-between px-6 py-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Status
            </p>
            <p className="mt-3 text-[1.15rem] font-semibold tracking-[-0.03em] text-slate-950">
              {department.status}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Department lifecycle state
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf2ff] text-[#465fff]">
            <ShieldCheck className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-[22px] border-slate-200 shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
        <CardContent className="flex items-start justify-between px-6 py-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Members
            </p>
            <p className="mt-3 text-[1.15rem] font-semibold tracking-[-0.03em] text-slate-950">
              {members.length}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Assigned organization members
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf2ff] text-[#465fff]">
            <Users className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-[22px] border-slate-200 shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
        <CardContent className="flex items-start justify-between px-6 py-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Department head
            </p>
            <p className="mt-3 text-[1.15rem] font-semibold tracking-[-0.03em] text-slate-950">
              {currentHead?.name || currentHead?.email || "Not assigned"}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Current accountable lead
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf2ff] text-[#465fff]">
            <BriefcaseBusiness className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

export function DepartmentProfileCard({
  department,
}: DepartmentProfileCardProps) {
  return (
    <Card className="rounded-[22px] border-slate-200 shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
      <CardHeader className="px-6 py-5">
        <CardTitle className="text-[1.05rem] text-slate-950">
          Department profile
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 px-6 pb-6 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Department name
          </div>
          <div className="mt-2 text-sm font-semibold text-slate-950">
            {department.name}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Department code
          </div>
          <div className="mt-2 text-sm font-semibold text-slate-950">
            {department.code || "No code"}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Lifecycle status
          </div>
          <div className="mt-2">
            <span
              className={`rounded-full border px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] ${getStatusBadgeClass(
                department.status,
              )}`}
            >
              {department.status}
            </span>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Routing role
          </div>
          <div className="mt-2 text-sm font-semibold text-slate-950">
            Departmental accountability unit
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4 md:col-span-2">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Description
          </div>
          <div className="mt-2 text-sm leading-6 text-slate-700">
            {department.description || "No description provided."}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function DepartmentHeadCard({
  department,
  currentHead,
  emptyMessage,
  staleMessage,
}: DepartmentHeadCardProps) {
  return (
    <Card className="rounded-[22px] border-slate-200 shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
      <CardHeader className="px-6 py-5">
        <CardTitle className="text-[1.05rem] text-slate-950">
          Current head
        </CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        {currentHead ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-950">
                  {currentHead.name || currentHead.email || currentHead.userId}
                </div>
                <div className="mt-1 text-sm text-slate-500">
                  {currentHead.email || "No email"}
                </div>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#edf2ff] text-[#465fff]">
                <Building2 className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-slate-600">
                {currentHead.role.replaceAll("_", " ")}
              </span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-slate-600">
                {currentHead.status}
              </span>
            </div>
          </div>
        ) : department.headUserId ? (
          <div className="text-sm leading-6 text-slate-600">{staleMessage}</div>
        ) : (
          <div className="text-sm leading-6 text-slate-600">{emptyMessage}</div>
        )}
      </CardContent>
    </Card>
  );
}

export function DepartmentMembersCard({
  members,
  title = "Members",
  description,
  emptyMessage,
}: DepartmentMembersCardProps) {
  return (
    <Card className="rounded-[22px] border-slate-200 shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
      <CardHeader className="px-6 py-5">
        <CardTitle className="text-[1.05rem] text-slate-950">{title}</CardTitle>
        {description ? (
          <p className="text-sm leading-6 text-slate-600">{description}</p>
        ) : null}
      </CardHeader>
      <CardContent className="px-0 pb-2">
        {members.length ? (
          <Table>
            <TableHeader>
              <TableRow className="border-slate-200 bg-slate-50/70">
                <TableHead className="px-6">Member</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="px-6">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.userId} className="border-slate-200">
                  <TableCell className="px-6 py-4 font-medium text-slate-950">
                    {member.name || member.email || member.userId}
                  </TableCell>
                  <TableCell className="py-4 text-slate-600">
                    {member.email || "No email"}
                  </TableCell>
                  <TableCell className="py-4 text-slate-600">
                    {member.role.replaceAll("_", " ")}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-slate-600">
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-slate-600">
                      {member.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="px-6 py-6 text-sm leading-6 text-slate-600">
            {emptyMessage}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function DepartmentActionLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4 transition hover:bg-slate-100"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-slate-950">{label}</div>
        <ArrowRight className="h-4 w-4 text-slate-400" />
      </div>
    </Link>
  );
}
