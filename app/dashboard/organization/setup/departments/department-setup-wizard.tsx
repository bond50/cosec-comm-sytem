"use client";

import { useRouter } from "next/navigation";
import { Building2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateDepartmentForm } from "@/components/forms/create-department-form";
import type { DepartmentSummary } from "@/features/application/queries/departments";

type DepartmentSetupWizardProps = {
  organizationName: string;
  departments: DepartmentSummary[];
  canManageDepartments: boolean;
};

export function DepartmentSetupWizard({
  organizationName,
  departments,
  canManageDepartments,
}: DepartmentSetupWizardProps) {
  const router = useRouter();
  const centralOffice = departments.find(
    (department) => department.kind === "CENTRAL_OFFICE",
  );
  const executionDepartments = departments.filter(
    (department) => department.kind === "EXECUTION",
  );

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5">
      <header className="rounded-[24px] border border-slate-200 bg-white px-6 py-6 shadow-[0_18px_48px_rgba(15,23,42,0.06)]">
        <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-slate-500">
          {organizationName}
        </div>
        <h1 className="mt-4 text-[1.7rem] font-semibold leading-tight tracking-[-0.04em] text-slate-950">
          Add your departments
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Add at least one department so correspondence has somewhere to route.
          You can always add more later.
        </p>
      </header>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
        {canManageDepartments ? (
          <CreateDepartmentForm mode="panel" />
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-6 text-sm text-slate-600 shadow-sm">
            Your role cannot create departments. Continue to the dashboard — an
            administrator can add departments later.
          </div>
        )}

        <aside className="flex flex-col gap-4">
          <div className="rounded-[22px] border border-slate-200 bg-white px-5 py-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Progress
            </p>

            <div className="mt-4 space-y-3">
              {centralOffice ? (
                <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <p className="text-sm leading-6 text-emerald-800">
                    Central office created
                  </p>
                </div>
              ) : null}

              <div
                className={
                  executionDepartments.length
                    ? "flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3"
                    : "flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3"
                }
              >
                {executionDepartments.length ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                ) : (
                  <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                )}
                <p
                  className={
                    executionDepartments.length
                      ? "text-sm leading-6 text-emerald-800"
                      : "text-sm leading-6 text-slate-700"
                  }
                >
                  {executionDepartments.length
                    ? `${executionDepartments.length} department${executionDepartments.length === 1 ? "" : "s"} added`
                    : "Add at least one department"}
                </p>
              </div>
            </div>

            {executionDepartments.length ? (
              <ul className="mt-4 space-y-2">
                {executionDepartments.map((department) => (
                  <li
                    key={department.id}
                    className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm text-slate-700"
                  >
                    {department.name}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <Button
            size="lg"
            className="w-full"
            disabled={canManageDepartments && executionDepartments.length === 0}
            onClick={() => router.push("/dashboard")}
          >
            {canManageDepartments && executionDepartments.length === 0
              ? "Add a department to continue"
              : "Continue to dashboard"}
          </Button>
        </aside>
      </section>
    </div>
  );
}
