import Image from "next/image";
import {
  DEFAULT_ORGANIZATION_LOGO_PATH,
  DEFAULT_ORGANIZATION_NAME,
  DEFAULT_ORGANIZATION_SUPPORT_LINE,
  DEFAULT_ORGANIZATION_TAGLINE,
  DEFAULT_ORGANIZATION_UNIT,
} from "@/features/application/lib/portal-branding";

type AuthBrandMarkProps = {
  organizationName?: string;
  organizationUnit?: string;
  organizationSupportLine?: string;
  organizationTagline?: string;
  logoPath?: string;
  compact?: boolean;
  iconOnly?: boolean;
};

export function AuthBrandMark({
  organizationName = DEFAULT_ORGANIZATION_NAME,
  organizationUnit = DEFAULT_ORGANIZATION_UNIT,
  organizationSupportLine = DEFAULT_ORGANIZATION_SUPPORT_LINE,
  organizationTagline = DEFAULT_ORGANIZATION_TAGLINE,
  logoPath = DEFAULT_ORGANIZATION_LOGO_PATH,
  compact = false,
  iconOnly = false,
}: AuthBrandMarkProps) {
  return (
    <div className={compact ? "space-y-1.5" : "space-y-3"}>
      <div
        className={
          compact
            ? "flex h-[3.5rem] w-[3.5rem] items-center justify-center p-0 sm:h-[4rem] sm:w-[4rem]"
            : "flex h-20 w-20 items-center justify-center p-0"
        }
      >
        <Image
          src={logoPath}
          alt={`${organizationName} logo`}
          width={compact ? 64 : 80}
          height={compact ? 64 : 80}
          className="h-auto w-auto"
          priority
        />
      </div>

      {iconOnly ? null : (
        <div
          className={
            compact
              ? "min-w-0 max-w-full space-y-0 auth-brand-meta"
              : "space-y-1"
          }
        >
          <p
            className={
              compact
                ? "text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-slate-500 sm:text-[0.66rem]"
                : "text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500"
            }
          >
            {organizationName}
          </p>
          {compact ? (
            <>
              <p className="w-full text-[0.96rem] font-semibold leading-[1.08] tracking-[-0.012em] text-slate-950">
                {organizationUnit}
              </p>
              <p className="pt-1 text-[0.73rem] leading-[1.3] text-slate-400">
                {organizationSupportLine}
              </p>
            </>
          ) : (
            <h1
              data-display="true"
              className="max-w-lg text-2xl font-semibold tracking-tight text-slate-900"
            >
              {organizationUnit}
            </h1>
          )}
          {!compact ? (
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--brand)]">
              {organizationTagline}
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
