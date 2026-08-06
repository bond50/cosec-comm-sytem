"use client";

import { useEffect } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { Clock3, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import {
  initialCorrespondenceReviewState,
  type CorrespondenceReviewActionState,
} from "@/features/correspondence/lib/correspondence.shared";
import { reviewCorrespondenceAction } from "@/features/correspondence/lib/review-correspondence";

type CorrespondenceReviewFormProps = {
  correspondenceId: string;
  instructions: string | null;
};

function ReviewSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving instructions..." : "Save review instructions"}
    </Button>
  );
}

export function CorrespondenceReviewForm({
  correspondenceId,
  instructions,
}: CorrespondenceReviewFormProps) {
  const router = useRouter();
  const initialState: CorrespondenceReviewActionState = {
    ...initialCorrespondenceReviewState,
    values: {
      correspondenceId,
      instructions: instructions ?? "",
      status: "UNDER_REVIEW",
    },
  };

  const [state, formAction] = useActionState(
    reviewCorrespondenceAction,
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
      <input type="hidden" name="correspondenceId" value={correspondenceId} />
      <input type="hidden" name="status" value="UNDER_REVIEW" />

      <div className="grid gap-3 rounded-2xl border border-[#b7d3e6] bg-[#eef7fb] px-4 py-3 sm:grid-cols-2">
        <div className="flex items-start gap-3">
          <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-[#1868a6]" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#124f7d]">
              Review time
            </p>
            <p className="mt-1 text-sm leading-5 text-slate-600">
              Recorded automatically when you save.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#0f6b3a]" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#0f6b3a]">
              Reviewing officer
            </p>
            <p className="mt-1 text-sm leading-5 text-slate-600">
              Recorded as the signed-in authorized reviewer.
            </p>
          </div>
        </div>
      </div>

      <Field>
        <FieldLabel
          htmlFor={`review-instructions-${correspondenceId}`}
          required
        >
          Review instructions
        </FieldLabel>
        <Textarea
          id={`review-instructions-${correspondenceId}`}
          name="instructions"
          defaultValue={values.instructions || ""}
          rows={4}
          placeholder="Record the County Secretary review outcome and the next handling direction."
        />
        <FieldError>{fieldErrors.instructions?.[0]}</FieldError>
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
        <ReviewSubmitButton />
      </div>
    </form>
  );
}
