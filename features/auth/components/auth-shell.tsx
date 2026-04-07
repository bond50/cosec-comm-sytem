// features/auth/components/auth-shell.tsx
import Link from "next/link";
import { ArrowRight, ShieldCheck, Workflow } from "lucide-react";
import {
  DEFAULT_AUTH_PANEL_IMAGE,
  DEFAULT_ORGANIZATION_NAME,
  DEFAULT_ORGANIZATION_TAGLINE,
  DEFAULT_ORGANIZATION_UNIT,
} from "@/features/application/lib/portal-branding";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AuthBrandMark } from "@/features/auth/components/auth-brand-mark";

type AuthShellProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
  footerText?: string;
  footerLinkHref?: string;
  footerLinkLabel?: string;
  organizationName?: string;
  organizationUnit?: string;
  organizationTagline?: string;
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
  organizationUnit = DEFAULT_ORGANIZATION_UNIT,
  organizationTagline = DEFAULT_ORGANIZATION_TAGLINE,
  eyebrow,
}: AuthShellProps) {
  return (
    <div className="auth-shell min-h-screen bg-[linear-gradient(180deg,#f7f9fc_0%,#eef3f8_100%)] p-0 sm:p-4">
      <div className="mx-auto grid min-h-screen max-w-[1480px] overflow-hidden rounded-none border border-white/90 bg-white shadow-[0_24px_72px_rgba(15,23,42,0.10),0_2px_10px_rgba(15,23,42,0.04)] ring-1 ring-slate-200/70 sm:min-h-[calc(100vh-2rem)] sm:rounded-[24px] lg:grid-cols-[minmax(470px,560px)_minmax(0,1fr)]">
        <section className="auth-shell-panel flex items-center justify-center bg-white px-6 py-6 sm:px-10 sm:py-8 lg:px-12 xl:px-14">
          <Card className="auth-shell-card w-full max-w-[420px] border-0 bg-transparent shadow-none">
            <CardHeader className="auth-shell-header space-y-5 px-0 pt-0">
              <AuthBrandMark
                compact
                organizationName={organizationName}
                organizationUnit={organizationUnit}
                organizationTagline={organizationTagline}
              />

              {title || description || eyebrow ? (
                <div className="auth-shell-copy space-y-3">
                  {eyebrow ? (
                    <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      {eyebrow}
                    </div>
                  ) : null}
                  {title ? (
                    <CardTitle
                      data-display="true"
                      className="max-w-[14ch] text-[2.25rem] font-semibold leading-[1.02] tracking-[-0.05em] text-slate-950"
                    >
                      {title}
                    </CardTitle>
                  ) : null}
                  {description ? (
                    <CardDescription className="auth-shell-description max-w-[38ch] text-[0.95rem] leading-6 text-slate-500">
                      {description}
                    </CardDescription>
                  ) : null}
                </div>
              ) : null}
            </CardHeader>
            <CardContent className="auth-shell-content space-y-4 px-0 pb-0">
              {children}
              {footerText && footerLinkHref && footerLinkLabel ? (
                <p className="auth-shell-footer text-[0.82rem] text-slate-400">
                  {footerText}{" "}
                  <Link
                    href={footerLinkHref}
                    className="font-medium text-slate-600 hover:text-slate-800"
                  >
                    {footerLinkLabel}
                  </Link>
                </p>
              ) : null}
            </CardContent>
          </Card>
        </section>

        <section className="relative hidden h-full overflow-hidden bg-[#eef2f6] lg:block">
          <div
            className="absolute inset-0 scale-[1] bg-cover bg-[center_82%]"
            style={{
              backgroundImage: `linear-gradient(180deg, rgba(255,255,255,0.03), rgba(15,23,42,0.24)), url('${DEFAULT_AUTH_PANEL_IMAGE}')`,
            }}
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.03),rgba(15,23,42,0.14))]" />
          <div className="relative z-10 flex h-full flex-col justify-between p-10 xl:p-12">
            <div className="max-w-[420px] rounded-[28px] border border-white/35 bg-white/12 p-6 text-white shadow-[0_24px_54px_rgba(15,23,42,0.16)] backdrop-blur-md">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-white/70">
                Communication movement + accountability
              </p>
              <h2 className="mt-4 text-[2rem] font-semibold leading-[1.02] tracking-[-0.05em]">
                Secure access into the organization workspace.
              </h2>
              <p className="mt-4 text-sm leading-6 text-white/78">
                Sign in to manage organization setup, people, departments, and
                the correspondence workflow that follows.
              </p>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <div className="rounded-[24px] border border-white/30 bg-white/14 p-5 text-white backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/18">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">Tenant-scoped</div>
                    <div className="text-sm leading-6 text-white/72">
                      Each organization stays isolated after access is granted.
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[24px] border border-white/30 bg-white/14 p-5 text-white backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/18">
                    <Workflow className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">Workflow-ready</div>
                    <div className="text-sm leading-6 text-white/72">
                      Entry leads into members, departments, and correspondence.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 self-start rounded-full border border-white/30 bg-white/12 px-4 py-2 text-sm font-medium text-white/82 backdrop-blur-md">
              Protected workspace
              <ArrowRight className="h-4 w-4" />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
