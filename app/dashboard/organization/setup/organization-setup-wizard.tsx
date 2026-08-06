"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Building2, ShieldCheck } from "lucide-react";
import { OrganizationSetupForm } from "@/app/dashboard/organization/setup/organization-setup-form";
import { DepartmentSetupWizard } from "@/app/dashboard/organization/setup/departments/department-setup-wizard";
import type { DepartmentSummary } from "@/features/application/queries/departments";

type OrganizationSetupWizardProps = {
  hasOrganization: boolean;
  organizationName: string;
  departments: DepartmentSummary[];
  canManageDepartments: boolean;
};

export function OrganizationSetupWizard({
  hasOrganization,
  organizationName,
  departments,
  canManageDepartments,
}: OrganizationSetupWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState<"organization" | "departments">(
    hasOrganization ? "departments" : "organization",
  );

  if (step === "departments") {
    return (
      <DepartmentSetupWizard
        organizationName={organizationName}
        departments={departments}
        canManageDepartments={canManageDepartments}
      />
    );
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5">
      <header className="rounded-[24px] border border-slate-200 bg-white px-6 py-6 shadow-[0_18px_48px_rgba(15,23,42,0.06)]">
        <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-slate-500">
          {organizationName}
        </div>
        <h1 className="mt-4 text-[1.7rem] font-semibold leading-tight tracking-[-0.04em] text-slate-950">
          Create organization
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Set up the county workspace to continue.
        </p>
      </header>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
        <OrganizationSetupForm
          defaultName={organizationName}
          onCreated={() => {
            setStep("departments");
            router.refresh();
          }}
        />

        <aside className="rounded-[22px] border border-slate-200 bg-white px-5 py-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Setup outcome
          </p>
          <div className="mt-4 space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#edf2ff] text-[#1868a6]">
                  <Building2 className="h-4 w-4" />
                </div>
                <p className="text-sm leading-6 text-slate-700">
                  Creates the county organization record.
                </p>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#edf2ff] text-[#1868a6]">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <p className="text-sm leading-6 text-slate-700">
                  Adds the central office and your first{" "}
                  <span className="font-medium text-slate-900">ORG_ADMIN</span>{" "}
                  membership.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
