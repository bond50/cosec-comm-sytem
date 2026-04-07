"use client";

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
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { initialCreateDepartmentState } from "@/features/application/lib/create-department.shared";
import { createDepartmentAction } from "@/features/application/lib/create-department";

function CreateDepartmentSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button className="w-full" size="lg" type="submit" disabled={pending}>
      {pending ? "Creating department..." : "Create department"}
    </Button>
  );
}

export function CreateDepartmentForm() {
  const [state, formAction] = useActionState(
    createDepartmentAction,
    initialCreateDepartmentState,
  );

  const values = state.values ?? initialCreateDepartmentState.values ?? {};
  const fieldErrors = state.fieldErrors ?? {};

  return (
    <Card className="rounded-2xl border-slate-200 shadow-sm 2xl:sticky 2xl:top-24">
      <CardHeader className="space-y-2 border-b border-slate-200 px-6 py-5">
        <CardTitle className="text-xl tracking-[-0.03em] text-slate-950">
          Create department
        </CardTitle>
        <CardDescription className="max-w-xl leading-6">
          Add a department within the current organization structure.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 pb-6 pt-5">
        <form action={formAction} className="space-y-5">
          <Field>
            <FieldLabel htmlFor="department-name" required>
              Name
            </FieldLabel>
            <Input
              id="department-name"
              name="name"
              defaultValue={values.name ?? ""}
              placeholder="Registry"
              autoComplete="organization-title"
            />
            <FieldError>{fieldErrors.name?.[0]}</FieldError>
          </Field>

          <Field>
            <FieldLabel htmlFor="department-code">Code</FieldLabel>
            <Input
              id="department-code"
              name="code"
              defaultValue={values.code ?? ""}
              placeholder="REG"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
            />
            <FieldDescription>
              Optional short identifier for this department.
            </FieldDescription>
            <FieldError>{fieldErrors.code?.[0]}</FieldError>
          </Field>

          <Field>
            <FieldLabel htmlFor="department-description">
              Description
            </FieldLabel>
            <Textarea
              id="department-description"
              name="description"
              defaultValue={values.description ?? ""}
              placeholder="Handles registry and document intake."
              className="min-h-28 resize-none"
            />
            <FieldError>{fieldErrors.description?.[0]}</FieldError>
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

          <div className="pt-1">
            <CreateDepartmentSubmitButton />
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
