"use client";

import { useRef } from "react";
import { UserRole } from "@prisma/client";
import { Link2, Users } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addMemberAction } from "@/features/application/lib/add-member";
import { getRoleLabel } from "@/features/auth/utils/role-access";

type AddMemberCandidate = {
  id: string;
  name: string;
  email: string;
};

type AddMemberFormProps = {
  users: AddMemberCandidate[];
};

type AddMemberFormState = {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string[] | undefined>;
  values?: Record<string, string>;
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
    role: UserRole.USER,
  },
};

const memberRoleOptions = [
  UserRole.ORG_ADMIN,
  UserRole.REGISTRY_OFFICER,
  UserRole.REVIEWING_OFFICER,
  UserRole.DEPARTMENT_USER,
  UserRole.MANAGEMENT,
  UserRole.USER,
] as const;

function AddMemberSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button className="w-full" size="lg" type="submit" disabled={pending}>
      {pending ? "Adding member..." : "Add member"}
    </Button>
  );
}

export function AddMemberForm({ users }: AddMemberFormProps) {
  const [state, formAction] = useActionState(
    addMemberAction,
    initialAddMemberState,
  );

  const fieldErrors = state.fieldErrors ?? {};
  const values = state.values ?? initialAddMemberState.values ?? {};
  const userIdInputRef = useRef<HTMLInputElement>(null);
  const roleInputRef = useRef<HTMLInputElement>(null);

  return (
    <Card className="rounded-[22px] border-slate-200 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
      <CardHeader className="space-y-2 px-6 py-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <CardTitle className="text-[1.25rem] tracking-[-0.03em] text-slate-950">
              Attach existing user
            </CardTitle>
            <CardDescription className="max-w-xl leading-6">
              Add an existing user directly into the current organization.
            </CardDescription>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf2ff] text-[#465fff]">
            <Users className="h-5 w-5" />
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm leading-6 text-slate-700">
          Reuse an existing global `User` record and create only the
          organization membership.
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-6">
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
                    {user.name || user.email || user.id} -{" "}
                    {user.email || "No email"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError>{fieldErrors.userId?.[0]}</FieldError>
          </Field>

          <Field>
            <FieldLabel htmlFor="member-role" required>
              Role
            </FieldLabel>
            <input
              ref={roleInputRef}
              type="hidden"
              name="role"
              defaultValue={values.role ?? UserRole.USER}
            />
            <Select
              key={`member-role-${values.role ?? UserRole.USER}`}
              defaultValue={values.role ?? UserRole.USER}
              onValueChange={(value) => {
                if (roleInputRef.current) {
                  roleInputRef.current.value = value;
                }
              }}
            >
              <SelectTrigger
                id="member-role"
                className="h-12 w-full rounded-[10px] border-slate-200 bg-white text-[15px] shadow-none"
              >
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {memberRoleOptions.map((role) => (
                  <SelectItem key={role} value={role}>
                    {getRoleLabel(role)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError>{fieldErrors.role?.[0]}</FieldError>
          </Field>

          <div className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4 text-sm leading-6 text-slate-700">
            <Link2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
            <div>
              This path is for people who already exist in the platform but are
              not yet attached to this organization.
            </div>
          </div>

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

          <AddMemberSubmitButton />
        </form>
      </CardContent>
    </Card>
  );
}
