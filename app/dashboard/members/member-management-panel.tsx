"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MembershipStatus, UserRole } from "@prisma/client";
import { ArrowRight, PencilLine } from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MembershipDepartmentField } from "@/components/forms/membership-department-field";
import { MembershipRoleGroup } from "@/components/forms/membership-role-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  getAllowedMembershipRolesForDepartmentKind,
  getMembershipRoleGuidance,
  getMembershipRolePolicyHint,
} from "@/features/application/lib/membership-role-policy";
import type { DepartmentSummary } from "@/features/application/queries/departments";
import { getDepartmentKindLabel } from "@/features/application/lib/department-model";
import type { OrganizationMembershipListItem } from "@/features/application/queries/memberships";
import { getRoleLabels } from "@/features/auth/utils/role-access";

type MemberManagementPanelProps = {
  member: OrganizationMembershipListItem;
  departments: DepartmentSummary[];
};

type MemberSummaryPanelProps = {
  member: OrganizationMembershipListItem;
  canManage: boolean;
  onEdit?: () => void;
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

export function MemberDetailsCard({
  member,
}: {
  member: OrganizationMembershipListItem;
}) {
  return (
    <Card className="rounded-[22px] border-slate-200 shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
      <CardHeader className="px-6 py-5">
        <CardTitle className="text-[1.05rem] text-slate-950">Details</CardTitle>
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
        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Department
          </div>
          <div className="mt-2 text-sm font-semibold text-slate-950">
            {member.department?.name || "Department required"}
          </div>
          {member.department ? (
            <div className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-500">
              {getDepartmentKindLabel(member.department.kind)}
            </div>
          ) : null}
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
        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4 md:col-span-2">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Roles
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {getRoleLabels(member.roles).map((roleLabel) => (
              <span
                key={roleLabel}
                className="rounded-full border border-[#d9e2ff] bg-[#e6f1f8] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[#1868a6]"
              >
                {roleLabel}
              </span>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MemberSummaryPanel({
  member,
  canManage,
  onEdit,
}: MemberSummaryPanelProps) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <header className="rounded-[24px] border border-slate-200 bg-white px-6 py-6 shadow-[0_18px_48px_rgba(15,23,42,0.06)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <h2 className="text-[1.5rem] font-semibold leading-tight tracking-[-0.04em] text-slate-950">
              {member.user.name || member.user.email || member.userId}
            </h2>
            <div className="flex flex-wrap gap-2">
              {getRoleLabels(member.roles).map((roleLabel) => (
                <span
                  key={roleLabel}
                  className="rounded-full border border-[#d9e2ff] bg-[#e6f1f8] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[#1868a6]"
                >
                  {roleLabel}
                </span>
              ))}
              <span
                className={`rounded-full border px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] ${getStatusBadgeClass(
                  member.status,
                )}`}
              >
                {member.status}
              </span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-slate-600">
                {member.department?.name || "Department required"}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard/members"
              className="inline-flex h-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Back to members
            </Link>
            {canManage ? (
              <>
                <button
                  type="button"
                  onClick={onEdit}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  <PencilLine className="h-4 w-4" />
                  Edit member
                </button>
                <Link
                  href="/dashboard/members?create=1"
                  className="inline-flex h-10 items-center justify-center rounded-full border border-[#1f5f99] bg-[#1f5f99] px-4 text-sm font-semibold text-white transition hover:bg-[#184d7b]"
                >
                  Add member
                </Link>
              </>
            ) : null}
          </div>
        </div>
      </header>

      {!canManage ? (
        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <MemberDetailsCard member={member} />

          <Card className="rounded-[22px] border-slate-200 shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
            <CardHeader className="px-6 py-5">
              <CardTitle className="text-[1.05rem] text-slate-950">
                Access limits
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 px-6 pb-6">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4 text-sm leading-6 text-slate-700">
                Only organization administrators can change identity, role,
                status, or department.
              </div>
              <MemberActionLink
                href="/dashboard/access"
                label="Review access model"
              />
            </CardContent>
          </Card>
        </section>
      ) : null}
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

type UpdateMemberFormProps = {
  member: OrganizationMembershipListItem;
  departments: DepartmentSummary[];
  onSuccess?: () => void;
};

export function UpdateMemberForm({
  member,
  departments,
  onSuccess,
}: UpdateMemberFormProps) {
  const router = useRouter();
  const [state, formAction] = useActionState(
    updateMemberAccessAction,
    initialUpdateMemberAccessState,
  );

  useEffect(() => {
    if (!state.message) return;

    if (state.ok) {
      toast.success(state.message);
      router.refresh();
      onSuccess?.();
    } else {
      toast.error(state.message);
    }
    // Depend on the whole state object (a fresh reference every action
    // completion) rather than its fields, so an identical repeated
    // message — e.g. resubmitting the same invalid input — still toasts.
  }, [state, router, onSuccess]);

  const fieldErrors = state.fieldErrors ?? {};
  const values = state.values ?? {
    userId: member.userId,
    name: member.user.name ?? "",
    email: member.user.email ?? "",
    roles: member.roles,
    status: member.status,
    departmentId: member.departmentId ?? "",
  };
  const [selectedDepartmentId, setSelectedDepartmentId] = useState(
    String(values.departmentId ?? member.departmentId ?? ""),
  );
  const selectedDepartment =
    departments.find((department) => department.id === selectedDepartmentId) ??
    null;
  const allowedRoles = useMemo(
    () =>
      selectedDepartment
        ? getAllowedMembershipRolesForDepartmentKind(selectedDepartment.kind)
        : [],
    [selectedDepartment],
  );
  const selectedRoles = useMemo(() => {
    const currentRoles = values.roles ?? member.roles;
    if (!selectedDepartment) return [];
    return currentRoles.filter((role) => allowedRoles.includes(role));
  }, [allowedRoles, member.roles, selectedDepartment, values.roles]);
  const guidanceByRole = useMemo(
    () =>
      Object.fromEntries(
        editableMemberRoleValues.map((role) => [
          role,
          getMembershipRoleGuidance(role),
        ]),
      ) as Partial<Record<UserRole, string>>,
    [],
  );
  const statusInputRef = useRef<HTMLInputElement>(null);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="userId" value={member.userId} />

      <div className="grid gap-5 lg:grid-cols-2">
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
      </div>

      <MembershipDepartmentField
        id="member-department-edit"
        value={selectedDepartmentId}
        departments={departments}
        error={fieldErrors.departmentId?.[0]}
        hint="Choose the department first. Role availability changes between the central office and execution departments."
        onValueChange={setSelectedDepartmentId}
      />

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

      <MembershipRoleGroup
        idPrefix="member-role-edit"
        label="Membership roles"
        roles={allowedRoles}
        selectedRoles={selectedRoles}
        error={fieldErrors.roles?.[0]}
        hint={getMembershipRolePolicyHint(selectedDepartment?.kind ?? null)}
        guidanceByRole={guidanceByRole}
      />

      <UpdateMemberSubmitButton />
    </form>
  );
}

export function MemberManagementPanel({
  member,
  departments,
}: MemberManagementPanelProps) {
  const [editOpen, setEditOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <MemberSummaryPanel
        member={member}
        canManage
        onEdit={() => setEditOpen(true)}
      />

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl overflow-hidden p-0">
          <DialogHeader className="border-b border-slate-200 px-6 py-5">
            <DialogTitle>Update member</DialogTitle>
            <DialogDescription>
              Update identity, department, status, and roles.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[80vh] overflow-y-auto px-6 py-5">
            <UpdateMemberForm
              member={member}
              departments={departments}
              onSuccess={() => setEditOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function MemberReadOnlyPanel({
  member,
}: {
  member: OrganizationMembershipListItem;
}) {
  return <MemberSummaryPanel member={member} canManage={false} />;
}
