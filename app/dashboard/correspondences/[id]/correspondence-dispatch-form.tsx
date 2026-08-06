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
  initialCorrespondenceDispatchState,
  type CorrespondenceDispatchActionState,
} from "@/features/correspondence/lib/correspondence.shared";
import { createDispatchAction } from "@/features/correspondence/lib/create-dispatch";

function toDateTimeLocalValue(value: Date | null) {
  if (!value) return "";

  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function DispatchSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Issuing dispatch..." : "Issue dispatch"}
    </Button>
  );
}

type CorrespondenceDispatchFormProps = {
  correspondenceId: string;
  defaultDispatchDate: Date | null;
};

export function CorrespondenceDispatchForm({
  correspondenceId,
  defaultDispatchDate,
}: CorrespondenceDispatchFormProps) {
  const router = useRouter();
  const initialState: CorrespondenceDispatchActionState = {
    ...initialCorrespondenceDispatchState,
    values: {
      correspondenceId,
      dispatchDate: toDateTimeLocalValue(defaultDispatchDate ?? new Date()),
      note: "",
      status: "SENT",
    },
  };

  const [state, formAction] = useActionState(
    createDispatchAction,
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
    <form
      action={formAction}
      className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
    >
      <input type="hidden" name="correspondenceId" value={correspondenceId} />
      <input type="hidden" name="status" value="SENT" />

      <Field>
        <FieldLabel htmlFor={`dispatch-date-${correspondenceId}`} required>
          Dispatch date
        </FieldLabel>
        <Input
          id={`dispatch-date-${correspondenceId}`}
          name="dispatchDate"
          type="datetime-local"
          defaultValue={values.dispatchDate || ""}
        />
        <FieldError>{fieldErrors.dispatchDate?.[0]}</FieldError>
      </Field>

      <Field>
        <FieldLabel htmlFor={`dispatch-note-${correspondenceId}`}>
          Dispatch instructions
        </FieldLabel>
        <Textarea
          id={`dispatch-note-${correspondenceId}`}
          name="note"
          defaultValue={values.note || ""}
          rows={3}
          placeholder="Optional dispatch instructions for the receiving office."
        />
        <FieldError>{fieldErrors.note?.[0]}</FieldError>
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
        <DispatchSubmitButton />
      </div>
    </form>
  );
}
