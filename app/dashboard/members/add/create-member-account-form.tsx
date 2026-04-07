"use client";

import { useRef } from "react";
import { UserRole } from "@prisma/client";
import { KeyRound, UserPlus } from "lucide-react";
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
import { provisionMemberAction } from "@/features/application/lib/provision-member";
import {
  initialProvisionMemberState,
  memberProvisionRoleValues,
} from "@/features/application/lib/provision-member.shared";
import { getRoleLabel } from "@/features/auth/utils/role-access";

function ProvisionMemberSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button className="w-full" size="lg" type="submit" disabled={pending}>
      {pending ? "Creating member..." : "Create member account"}
    </Button>
  );
}

export function CreateMemberAccountForm() {
  const [state, formAction] = useActionState(
    provisionMemberAction,
    initialProvisionMemberState,
  );

  const fieldErrors = state.fieldErrors ?? {};
  const values = state.values ?? initialProvisionMemberState.values ?? {};
  const roleInputRef = useRef<HTMLInputElement>(null);

  return (
    <Card className="rounded-[22px] border-slate-200 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
      <CardHeader className="space-y-2 px-6 py-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <CardTitle className="text-[1.25rem] tracking-[-0.03em] text-slate-950">
              Create member account
            </CardTitle>
            <CardDescription className="max-w-xl leading-6">
              Create a usable account and attach it to the current organization
              in one step.
            </CardDescription>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf2ff] text-[#465fff]">
            <UserPlus className="h-5 w-5" />
          </div>
        </div>

        <div className="grid gap-3 pt-1 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm leading-6 text-slate-700">
            Provision a new global `User` record and immediately create the
            organization membership.
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm leading-6 text-slate-700">
            Use this path when the person does not already have an account in
            the system.
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-6 pb-6">
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

          <Field>
            <FieldLabel htmlFor="member-role-create" required>
              Membership role
            </FieldLabel>
            <input
              ref={roleInputRef}
              type="hidden"
              name="role"
              defaultValue={values.role ?? UserRole.USER}
            />
            <Select
              key={`member-role-create-${values.role ?? UserRole.USER}`}
              defaultValue={values.role ?? UserRole.USER}
              onValueChange={(value) => {
                if (roleInputRef.current) {
                  roleInputRef.current.value = value;
                }
              }}
            >
              <SelectTrigger
                id="member-role-create"
                className="h-12 w-full rounded-[10px] border-slate-200 bg-white text-[15px] shadow-none"
              >
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {memberProvisionRoleValues.map((role) => (
                  <SelectItem key={role} value={role}>
                    {getRoleLabel(role)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError>{fieldErrors.role?.[0]}</FieldError>
          </Field>

          <div className="grid gap-5 lg:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="member-password" required>
                Password
              </FieldLabel>
              <Input
                id="member-password"
                name="password"
                type="password"
                defaultValue={values.password ?? ""}
                autoComplete="new-password"
              />
              <FieldError>{fieldErrors.password?.[0]}</FieldError>
              <p className="text-sm leading-6 text-slate-500">
                Use a temporary password that can be rotated after first login.
              </p>
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

          <div className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4 text-sm leading-6 text-slate-700">
            <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
            <div>
              This creates both identity and access together. Use the attach
              flow instead when the person already exists as a user in another
              organization or previous setup.
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

          <ProvisionMemberSubmitButton />
        </form>
      </CardContent>
    </Card>
  );
}
