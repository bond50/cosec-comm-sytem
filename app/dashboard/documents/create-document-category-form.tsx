"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { createDocumentCategoryAction } from "@/features/documents/lib/create-document-category";
import { initialDocumentCategoryCreateState } from "@/features/documents/lib/documents.shared";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full sm:w-auto" disabled={pending}>
      {pending ? "Creating..." : "Create category"}
    </Button>
  );
}

export function CreateDocumentCategoryForm({
  mode = "card",
  onSuccess,
}: {
  mode?: "card" | "dialog";
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState(
    createDocumentCategoryAction,
    initialDocumentCategoryCreateState,
  );
  const values =
    state.values ?? initialDocumentCategoryCreateState.values ?? {};
  const fieldErrors = state.fieldErrors ?? {};

  useEffect(() => {
    if (!state.ok) return;
    router.refresh();
    onSuccess?.();
  }, [onSuccess, router, state.ok]);

  const formContent = (
    <form action={formAction} className="space-y-4">
      <Field>
        <FieldLabel htmlFor="document-category-name" required>
          Name
        </FieldLabel>
        <Input
          id="document-category-name"
          name="name"
          defaultValue={values.name ?? ""}
          placeholder="Incoming letters"
        />
        <FieldError>{fieldErrors.name?.[0]}</FieldError>
      </Field>

      <Field>
        <FieldLabel htmlFor="document-category-description">
          Description
        </FieldLabel>
        <Textarea
          id="document-category-description"
          name="description"
          defaultValue={values.description ?? ""}
          rows={4}
          placeholder="Used for official letters and external submissions."
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

      <SubmitButton />
    </form>
  );

  if (mode === "dialog") {
    return formContent;
  }

  return (
    <Card className="rounded-2xl border-slate-200 shadow-sm">
      <CardHeader className="space-y-2 px-6 py-5">
        <CardTitle className="text-lg tracking-[-0.03em] text-slate-950">
          Create category
        </CardTitle>
        <CardDescription>
          Organize registry records into repeatable document classes.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 pb-6">{formContent}</CardContent>
    </Card>
  );
}
