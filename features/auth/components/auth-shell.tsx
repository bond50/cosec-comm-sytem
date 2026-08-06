// features/auth/components/auth-shell.tsx
import Image from "next/image";
import Link from "next/link";
import {
  DEFAULT_ORGANIZATION_LOGO_PATH,
  DEFAULT_ORGANIZATION_NAME,
  DEFAULT_ORGANIZATION_SYSTEM_NAME,
  DEFAULT_ORGANIZATION_UNIT,
} from "@/features/application/lib/portal-branding";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type AuthShellProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
  footerText?: string;
  footerLinkHref?: string;
  footerLinkLabel?: string;
  organizationName?: string;
  eyebrow?: string;
};

export function AuthShell({
  title,
  description,
  children,
  footerText,
  footerLinkHref,
  footerLinkLabel,
  organizationName = DEFAULT_ORGANIZATION_NAME,
  eyebrow,
}: AuthShellProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] p-4">
      <div className="w-full max-w-[560px]">
        <div className="mb-8 flex flex-col items-center justify-center gap-2 text-center">
          <Image
            src={DEFAULT_ORGANIZATION_LOGO_PATH}
            alt={`${organizationName} logo`}
            width={84}
            height={84}
            priority
          />
          <span className="mt-2 text-xl font-bold uppercase tracking-wide text-slate-900">
            {organizationName}
          </span>
          <span className="text-sm font-semibold uppercase tracking-wide text-[var(--brand-sidebar)]">
            {DEFAULT_ORGANIZATION_UNIT}
          </span>
          <div className="mt-2 flex w-full items-center gap-3">
            <span className="h-px flex-1 bg-[var(--brand-tagline)]" />
            <span className="shrink-0 text-sm font-semibold text-[var(--brand-tagline)]">
              {DEFAULT_ORGANIZATION_SYSTEM_NAME}
            </span>
            <span className="h-px flex-1 bg-[var(--brand-tagline)]" />
          </div>
        </div>

        <Card className="w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
          {title || description || eyebrow ? (
            <CardHeader className="space-y-1.5 px-0 pb-6 pt-0">
              {eyebrow ? (
                <div className="inline-flex w-fit items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {eyebrow}
                </div>
              ) : null}
              {title ? (
                <CardTitle className="text-xl font-semibold text-slate-900">
                  {title}
                </CardTitle>
              ) : null}
              {description ? (
                <CardDescription className="text-sm leading-6 text-slate-500">
                  {description}
                </CardDescription>
              ) : null}
            </CardHeader>
          ) : null}

          <CardContent className="space-y-5 px-0 pb-0">
            {children}
            {footerText && footerLinkHref && footerLinkLabel ? (
              <p className="pt-1 text-center text-sm text-slate-500">
                {footerText}{" "}
                <Link
                  href={footerLinkHref}
                  className="font-medium text-[var(--brand)] hover:text-[var(--brand-strong)]"
                >
                  {footerLinkLabel}
                </Link>
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
