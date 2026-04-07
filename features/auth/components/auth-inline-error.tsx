import { AlertCircle } from "lucide-react";

type AuthInlineErrorProps = {
  message?: string;
};

export function AuthInlineError({ message }: AuthInlineErrorProps) {
  if (!message) return null;

  return (
    <div className="flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
