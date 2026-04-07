import { Building2, GitBranch, ShieldCheck } from "lucide-react";
import { DepartmentsDirectoryTable } from "@/app/dashboard/departments/departments-directory-table";
import { CreateDepartmentForm } from "@/components/forms/create-department-form";
import { Card, CardContent } from "@/components/ui/card";
import { getDepartmentsByOrganization } from "@/features/application/queries/departments";
import { requirePagePermission } from "@/features/auth/utils/require-organization-permission";
import { hasFoundationPermission } from "@/features/auth/utils/role-access";

export default async function DepartmentsPage() {
  const access = await requirePagePermission("departments.view");
  const departments = await getDepartmentsByOrganization(
    access.organization.id,
  );
  const canManageDepartments = hasFoundationPermission(
    access.organizationRole,
    "departments.manage",
  );

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-5">
      <div className="space-y-1">
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-slate-400">
          Departments
        </p>
        <h1 className="text-[1.85rem] font-semibold tracking-[-0.04em] text-slate-950">
          Department workspace
        </h1>
        <p className="text-sm leading-6 text-slate-600">
          Review the active organization structure and maintain routing units.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardContent className="flex items-start justify-between px-5 py-4">
            <div>
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Total departments
              </p>
              <p className="mt-2 text-[1.7rem] font-semibold tracking-[-0.04em] text-slate-950">
                {departments.length}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Routing units in the active organization
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eef2ff] text-[#465fff]">
              <Building2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardContent className="flex items-start justify-between px-5 py-4">
            <div>
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Routing readiness
              </p>
              <p className="mt-2 text-base font-semibold text-slate-950">
                {departments.length > 0 ? "Structured" : "Needs setup"}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {departments.length > 0
                  ? "Departments exist and can receive assignments."
                  : "Create the first department to route work."}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eef2ff] text-[#465fff]">
              <GitBranch className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardContent className="flex items-start justify-between px-5 py-4">
            <div>
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Access level
              </p>
              <p className="mt-2 text-base font-semibold text-slate-950">
                {canManageDepartments ? "Manage" : "View only"}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {canManageDepartments
                  ? "This role can create and update departments."
                  : "This role can review department structure only."}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eef2ff] text-[#465fff]">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </section>

      <div
        className={
          canManageDepartments
            ? "grid gap-5 2xl:grid-cols-[minmax(0,1fr)_360px]"
            : "grid gap-6"
        }
      >
        <section>
          {departments.length ? (
            <DepartmentsDirectoryTable
              departments={departments}
              canManageDepartments={canManageDepartments}
            />
          ) : (
            <Card className="rounded-2xl border-slate-200 shadow-sm">
              <CardContent className="px-6 py-6 text-sm leading-6 text-slate-600">
                No departments have been created for this organization yet.
              </CardContent>
            </Card>
          )}
        </section>

        {canManageDepartments ? <CreateDepartmentForm /> : null}
      </div>
    </div>
  );
}
