"use client";

import { useEffect } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  initialCorrespondenceReopenState,
  type CorrespondenceReopenActionState,
} from "@/features/correspondence/lib/correspondence.shared";
import { reopenCorrespondenceAction } from "@/features/correspondence/lib/reopen-correspondence";

type CorrespondenceReopenFormProps = {
  correspondenceId: string;
};

function toDateTimeLocalValue(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  const hours = String(value.getHours()).padStart(2, "0");
  const minutes = String(value.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function ReopenSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Reopening..." : "Reopen for review"}
    </Button>
  );
}

export function CorrespondenceReopenForm({
  correspondenceId,
}: CorrespondenceReopenFormProps) {
  const router = useRouter();
  const initialState: CorrespondenceReopenActionState = {
    ...initialCorrespondenceReopenState,
    values: {
      correspondenceId,
      reopenedAt: toDateTimeLocalValue(new Date()),
      status: "UNDER_REVIEW",
      justification: "",
    },
  };

  const [state, formAction] = useActionState(
    reopenCorrespondenceAction,
    initialState,
  );

  useEffect(() => {
    if (state.ok) {
      router.refresh();
    }
  }, [router, state.ok]);

  const values = state.values ?? initialState.values!;
  const fieldErrors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-4 sm:col-span-2">
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
        Reopening sends this file back to Under Review and records the reason in
        the movement history.
      </div>

      <input type="hidden" name="correspondenceId" value={correspondenceId} />
      <input type="hidden" name="status" value="UNDER_REVIEW" />

      <Field>
        <FieldLabel htmlFor={`reopened-at-${correspondenceId}`} required>
          Reopened at
        </FieldLabel>
        <Input
          id={`reopened-at-${correspondenceId}`}
          name="reopenedAt"
          type="datetime-local"
          defaultValue={values.reopenedAt || ""}
        />
        <FieldError>{fieldErrors.reopenedAt?.[0]}</FieldError>
      </Field>

      <Field>
        <FieldLabel htmlFor={`reopen-note-${correspondenceId}`} required>
          Reason for reopening
        </FieldLabel>
        <Textarea
          id={`reopen-note-${correspondenceId}`}
          name="justification"
          defaultValue={values.justification || ""}
          rows={3}
          placeholder="Briefly explain the new official action required."
        />
        <FieldError>{fieldErrors.justification?.[0]}</FieldError>
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

      <div className="flex items-center justify-end">
        <ReopenSubmitButton />
      </div>
    </form>
  );
}
