import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

type AuthAccessEmailSummaryProps = {
  emailValue: string;
  onChangeEmail: () => void;
};

export function AuthAccessEmailSummary({
  emailValue,
  onChangeEmail,
}: AuthAccessEmailSummaryProps) {
  return (
    <div className="rounded-[20px] border border-slate-200 bg-slate-50/90 px-4 py-4 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            Email confirmed
          </p>
          <p className="mt-1 truncate text-[0.95rem] font-medium text-slate-900">
            {emailValue}
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Continue with the access path resolved for this account.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onChangeEmail}
          className="h-9 shrink-0 rounded-xl px-3 text-[0.92rem]"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Change
        </Button>
      </div>

      <input type="hidden" name="email" value={emailValue} />
    </div>
  );
}
