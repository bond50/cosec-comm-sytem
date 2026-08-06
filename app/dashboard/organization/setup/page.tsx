import { redirect } from "next/navigation";
import { OrganizationSetupWizard } from "@/app/dashboard/organization/setup/organization-setup-wizard";
import { getDepartmentsByOrganization } from "@/features/application/queries/departments";
import { getPortalBranding } from "@/features/application/queries/settings";
import { getCurrentUser } from "@/features/auth/utils/current-user";
import { hasFoundationPermission } from "@/features/auth/utils/role-access";

export default async function OrganizationSetupPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  if (!user.organization) {
    const branding = await getPortalBranding();

    return (
      <OrganizationSetupWizard
        hasOrganization={false}
        organizationName={branding.organizationName}
        departments={[]}
        canManageDepartments
      />
    );
  }

  const canManageDepartments = hasFoundationPermission(
    user.organization.roles,
    "departments.manage",
  );

  if (!canManageDepartments) {
    redirect("/dashboard");
  }

  const departments = await getDepartmentsByOrganization(user.organization.id);

  return (
    <OrganizationSetupWizard
      hasOrganization
      organizationName={user.organization.name}
      departments={departments}
      canManageDepartments={canManageDepartments}
    />
  );
}
