"use client";

import { useEffect, useRef } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  initialMeetingAttachmentState,
  type MeetingAttachmentActionState,
} from "@/features/meetings/lib/meetings.shared";
import { uploadMeetingAttachmentAction } from "@/features/meetings/lib/upload-meeting-attachment";

function UploadSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Uploading..." : "Upload evidence"}
    </Button>
  );
}

export function MeetingAttachmentUploadForm({
  meetingId,
}: {
  meetingId: string;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const initialState: MeetingAttachmentActionState = {
    ...initialMeetingAttachmentState,
    values: {
      meetingId,
      fileName: "",
    },
  };
  const [state, formAction] = useActionState(
    uploadMeetingAttachmentAction,
    initialState,
  );

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      router.refresh();
    }
  }, [router, state.ok]);

  const fieldErrors = state.fieldErrors ?? {};

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
    >
      <input type="hidden" name="meetingId" value={meetingId} />

      <Field>
        <FieldLabel htmlFor={`meeting-attachment-file-${meetingId}`} required>
          Meeting evidence
        </FieldLabel>
        <Input
          id={`meeting-attachment-file-${meetingId}`}
          name="file"
          type="file"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.txt"
        />
        <p className="mt-2 text-xs text-slate-500">
          PDF, Word, Excel, JPEG, PNG, or text, up to 10 MB.
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
        <UploadSubmitButton />
      </div>
    </form>
  );
}
