import { DepartmentsWorkspace } from "@/app/dashboard/departments/departments-workspace";
import { getDepartmentsByOrganization } from "@/features/application/queries/departments";
import { requirePagePermission } from "@/features/auth/utils/require-organization-permission";
import { hasFoundationPermission } from "@/features/auth/utils/role-access";

type DepartmentsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DepartmentsPage({
  searchParams,
}: DepartmentsPageProps) {
  const access = await requirePagePermission("departments.view");
  const params = (await searchParams) ?? {};
  const departments = await getDepartmentsByOrganization(
    access.organization.id,
  );
  const canManageDepartments = hasFoundationPermission(
    access.organizationRoles,
    "departments.manage",
  );
  const createParam = params.create;
  const initialCreateOpen =
    createParam === "1" ||
    createParam === "true" ||
    (Array.isArray(createParam) &&
      createParam.some((value) => value === "1" || value === "true"));

  return (
    <DepartmentsWorkspace
      departments={departments}
      canManageDepartments={canManageDepartments}
      initialCreateOpen={initialCreateOpen}
    />
  );
}
