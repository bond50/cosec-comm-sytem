// features/auth/components/auth-status-card.tsx
import Link from "next/link";
import type { ReactNode } from "react";
import { getPortalBranding } from "@/features/application/queries/settings";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type StatusTone = "info" | "success" | "warning" | "error";

const TONE_STYLES: Record<StatusTone, string> = {
  info: "bg-[var(--brand-soft)] text-[var(--brand)]",
  success: "bg-emerald-50 text-emerald-600",
  warning: "bg-amber-50 text-amber-600",
  error: "bg-rose-50 text-rose-600",
};

type AuthStatusCardProps = {
  title: string;
  description: string;
  icon?: ReactNode;
  tone?: StatusTone;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  organizationName?: string;
};

export async function AuthStatusCard({
  title,
  description,
  icon,
  tone = "info",
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
  organizationName,
}: AuthStatusCardProps) {
  const branding = organizationName
    ? { organizationName }
    : await getPortalBranding();

  return (
    <AuthShell
      title={title}
      description={description}
      organizationName={organizationName ?? branding.organizationName}
    >
      <div className="space-y-6">
        {icon ? (
          <div className="flex justify-center">
            <div
              className={cn(
                "auth-status-icon flex h-20 w-20 items-center justify-center rounded-full",
                TONE_STYLES[tone],
              )}
            >
              {icon}
            </div>
          </div>
        ) : null}

        {(primaryHref && primaryLabel) || (secondaryHref && secondaryLabel) ? (
          <div className="flex flex-col gap-3 sm:flex-row">
            {primaryHref && primaryLabel ? (
              <Link
                href={primaryHref}
                className={cn(buttonVariants({ size: "default" }), "flex-1")}
              >
                {primaryLabel}
              </Link>
            ) : null}

            {secondaryHref && secondaryLabel ? (
              <Link
                href={secondaryHref}
                className={cn(
                  buttonVariants({ variant: "outline", size: "default" }),
                  "flex-1",
                )}
              >
                {secondaryLabel}
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>
    </AuthShell>
  );
}
