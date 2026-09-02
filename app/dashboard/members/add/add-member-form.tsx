"use client";

import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { UserRole } from "@prisma/client";
import { Users } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addMemberAction } from "@/features/application/lib/add-member";
import {
  getAllowedMembershipRolesForDepartmentKind,
  getMembershipRoleGuidance,
  getMembershipRolePolicyHint,
} from "@/features/application/lib/membership-role-policy";
import type { DepartmentSummary } from "@/features/application/queries/departments";
import { formatUserLabel } from "@/features/application/lib/user-label";
import { EDITABLE_MEMBERSHIP_ROLES } from "@/features/auth/utils/roles";

type AddMemberCandidate = {
  id: string;
  name: string;
  email: string;
  designation: string | null;
};

type AddMemberFormProps = {
  users: AddMemberCandidate[];
  departments: DepartmentSummary[];
  mode?: "card" | "dialog";
  onSuccess?: () => void;
};

type AddMemberFormState = {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string[] | undefined>;
  values?: Record<string, string>;
  roleValues?: UserRole[];
  data?: {
    membershipId: string;
    organizationId: string;
    userId: string;
  };
};

const initialAddMemberState: AddMemberFormState = {
  ok: false,
  message: "",
  fieldErrors: {},
  values: {
    userId: "",
    departmentId: "",
  },
  roleValues: [],
};

function AddMemberSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button className="w-full" size="lg" type="submit" disabled={pending}>
      {pending ? "Adding member..." : "Add member"}
    </Button>
  );
}

export function AddMemberForm({
  users,
  departments,
  mode = "card",
  onSuccess,
}: AddMemberFormProps) {
  const router = useRouter();
  const [state, formAction] = useActionState(
    addMemberAction,
    initialAddMemberState,
  );

  const fieldErrors = state.fieldErrors ?? {};
  const values = state.values ?? initialAddMemberState.values ?? {};
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
    const currentRoles = state.roleValues ?? initialAddMemberState.roleValues!;
    if (!selectedDepartment) return [];
    return currentRoles.filter((role) => allowedRoles.includes(role));
  }, [allowedRoles, selectedDepartment, state.roleValues]);
  const guidanceByRole = useMemo(
    () =>
      Object.fromEntries(
        EDITABLE_MEMBERSHIP_ROLES.map((role) => [
          role,
          getMembershipRoleGuidance(role),
        ]),
      ) as Partial<Record<UserRole, string>>,
    [],
  );
  const userIdInputRef = useRef<HTMLInputElement>(null);

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
        <FieldLabel htmlFor="member-user" required>
          User
        </FieldLabel>
        <input
          ref={userIdInputRef}
          type="hidden"
          name="userId"
          defaultValue={values.userId ?? ""}
        />
        <Select
          key={`member-user-${values.userId ?? ""}`}
          defaultValue={values.userId ?? ""}
          onValueChange={(value) => {
            if (userIdInputRef.current) {
              userIdInputRef.current.value = value;
            }
          }}
        >
          <SelectTrigger
            id="member-user"
            className="h-12 w-full rounded-[10px] border-slate-200 bg-white text-[15px] shadow-none"
          >
            <SelectValue placeholder="Select a user" />
          </SelectTrigger>
          <SelectContent>
            {users.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {formatUserLabel(user, user.id)} - {user.email || "No email"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError>{fieldErrors.userId?.[0]}</FieldError>
      </Field>

      <MembershipDepartmentField
        id="member-department"
        value={selectedDepartmentId}
        departments={departments}
        error={fieldErrors.departmentId?.[0]}
        hint="Choose the department first. Allowed roles depend on whether this is the central office or an execution department."
        onValueChange={setSelectedDepartmentId}
      />

      <MembershipRoleGroup
        idPrefix="member-role"
        roles={allowedRoles}
        selectedRoles={selectedRoles}
        error={fieldErrors.roles?.[0]}
        hint={getMembershipRolePolicyHint(selectedDepartment?.kind ?? null)}
        guidanceByRole={guidanceByRole}
      />

      <AddMemberSubmitButton />
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
              Attach existing user
            </CardTitle>
            <CardDescription className="max-w-xl leading-6">
              Attaches an existing user account to this organization — no new
              account is created.
            </CardDescription>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf2ff] text-[#1868a6]">
            <Users className="h-5 w-5" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-6">{formContent}</CardContent>
    </Card>
  );
}
