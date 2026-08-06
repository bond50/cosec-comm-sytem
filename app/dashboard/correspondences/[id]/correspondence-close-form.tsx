"use client";

import { useEffect, useRef } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
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
import {
  initialCorrespondenceCloseState,
  type CorrespondenceCloseActionState,
} from "@/features/correspondence/lib/correspondence.shared";
import { closeCorrespondenceAction } from "@/features/correspondence/lib/close-correspondence";

type CorrespondenceCloseFormProps = {
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

function CloseSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving verification..." : "Verify and close"}
    </Button>
  );
}

export function CorrespondenceCloseForm({
  correspondenceId,
}: CorrespondenceCloseFormProps) {
  const router = useRouter();
  const statusInputRef = useRef<HTMLInputElement>(null);
  const initialState: CorrespondenceCloseActionState = {
    ...initialCorrespondenceCloseState,
    values: {
      correspondenceId,
      closedAt: toDateTimeLocalValue(new Date()),
      status: "CLOSED",
      closureNote: "",
    },
  };

  const [state, formAction] = useActionState(
    closeCorrespondenceAction,
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
      className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 sm:col-span-2"
    >
      <p className="text-sm text-slate-600">
        Finalize only after feedback has returned and been verified.
      </p>

      <input type="hidden" name="correspondenceId" value={correspondenceId} />
      <input
        ref={statusInputRef}
        type="hidden"
        name="status"
        defaultValue={values.status || "CLOSED"}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor={`closed-at-${correspondenceId}`} required>
            Verified at
          </FieldLabel>
          <Input
            id={`closed-at-${correspondenceId}`}
            name="closedAt"
            type="datetime-local"
            defaultValue={values.closedAt || ""}
          />
          <FieldError>{fieldErrors.closedAt?.[0]}</FieldError>
        </Field>

        <Field>
          <FieldLabel htmlFor={`final-status-${correspondenceId}`} required>
            Closure outcome
          </FieldLabel>
          <Select
            key={`final-status-${values.status || "CLOSED"}`}
            defaultValue={values.status || "CLOSED"}
            onValueChange={(value) => {
              if (statusInputRef.current) {
                statusInputRef.current.value = value;
              }
            }}
          >
            <SelectTrigger
              id={`final-status-${correspondenceId}`}
              className="h-11 w-full rounded-[10px] border-slate-200 bg-white text-[15px] shadow-none"
            >
              <SelectValue placeholder="Select closure outcome" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CLOSED">Closed</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <FieldError>{fieldErrors.status?.[0]}</FieldError>
        </Field>
      </div>

      <Field>
        <FieldLabel htmlFor={`closure-note-${correspondenceId}`} required>
          Verification / closure note
        </FieldLabel>
        <Textarea
          id={`closure-note-${correspondenceId}`}
          name="closureNote"
          defaultValue={values.closureNote || ""}
          rows={4}
          placeholder="Record the verification or cancellation reason before finalizing this item."
        />
        <FieldError>{fieldErrors.closureNote?.[0]}</FieldError>
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
        <CloseSubmitButton />
      </div>
    </form>
  );
}
