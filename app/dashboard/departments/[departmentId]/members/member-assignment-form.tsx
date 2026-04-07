"use client";

import { useRef } from "react";
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
import { assignMemberToDepartmentAction } from "@/features/application/lib/assign-member-to-department";
import type { AssignableDepartmentHeadCandidate } from "@/features/application/queries/memberships";

type AssignMemberToDepartmentFormProps = {
  departmentId: string;
  candidates: AssignableDepartmentHeadCandidate[];
};

type AssignMemberToDepartmentFormState = {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string[] | undefined>;
  values?: Record<string, string>;
  data?: {
    userId: string;
    departmentId: string;
  };
};

const initialAssignMemberToDepartmentState: AssignMemberToDepartmentFormState =
  {
    ok: false,
    message: "",
    fieldErrors: {},
    values: {},
  };

function AssignMemberSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button className="w-full" size="lg" type="submit" disabled={pending}>
      {pending ? "Assigning member..." : "Assign member"}
    </Button>
  );
}

export function MemberAssignmentForm({
  departmentId,
  candidates,
}: AssignMemberToDepartmentFormProps) {
  const [state, formAction] = useActionState(
    assignMemberToDepartmentAction,
    initialAssignMemberToDepartmentState,
  );

  const fieldErrors = state.fieldErrors ?? {};
  const values = state.values ?? {};
  const userIdInputRef = useRef<HTMLInputElement>(null);

  return (
    <Card className="rounded-[22px] border-slate-200 shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
      <CardHeader className="space-y-2 px-6 py-5">
        <CardTitle className="text-[1.05rem] text-slate-950">
          Assign member
        </CardTitle>
        <CardDescription className="text-sm leading-6 text-slate-600">
          Select an active organization member and assign them to this
          department.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <form action={formAction} className="space-y-5">
          <input type="hidden" name="departmentId" value={departmentId} />

          <Field>
            <FieldLabel htmlFor="department-member" required>
              Member
            </FieldLabel>
            <input
              ref={userIdInputRef}
              type="hidden"
              name="userId"
              defaultValue={values.userId ?? ""}
            />
            <Select
              key={`department-member-${values.userId ?? ""}`}
              defaultValue={values.userId ?? ""}
              onValueChange={(value) => {
                if (userIdInputRef.current) {
                  userIdInputRef.current.value = value;
                }
              }}
            >
              <SelectTrigger
                id="department-member"
                className="h-12 w-full rounded-[10px] border-slate-200 bg-white text-[15px] shadow-none"
              >
                <SelectValue placeholder="Select a member" />
              </SelectTrigger>
              <SelectContent>
                {candidates.map((candidate) => (
                  <SelectItem key={candidate.user.id} value={candidate.user.id}>
                    {candidate.user.name ||
                      candidate.user.email ||
                      candidate.user.id}
                    {" - "}
                    {candidate.role.replaceAll("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError>{fieldErrors.userId?.[0]}</FieldError>
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

          <AssignMemberSubmitButton />
        </form>
      </CardContent>
    </Card>
  );
}
