"use client";

import { useEffect } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  initialCorrespondenceDispatchFeedbackState,
  type CorrespondenceDispatchFeedbackActionState,
} from "@/features/correspondence/lib/correspondence.shared";
import { receiveDispatchFeedbackAction } from "@/features/correspondence/lib/receive-dispatch-feedback";

function FeedbackSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving feedback..." : "Return feedback"}
    </Button>
  );
}

type CorrespondenceDispatchFeedbackFormProps = {
  dispatchId: string;
  feedbackReceivedAt: Date | null;
  feedbackNote: string | null;
};

export function CorrespondenceDispatchFeedbackForm({
  dispatchId,
  feedbackNote,
}: CorrespondenceDispatchFeedbackFormProps) {
  const router = useRouter();
  const initialState: CorrespondenceDispatchFeedbackActionState = {
    ...initialCorrespondenceDispatchFeedbackState,
    values: {
      dispatchId,
      feedbackNote: feedbackNote ?? "",
      status: "FEEDBACK_RECEIVED",
    },
  };

  const [state, formAction] = useActionState(
    receiveDispatchFeedbackAction,
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
      <input type="hidden" name="status" value="FEEDBACK_RECEIVED" />

      <div className="flex items-start gap-3 rounded-2xl border border-[#b7d3e6] bg-[#eef7fb] px-4 py-3">
        <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-[#1868a6]" />
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#124f7d]">
            Feedback return time
          </p>
          <p className="mt-1 text-sm leading-5 text-slate-600">
            Recorded automatically when you submit feedback.
          </p>
        </div>
      </div>

      <Field>
        <FieldLabel htmlFor={`feedback-note-${dispatchId}`} required>
          Feedback response
        </FieldLabel>
        <Textarea
          id={`feedback-note-${dispatchId}`}
          name="feedbackNote"
          defaultValue={values.feedbackNote || ""}
          rows={3}
          placeholder="Capture the response or execution update received from the department or officer."
        />
        <FieldError>{fieldErrors.feedbackNote?.[0]}</FieldError>
      </Field>

      <Field>
        <FieldLabel htmlFor={`feedback-file-${dispatchId}`}>
          Supporting file (optional)
        </FieldLabel>
        <Input
          id={`feedback-file-${dispatchId}`}
          name="file"
          type="file"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.txt"
        />
        <p className="mt-2 text-xs text-slate-500">
          Supported: PDF, Word, Excel, JPEG, PNG, and text files up to 10 MB.
        </p>
        <FieldError>{fieldErrors.fileName?.[0]}</FieldError>
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
        <FeedbackSubmitButton />
      </div>
    </form>
  );
}
