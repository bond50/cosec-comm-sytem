import { redirect } from "next/navigation";
import { ArrowRight, Building2, ShieldCheck, UserRoundCog } from "lucide-react";
import { auth } from "@/auth";
import { Card, CardContent } from "@/components/ui/card";
import { OrganizationSetupForm } from "@/app/dashboard/organization/setup/organization-setup-form";
import { getPortalBranding } from "@/features/application/queries/settings";
import { getCurrentOrganization } from "@/features/auth/utils/current-organization";

export default async function OrganizationSetupPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  const [branding, activeOrganization] = await Promise.all([
    getPortalBranding(),
    getCurrentOrganization(),
  ]);

  if (activeOrganization) {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <header className="grid gap-6 rounded-[24px] border border-slate-200 bg-white px-6 py-6 shadow-[0_18px_48px_rgba(15,23,42,0.06)] xl:grid-cols-[minmax(0,1.45fr)_360px]">
        <div className="space-y-4">
          <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-slate-500">
            {branding.organizationName}
          </div>
          <div className="space-y-2">
            <h1 className="text-[1.85rem] font-semibold leading-tight tracking-[-0.04em] text-slate-950">
              Organization setup
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-slate-600">
              Your account is signed in, but no active organization has been
              attached yet. Create the first organization to continue into the
              protected business area and unlock the foundation workflow.
            </p>
          </div>
        </div>

        <div className="rounded-[22px] border border-slate-200 bg-slate-50/70 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Setup outcome
          </p>
          <div className="mt-5 space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#edf2ff] text-[#465fff]">
                  <Building2 className="h-4 w-4" />
                </div>
                <div className="text-sm leading-6 text-slate-700">
                  Create the first tenant-scoped organization record.
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#edf2ff] text-[#465fff]">
                  <UserRoundCog className="h-4 w-4" />
                </div>
                <div className="text-sm leading-6 text-slate-700">
                  Grant your account the first active{" "}
                  <span className="font-medium text-slate-950">ORG_ADMIN</span>{" "}
                  membership.
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-[22px] border-slate-200 shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
          <CardContent className="flex items-start justify-between px-6 py-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                First tenant
              </p>
              <p className="mt-3 text-[1.1rem] font-semibold tracking-[-0.03em] text-slate-950">
                Organization record
              </p>
              <p className="mt-1 text-sm text-slate-600">
                The root business container for all scoped data
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf2ff] text-[#465fff]">
              <Building2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[22px] border-slate-200 shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
          <CardContent className="flex items-start justify-between px-6 py-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                First admin
              </p>
              <p className="mt-3 text-[1.1rem] font-semibold tracking-[-0.03em] text-slate-950">
                ORG_ADMIN
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Foundation governance begins with your membership
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf2ff] text-[#465fff]">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[22px] border-slate-200 shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
          <CardContent className="flex items-start justify-between px-6 py-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Next phase
              </p>
              <p className="mt-3 text-[1.1rem] font-semibold tracking-[-0.03em] text-slate-950">
                Members and departments
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Build accountability structure before correspondence intake
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf2ff] text-[#465fff]">
              <ArrowRight className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <OrganizationSetupForm defaultName={branding.organizationName} />

        <Card className="rounded-[22px] border-slate-200 shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
          <CardContent className="space-y-4 px-6 py-6">
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                What happens next
              </p>
              <p className="text-sm leading-6 text-slate-700">
                The new organization will be created immediately and your
                account will receive an active membership with
                <span className="font-medium text-slate-900"> ORG_ADMIN</span>.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm leading-6 text-slate-700">
              Use a stable slug. It will become the organization identifier for
              future selection, routing, and organization-scoped queries.
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm leading-6 text-slate-700">
              After setup, the dashboard shell stays the same, but all members,
              departments, and later correspondence data will be isolated under
              this organization.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
