"use client";

import { useEffect, useRef } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  initialDocumentAttachmentState,
  type DocumentAttachmentActionState,
} from "@/features/documents/lib/documents.shared";
import { uploadDocumentAttachmentAction } from "@/features/documents/lib/upload-document-attachment";

function UploadSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Uploading..." : "Upload attachment"}
    </Button>
  );
}

export function DocumentAttachmentUploadForm({
  documentId,
}: {
  documentId: string;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const initialState: DocumentAttachmentActionState = {
    ...initialDocumentAttachmentState,
    values: {
      documentId,
      fileName: "",
    },
  };
  const [state, formAction] = useActionState(
    uploadDocumentAttachmentAction,
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
      <input type="hidden" name="documentId" value={documentId} />

      <Field>
        <FieldLabel htmlFor={`document-attachment-file-${documentId}`} required>
          Supporting file
        </FieldLabel>
        <Input
          id={`document-attachment-file-${documentId}`}
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
        <UploadSubmitButton />
      </div>
    </form>
  );
}
