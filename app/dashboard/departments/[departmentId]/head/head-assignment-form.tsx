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
import { assignDepartmentHeadAction } from "@/features/application/lib/assign-department-head";
import type { DepartmentMember } from "@/features/application/queries/department-members";

type HeadAssignmentFormProps = {
  departmentId: string;
  candidates: DepartmentMember[];
};

type HeadAssignmentFormState = {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string[] | undefined>;
  values?: Record<string, string>;
  data?: {
    departmentId: string;
    userId: string;
  };
};

const initialHeadAssignmentState: HeadAssignmentFormState = {
  ok: false,
  message: "",
  fieldErrors: {},
  values: {},
};

function AssignHeadSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button className="w-full" size="lg" type="submit" disabled={pending}>
      {pending ? "Assigning head..." : "Assign department head"}
    </Button>
  );
}

export function HeadAssignmentForm({
  departmentId,
  candidates,
}: HeadAssignmentFormProps) {
  const [state, formAction] = useActionState(
    assignDepartmentHeadAction,
    initialHeadAssignmentState,
  );

  const fieldErrors = state.fieldErrors ?? {};
  const values = state.values ?? {};
  const userIdInputRef = useRef<HTMLInputElement>(null);

  return (
    <Card className="rounded-[22px] border-slate-200 shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
      <CardHeader className="space-y-2 px-6 py-5">
        <CardTitle className="text-[1.05rem] text-slate-950">
          Assign department head
        </CardTitle>
        <CardDescription className="text-sm leading-6 text-slate-600">
          Select a current department member to lead this department.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <form action={formAction} className="space-y-5">
          <input type="hidden" name="departmentId" value={departmentId} />

          <Field>
            <FieldLabel htmlFor="department-head-member" required>
              Member
            </FieldLabel>
            <input
              ref={userIdInputRef}
              type="hidden"
              name="userId"
              defaultValue={values.userId ?? ""}
            />
            <Select
              key={`department-head-${values.userId ?? ""}`}
              defaultValue={values.userId ?? ""}
              onValueChange={(value) => {
                if (userIdInputRef.current) {
                  userIdInputRef.current.value = value;
                }
              }}
            >
              <SelectTrigger
                id="department-head-member"
                className="h-12 w-full rounded-[10px] border-slate-200 bg-white text-[15px] shadow-none"
              >
                <SelectValue placeholder="Select a member" />
              </SelectTrigger>
              <SelectContent>
                {candidates.map((candidate) => (
                  <SelectItem key={candidate.userId} value={candidate.userId}>
                    {candidate.name || candidate.email || candidate.userId}
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

          <AssignHeadSubmitButton />
        </form>
      </CardContent>
    </Card>
  );
}
