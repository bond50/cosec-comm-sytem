"use client";

import { useRef } from "react";
import { MembershipStatus } from "@prisma/client";
import {
  ArrowRight,
  BriefcaseBusiness,
  ShieldCheck,
  UserRoundCog,
} from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateMemberAccessAction } from "@/features/application/lib/update-member-access";
import {
  editableMemberRoleValues,
  initialUpdateMemberAccessState,
} from "@/features/application/lib/update-member-access.shared";
import type { DepartmentSummary } from "@/features/application/queries/departments";
import type { OrganizationMembershipDetail } from "@/features/application/queries/memberships";
import { getRoleLabel } from "@/features/auth/utils/role-access";

const NO_DEPARTMENT_VALUE = "__none__";

type MemberManagementPanelProps = {
  member: OrganizationMembershipDetail;
  departments: DepartmentSummary[];
};

type MemberSummaryPanelProps = {
  member: OrganizationMembershipDetail;
  canManage: boolean;
};

type MemberActionLinkProps = {
  href: string;
  label: string;
};

function UpdateMemberSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button className="w-full" size="lg" type="submit" disabled={pending}>
      {pending ? "Saving member..." : "Save member changes"}
    </Button>
  );
}

function getStatusBadgeClass(status: MembershipStatus) {
  if (status === MembershipStatus.ACTIVE) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === MembershipStatus.SUSPENDED) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-slate-200 bg-slate-100 text-slate-700";
}

function MemberSummaryPanel({ member, canManage }: MemberSummaryPanelProps) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <header className="grid gap-6 rounded-[24px] border border-slate-200 bg-white px-6 py-6 shadow-[0_18px_48px_rgba(15,23,42,0.06)] xl:grid-cols-[minmax(0,1.45fr)_360px]">
        <div className="space-y-4">
          <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Member detail
          </div>

          <div className="space-y-2">
            <h2 className="text-[1.85rem] font-semibold leading-tight tracking-[-0.04em] text-slate-950">
              {member.user.name || member.user.email || member.userId}
            </h2>
            <p className="max-w-3xl text-sm leading-6 text-slate-600">
              Review the global user identity and the organization-scoped
              membership record that controls role, status, and department
              assignment.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard/members"
              className="inline-flex h-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Back to members
            </Link>
            {canManage ? (
              <Link
                href="/dashboard/members/add"
                className="inline-flex h-10 items-center justify-center rounded-full border border-[#1f5f99] bg-[#1f5f99] px-4 text-sm font-semibold text-white transition hover:bg-[#184d7b]"
              >
                Add member
              </Link>
            ) : null}
          </div>
        </div>

        <div className="rounded-[22px] border border-slate-200 bg-slate-50/70 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Membership record
          </p>
          <p className="mt-3 text-[1.45rem] font-semibold tracking-[-0.04em] text-slate-950">
            {getRoleLabel(member.role)}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span
              className={`rounded-full border px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] ${getStatusBadgeClass(
                member.status,
              )}`}
            >
              {member.status}
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-slate-600">
              {member.department?.name || "No department"}
            </span>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            `User` is the global account identity. `OrganizationMembership`
            carries this organization’s role, status, and department assignment.
          </p>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-[22px] border-slate-200 shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
          <CardContent className="flex items-start justify-between px-6 py-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Membership role
              </p>
              <p className="mt-3 text-[1.1rem] font-semibold tracking-[-0.03em] text-slate-950">
                {getRoleLabel(member.role)}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Organization-scoped authority
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf2ff] text-[#465fff]">
              <UserRoundCog className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[22px] border-slate-200 shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
          <CardContent className="flex items-start justify-between px-6 py-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Status
              </p>
              <p className="mt-3 text-[1.1rem] font-semibold tracking-[-0.03em] text-slate-950">
                {member.status}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Membership lifecycle state
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
                Department
              </p>
              <p className="mt-3 text-[1.1rem] font-semibold tracking-[-0.03em] text-slate-950">
                {member.department?.name || "Not assigned"}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Current organizational routing unit
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf2ff] text-[#465fff]">
              <BriefcaseBusiness className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="grid gap-4">
          <Card className="rounded-[22px] border-slate-200 shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
            <CardHeader className="px-6 py-5">
              <CardTitle className="text-[1.05rem] text-slate-950">
                User identity
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 px-6 pb-6 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4">
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Full name
                </div>
                <div className="mt-2 text-sm font-semibold text-slate-950">
                  {member.user.name || "No name"}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4">
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Email
                </div>
                <div className="mt-2 text-sm font-semibold text-slate-950">
                  {member.user.email || "No email"}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4 md:col-span-2">
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  User record
                </div>
                <div className="mt-2 text-sm leading-6 text-slate-700">
                  This is the platform-level account identity reused across
                  organizations if the same person belongs to more than one
                  tenant.
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[22px] border-slate-200 shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
            <CardHeader className="px-6 py-5">
              <CardTitle className="text-[1.05rem] text-slate-950">
                Membership profile
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 px-6 pb-6 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4">
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Role
                </div>
                <div className="mt-2 text-sm font-semibold text-slate-950">
                  {getRoleLabel(member.role)}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4">
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Status
                </div>
                <div className="mt-2">
                  <span
                    className={`rounded-full border px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] ${getStatusBadgeClass(
                      member.status,
                    )}`}
                  >
                    {member.status}
                  </span>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4">
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Department
                </div>
                <div className="mt-2 text-sm font-semibold text-slate-950">
                  {member.department?.name || "Not assigned"}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4">
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Membership record
                </div>
                <div className="mt-2 text-sm font-semibold text-slate-950">
                  {member.id}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4 md:col-span-2">
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Record model
                </div>
                <div className="mt-2 text-sm leading-6 text-slate-700">
                  Use membership status for lifecycle control instead of hard
                  deleting members from the accountability chain. Role and
                  department stay organization-scoped here.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {!canManage ? (
          <Card className="rounded-[22px] border-slate-200 shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
            <CardHeader className="px-6 py-5">
              <CardTitle className="text-[1.05rem] text-slate-950">
                Access limits
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 px-6 pb-6">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4 text-sm leading-6 text-slate-700">
                Your role can review member records, but only organization
                administrators can change identity, role, status, or department
                assignment.
              </div>
              <MemberActionLink
                href="/dashboard/access"
                label="Review access model"
              />
            </CardContent>
          </Card>
        ) : null}
      </section>
    </div>
  );
}

function MemberActionLink({ href, label }: MemberActionLinkProps) {
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

export function MemberManagementPanel({
  member,
  departments,
}: MemberManagementPanelProps) {
  const [state, formAction] = useActionState(
    updateMemberAccessAction,
    initialUpdateMemberAccessState,
  );

  const fieldErrors = state.fieldErrors ?? {};
  const values = state.values ?? {
    userId: member.userId,
    name: member.user.name ?? "",
    email: member.user.email ?? "",
    role: member.role,
    status: member.status,
    departmentId: member.departmentId ?? "",
  };
  const roleInputRef = useRef<HTMLInputElement>(null);
  const statusInputRef = useRef<HTMLInputElement>(null);
  const departmentInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col gap-6">
      <MemberSummaryPanel member={member} canManage />

      <div className="mx-auto grid w-full max-w-6xl gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card className="rounded-[22px] border-slate-200 shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
          <CardHeader className="px-6 py-5">
            <CardTitle className="text-[1.05rem] text-slate-950">
              Member administration guide
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 px-6 pb-6">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4 text-sm leading-6 text-slate-700">
              Update the user identity when a staff name or email changes.
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4 text-sm leading-6 text-slate-700">
              Use role changes to realign authority inside the current
              organization without affecting other organizations.
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4 text-sm leading-6 text-slate-700">
              Prefer suspension or inactive status over deleting access when the
              accountability trail must remain intact.
            </div>
            {member.department ? (
              <MemberActionLink
                href={`/dashboard/departments/${member.department.id}`}
                label={`Open ${member.department.name}`}
              />
            ) : (
              <MemberActionLink
                href="/dashboard/departments"
                label="Review departments"
              />
            )}
          </CardContent>
        </Card>

        <Card className="rounded-[22px] border-slate-200 shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
          <CardHeader className="space-y-2 px-6 py-5">
            <CardTitle className="text-[1.05rem] text-slate-950">
              Manage member
            </CardTitle>
            <CardDescription className="text-sm leading-6 text-slate-600">
              Update identity details and the organization-scoped access record.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <form action={formAction} className="space-y-5">
              <input type="hidden" name="userId" value={member.userId} />

              <Field>
                <FieldLabel htmlFor="member-name-edit" required>
                  Full name
                </FieldLabel>
                <Input
                  id="member-name-edit"
                  name="name"
                  defaultValue={values.name ?? ""}
                  placeholder="Jane Doe"
                />
                <FieldError>{fieldErrors.name?.[0]}</FieldError>
              </Field>

              <Field>
                <FieldLabel htmlFor="member-email-edit" required>
                  Email
                </FieldLabel>
                <Input
                  id="member-email-edit"
                  name="email"
                  type="email"
                  defaultValue={values.email ?? ""}
                  placeholder="jane.doe@example.com"
                />
                <FieldError>{fieldErrors.email?.[0]}</FieldError>
              </Field>

              <div className="grid gap-5 lg:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="member-role-edit" required>
                    Membership role
                  </FieldLabel>
                  <input
                    ref={roleInputRef}
                    type="hidden"
                    name="role"
                    defaultValue={String(values.role ?? member.role)}
                  />
                  <Select
                    key={`member-role-${values.role ?? member.role}`}
                    defaultValue={String(values.role ?? member.role)}
                    onValueChange={(value) => {
                      if (roleInputRef.current) {
                        roleInputRef.current.value = value;
                      }
                    }}
                  >
                    <SelectTrigger
                      id="member-role-edit"
                      className="h-12 w-full rounded-[10px] border-slate-200 bg-white text-[15px] shadow-none"
                    >
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {editableMemberRoleValues.map((role) => (
                        <SelectItem key={role} value={role}>
                          {getRoleLabel(role)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError>{fieldErrors.role?.[0]}</FieldError>
                </Field>

                <Field>
                  <FieldLabel htmlFor="member-status-edit" required>
                    Membership status
                  </FieldLabel>
                  <input
                    ref={statusInputRef}
                    type="hidden"
                    name="status"
                    defaultValue={String(values.status ?? member.status)}
                  />
                  <Select
                    key={`member-status-${values.status ?? member.status}`}
                    defaultValue={String(values.status ?? member.status)}
                    onValueChange={(value) => {
                      if (statusInputRef.current) {
                        statusInputRef.current.value = value;
                      }
                    }}
                  >
                    <SelectTrigger
                      id="member-status-edit"
                      className="h-12 w-full rounded-[10px] border-slate-200 bg-white text-[15px] shadow-none"
                    >
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {[
                        MembershipStatus.ACTIVE,
                        MembershipStatus.SUSPENDED,
                        MembershipStatus.INACTIVE,
                      ].map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError>{fieldErrors.status?.[0]}</FieldError>
                </Field>
              </div>

              <Field>
                <FieldLabel htmlFor="member-department-edit">
                  Department
                </FieldLabel>
                <input
                  ref={departmentInputRef}
                  type="hidden"
                  name="departmentId"
                  defaultValue={String(
                    values.departmentId ?? member.departmentId ?? "",
                  )}
                />
                <Select
                  key={`member-department-${values.departmentId ?? member.departmentId ?? "none"}`}
                  defaultValue={
                    String(values.departmentId ?? member.departmentId ?? "") ||
                    NO_DEPARTMENT_VALUE
                  }
                  onValueChange={(value) => {
                    if (departmentInputRef.current) {
                      departmentInputRef.current.value =
                        value === NO_DEPARTMENT_VALUE ? "" : value;
                    }
                  }}
                >
                  <SelectTrigger
                    id="member-department-edit"
                    className="h-12 w-full rounded-[10px] border-slate-200 bg-white text-[15px] shadow-none"
                  >
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_DEPARTMENT_VALUE}>
                      No department
                    </SelectItem>
                    {departments.map((department) => (
                      <SelectItem key={department.id} value={department.id}>
                        {department.name}
                        {department.code ? ` - ${department.code}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError>{fieldErrors.departmentId?.[0]}</FieldError>
              </Field>

              {state.message ? (
                <div
                  className={
                    state.ok
                      ? "rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
                      : "rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
                  }
                >
                  {state.message}
                </div>
              ) : null}

              <UpdateMemberSubmitButton />
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function MemberReadOnlyPanel({
  member,
}: {
  member: OrganizationMembershipDetail;
}) {
  return <MemberSummaryPanel member={member} canManage={false} />;
}
