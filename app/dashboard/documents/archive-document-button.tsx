"use client";

import { useActionState } from "react";
import { Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { archiveDocumentAction } from "@/features/documents/lib/archive-document";
import { initialDocumentArchiveState } from "@/features/documents/lib/documents.shared";

export function ArchiveDocumentButton({
  documentId,
  isArchived,
  compact = false,
}: {
  documentId: string;
  isArchived: boolean;
  compact?: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    archiveDocumentAction,
    initialDocumentArchiveState,
  );

  if (isArchived) {
    return (
      <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-500">
        Archived
      </span>
    );
  }

  return (
    <form action={formAction}>
      <input type="hidden" name="documentId" value={documentId} />
      <Button
        type="submit"
        variant="outline"
        size="sm"
        disabled={pending}
        className={compact ? "h-9 w-9 rounded-xl p-0" : "rounded-xl"}
        aria-label={pending ? "Archiving document" : "Archive document"}
        title={pending ? "Archiving..." : "Archive"}
      >
        <Archive className={compact ? "h-4 w-4" : "mr-1.5 h-4 w-4"} />
        {compact ? null : pending ? "Archiving..." : "Archive"}
      </Button>
      {state.message && !state.ok ? (
        <p className="mt-2 max-w-[180px] text-xs text-rose-600">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
