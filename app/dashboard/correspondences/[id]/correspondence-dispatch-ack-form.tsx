"use client";

import { useEffect } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  initialCorrespondenceDispatchAcknowledgeState,
  type CorrespondenceDispatchAcknowledgeActionState,
} from "@/features/correspondence/lib/correspondence.shared";
import { acknowledgeDispatchAction } from "@/features/correspondence/lib/acknowledge-dispatch";

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

function AcknowledgeSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving acknowledgement..." : "Confirm receipt"}
    </Button>
  );
}

type CorrespondenceDispatchAcknowledgeFormProps = {
  dispatchId: string;
  currentUserId: string;
  acknowledgedAt: Date | null;
};

export function CorrespondenceDispatchAcknowledgeForm({
  dispatchId,
  currentUserId,
  acknowledgedAt,
}: CorrespondenceDispatchAcknowledgeFormProps) {
  const router = useRouter();
  const initialState: CorrespondenceDispatchAcknowledgeActionState = {
    ...initialCorrespondenceDispatchAcknowledgeState,
    values: {
      dispatchId,
      acknowledgedAt: toDateTimeLocalValue(acknowledgedAt ?? new Date()),
      acknowledgedByUserId: currentUserId,
      status: "ACKNOWLEDGED",
    },
  };

  const [state, formAction] = useActionState(
    acknowledgeDispatchAction,
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
      <input type="hidden" name="dispatchId" value={dispatchId} />
      <input type="hidden" name="acknowledgedByUserId" value={currentUserId} />
      <input type="hidden" name="status" value="ACKNOWLEDGED" />

      <Field>
        <FieldLabel htmlFor={`acknowledged-at-${dispatchId}`} required>
          Received at
        </FieldLabel>
        <Input
          id={`acknowledged-at-${dispatchId}`}
          name="acknowledgedAt"
          type="datetime-local"
          defaultValue={values.acknowledgedAt || ""}
        />
        <FieldError>{fieldErrors.acknowledgedAt?.[0]}</FieldError>
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
        <AcknowledgeSubmitButton />
      </div>
    </form>
  );
}
