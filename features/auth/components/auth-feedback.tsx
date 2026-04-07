import { AlertCircle, CheckCircle2, Info, Mail } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

type AuthFeedbackProps = {
  type?: "error" | "success" | "info";
  title?: string;
  message?: string;
  icon?: "mail" | "info";
  className?: string;
  compact?: boolean;
};

export function AuthFeedback({
  type = "info",
  title,
  message,
  icon,
  className,
  compact = false,
}: AuthFeedbackProps) {
  if (!message) return null;

  const Icon =
    icon === "mail"
      ? Mail
      : type === "error"
        ? AlertCircle
        : type === "success"
          ? CheckCircle2
          : Info;

  const styles =
    type === "error"
      ? "border-rose-200 bg-rose-50/90 text-rose-700"
      : type === "success"
        ? "border-emerald-200 bg-emerald-50/90 text-emerald-700"
        : "border-[var(--brand-border)] bg-[var(--brand-soft)] text-[var(--foreground)]";

  return (
    <Alert
      className={cn(
        "shadow-sm",
        compact ? "rounded-[16px] px-4 py-3" : "rounded-[18px]",
        styles,
        className,
      )}
    >
      <Icon className={cn(compact ? "h-4 w-4" : "h-4 w-4")} />
      {title ? (
        <AlertTitle className={compact ? "mb-0.5 text-[0.95rem]" : undefined}>
          {title}
        </AlertTitle>
      ) : null}
      <AlertDescription
        className={compact ? "text-[0.92rem] leading-5" : undefined}
      >
        {message}
      </AlertDescription>
    </Alert>
  );
}
