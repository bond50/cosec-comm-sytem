"use client";

import { useRef } from "react";
import { DepartmentStatus } from "@prisma/client";
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
import { Textarea } from "@/components/ui/textarea";
import { updateDepartmentAction } from "@/features/application/lib/update-department";
import { initialUpdateDepartmentState } from "@/features/application/lib/update-department.shared";

type DepartmentEditFormProps = {
  department: {
    id: string;
    name: string;
    code: string | null;
    description: string | null;
    status: DepartmentStatus;
  };
};

function UpdateDepartmentSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button className="w-full" size="lg" type="submit" disabled={pending}>
      {pending ? "Saving department..." : "Save department changes"}
    </Button>
  );
}

export function DepartmentEditForm({ department }: DepartmentEditFormProps) {
  const [state, formAction] = useActionState(
    updateDepartmentAction,
    initialUpdateDepartmentState,
  );

  const fieldErrors = state.fieldErrors ?? {};
  const values = state.values ?? {
    departmentId: department.id,
    name: department.name,
    code: department.code ?? "",
    description: department.description ?? "",
    status: department.status,
  };
  const statusInputRef = useRef<HTMLInputElement>(null);

  return (
    <Card className="rounded-[22px] border-slate-200 shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
      <CardHeader className="space-y-2 px-6 py-5">
        <CardTitle className="text-[1.05rem] text-slate-950">
          Edit department
        </CardTitle>
        <CardDescription className="text-sm leading-6 text-slate-600">
          Update department identity and lifecycle state without deleting the
          structure the rest of the workflow depends on.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <form action={formAction} className="space-y-5">
          <input type="hidden" name="departmentId" value={department.id} />

          <Field>
            <FieldLabel htmlFor="department-name-edit" required>
              Name
            </FieldLabel>
            <Input
              id="department-name-edit"
              name="name"
              defaultValue={values.name ?? department.name}
              placeholder="Registry"
            />
            <FieldError>{fieldErrors.name?.[0]}</FieldError>
          </Field>

          <Field>
            <FieldLabel htmlFor="department-code-edit">Code</FieldLabel>
            <Input
              id="department-code-edit"
              name="code"
              defaultValue={values.code ?? department.code ?? ""}
              placeholder="REG"
            />
            <FieldError>{fieldErrors.code?.[0]}</FieldError>
          </Field>

          <Field>
            <FieldLabel htmlFor="department-description-edit">
              Description
            </FieldLabel>
            <Textarea
              id="department-description-edit"
              name="description"
              defaultValue={values.description ?? department.description ?? ""}
              placeholder="Handles registry and document intake."
              className="min-h-28 resize-none"
            />
            <FieldError>{fieldErrors.description?.[0]}</FieldError>
          </Field>

          <Field>
            <FieldLabel htmlFor="department-status-edit" required>
              Status
            </FieldLabel>
            <input
              ref={statusInputRef}
              type="hidden"
              name="status"
              defaultValue={String(values.status ?? department.status)}
            />
            <Select
              key={`department-status-${values.status ?? department.status}`}
              defaultValue={String(values.status ?? department.status)}
              onValueChange={(value) => {
                if (statusInputRef.current) {
                  statusInputRef.current.value = value;
                }
              }}
            >
              <SelectTrigger
                id="department-status-edit"
                className="h-12 w-full rounded-[10px] border-slate-200 bg-white text-[15px] shadow-none"
              >
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {[DepartmentStatus.ACTIVE, DepartmentStatus.INACTIVE].map(
                  (status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
            <FieldError>{fieldErrors.status?.[0]}</FieldError>
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

          <UpdateDepartmentSubmitButton />
        </form>
      </CardContent>
    </Card>
  );
}
