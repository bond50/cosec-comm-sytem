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
    <div className="rounded-[18px] border border-slate-200 bg-slate-50/90 px-3.5 py-3 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[0.95rem] font-medium text-slate-900">
            {emailValue}
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onChangeEmail}
          className="h-8 shrink-0 rounded-lg px-2.5 text-[0.86rem]"
        >
          Change
        </Button>
      </div>

      <input type="hidden" name="email" value={emailValue} />
    </div>
  );
}
