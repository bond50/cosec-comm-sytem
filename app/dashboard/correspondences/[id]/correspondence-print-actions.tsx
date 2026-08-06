"use client";

import { Printer } from "lucide-react";

export function CorrespondencePrintActions() {
  return (
    <div className="mb-6 flex items-center justify-end gap-3 print:hidden">
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
      >
        <Printer className="h-4 w-4" />
        Print
      </button>
    </div>
  );
}
