import { AlertCircle, CheckCircle2, Info, Mail } from "lucide-react";
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

  const tone =
    type === "error"
      ? {
          border: "border-rose-200",
          bg: "bg-rose-50/90",
          text: "text-rose-700",
          badge: "bg-white text-rose-600",
        }
      : type === "success"
        ? {
            border: "border-emerald-200",
            bg: "bg-emerald-50/90",
            text: "text-emerald-700",
            badge: "bg-white text-emerald-600",
          }
        : {
            border: "border-[var(--brand-border)]",
            bg: "bg-[var(--brand-soft)]",
            text: "text-[var(--foreground)]",
            badge: "bg-white text-[var(--brand)]",
          };

  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-3 rounded-2xl border shadow-sm",
        compact ? "p-4" : "p-5",
        tone.border,
        tone.bg,
        className,
      )}
    >
      <span
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full shadow-sm",
          compact ? "h-9 w-9" : "h-10 w-10",
          tone.badge,
        )}
      >
        <Icon className={compact ? "h-4 w-4" : "h-[1.1rem] w-[1.1rem]"} />
      </span>
      <div className="min-w-0 space-y-1 pt-0.5">
        {title ? (
          <p
            className={cn(
              "font-semibold",
              compact ? "text-[0.95rem]" : "text-base",
              tone.text,
            )}
          >
            {title}
          </p>
        ) : null}
        <p
          className={cn(
            "leading-6",
            compact ? "text-[0.92rem]" : "text-sm",
            tone.text,
          )}
        >
          {message}
        </p>
      </div>
    </div>
  );
}
