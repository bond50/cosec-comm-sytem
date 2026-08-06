"use client";

import { useState, type ReactNode } from "react";
import { CheckCircle2, ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CorrespondenceCurrentStepActionProps = {
  actionLabel: string;
  summary: string;
  steps?: string[];
  tone?: "default" | "caution";
  children: ReactNode;
};

const defaultWizardSteps = ["Open", "Complete", "Submit"];

export function CorrespondenceCurrentStepAction({
  actionLabel,
  summary,
  steps = defaultWizardSteps,
  tone = "default",
  children,
}: CorrespondenceCurrentStepActionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isCaution = tone === "caution";

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "flex flex-col gap-3 rounded-2xl border px-4 py-4 sm:flex-row sm:items-center sm:justify-between",
          isCaution
            ? "border-amber-200 bg-amber-50"
            : "border-[#c7ddea] bg-[#eef7fb]",
        )}
      >
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-950">{actionLabel}</p>
          <p className="mt-1 text-sm leading-6 text-slate-600">{summary}</p>
        </div>
        <Button
          type="button"
          size="sm"
          variant={isOpen || isCaution ? "outline" : "default"}
          className={cn(
            "w-full gap-2 sm:w-auto",
            isCaution &&
              !isOpen &&
              "border-amber-300 bg-amber-50 text-amber-800 hover:border-amber-400 hover:bg-amber-100",
          )}
          onClick={() => setIsOpen((current) => !current)}
          aria-expanded={isOpen}
        >
          {isOpen ? (
            <X className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
          {isOpen ? "Cancel" : actionLabel}
        </Button>
      </div>

      {isOpen ? (
        <div className="space-y-4 rounded-2xl border border-[#b7d3e6] bg-[#fbfdff] px-4 py-4 shadow-sm">
          <div className="grid gap-2 sm:grid-cols-3">
            {steps.map((step, index) => (
              <div
                key={step}
                className={cn(
                  "flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em]",
                  index === 0
                    ? "border-[#0f8a4b] bg-[#e7f6ee] text-[#0f6b3a]"
                    : "border-[#c7ddea] bg-[#eef7fb] text-[#1868a6]",
                )}
              >
                <CheckCircle2 className="h-4 w-4" />
                {step}
              </div>
            ))}
          </div>
          {children}
        </div>
      ) : null}
    </div>
  );
}
