"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { UserRole } from "@prisma/client";
import { UserPlus } from "lucide-react";
import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { MembershipDepartmentField } from "@/components/forms/membership-department-field";
import { MembershipRoleGroup } from "@/components/forms/membership-role-group";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { Input } from "@/components/ui/input";
import { provisionMemberAction } from "@/features/application/lib/provision-member";
import {
  initialProvisionMemberState,
  memberProvisionRoleValues,
} from "@/features/application/lib/provision-member.shared";
import {
  getAllowedMembershipRolesForDepartmentKind,
  getMembershipRoleGuidance,
  getMembershipRolePolicyHint,
} from "@/features/application/lib/membership-role-policy";
import type { DepartmentSummary } from "@/features/application/queries/departments";

function ProvisionMemberSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button className="w-full" size="lg" type="submit" disabled={pending}>
      {pending ? "Creating member..." : "Create member account"}
    </Button>
  );
}

export function CreateMemberAccountForm({
  departments,
  mode = "card",
  onSuccess,
}: {
  departments: DepartmentSummary[];
  mode?: "card" | "dialog";
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState(
    provisionMemberAction,
    initialProvisionMemberState,
  );

  const fieldErrors = state.fieldErrors ?? {};
  const values = state.values ?? initialProvisionMemberState.values ?? {};
  const [selectedDepartmentId, setSelectedDepartmentId] = useState(
    values.departmentId ?? "",
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
    const currentRoles = values.roles ?? [UserRole.USER];
    if (!selectedDepartment) return [];
    return currentRoles.filter((role) => allowedRoles.includes(role));
  }, [allowedRoles, selectedDepartment, values.roles]);
  const guidanceByRole = useMemo(
    () =>
      Object.fromEntries(
        memberProvisionRoleValues.map((role) => [
          role,
          getMembershipRoleGuidance(role),
        ]),
      ) as Partial<Record<UserRole, string>>,
    [],
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

  const formContent = (
    <form action={formAction} className="space-y-5">
      <Field>
        <FieldLabel htmlFor="member-name" required>
          Full name
        </FieldLabel>
        <Input
          id="member-name"
          name="name"
          defaultValue={values.name ?? ""}
          placeholder="Jane Doe"
          autoComplete="name"
        />
        <FieldError>{fieldErrors.name?.[0]}</FieldError>
      </Field>

      <Field>
        <FieldLabel htmlFor="member-email" required>
          Email
        </FieldLabel>
        <Input
          id="member-email"
          name="email"
          type="email"
          defaultValue={values.email ?? ""}
          placeholder="jane.doe@example.com"
          autoComplete="email"
        />
        <FieldError>{fieldErrors.email?.[0]}</FieldError>
      </Field>

      <MembershipDepartmentField
        id="member-department-create"
        value={selectedDepartmentId}
        departments={departments}
        error={fieldErrors.departmentId?.[0]}
        hint="Choose the department first. The allowed role set depends on whether this is the central office or an execution unit."
        onValueChange={setSelectedDepartmentId}
      />

      <MembershipRoleGroup
        idPrefix="member-role-create"
        roles={allowedRoles}
        selectedRoles={selectedRoles}
        error={fieldErrors.roles?.[0]}
        hint={getMembershipRolePolicyHint(selectedDepartment?.kind ?? null)}
        guidanceByRole={guidanceByRole}
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <Field>
          <div className="flex items-center gap-1.5">
            <FieldLabel htmlFor="member-password" required>
              Password
            </FieldLabel>
            <InfoTooltip text="Use a temporary password that can be rotated after first login." />
          </div>
          <Input
            id="member-password"
            name="password"
            type="password"
            defaultValue={values.password ?? ""}
            autoComplete="new-password"
          />
          <FieldError>{fieldErrors.password?.[0]}</FieldError>
        </Field>

        <Field>
          <FieldLabel htmlFor="member-confirm-password" required>
            Confirm password
          </FieldLabel>
          <Input
            id="member-confirm-password"
            name="confirmPassword"
            type="password"
            defaultValue={values.confirmPassword ?? ""}
            autoComplete="new-password"
          />
          <FieldError>{fieldErrors.confirmPassword?.[0]}</FieldError>
        </Field>
      </div>

      <ProvisionMemberSubmitButton />
    </form>
  );

  if (mode === "dialog") {
    return formContent;
  }

  return (
    <Card className="rounded-[22px] border-slate-200 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
      <CardHeader className="space-y-2 px-6 py-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <CardTitle className="text-[1.25rem] tracking-[-0.03em] text-slate-950">
              Create member account
            </CardTitle>
            <CardDescription className="max-w-xl leading-6">
              Creates a new user account and membership together — use attach
              existing user instead if the person already has an account.
            </CardDescription>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf2ff] text-[#1868a6]">
            <UserPlus className="h-5 w-5" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-6">{formContent}</CardContent>
    </Card>
  );
}
