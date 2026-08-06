import { CorrespondenceRegisterForm } from "@/app/dashboard/correspondences/register/correspondence-register-form";
import { getDepartmentsByOrganization } from "@/features/application/queries/departments";
import { getSenderOfficeSuggestions } from "@/features/correspondence/queries/sender-offices";
import { requirePagePermission } from "@/features/auth/utils/require-organization-permission";

export default async function RegisterCorrespondencePage() {
  const access = await requirePagePermission("correspondence.register");
  const [senderOfficeSuggestions, departments] = await Promise.all([
    getSenderOfficeSuggestions(access.organization.id),
    getDepartmentsByOrganization(access.organization.id),
  ]);

  return (
    <CorrespondenceRegisterForm
      organizationName={access.organization.name}
      senderOfficeSuggestions={senderOfficeSuggestions.map(
        (office) => office.name,
      )}
      sourceDepartmentOptions={departments
        .filter(
          (department) =>
            department.status === "ACTIVE" && department.kind === "EXECUTION",
        )
        .map((department) => ({
          id: department.id,
          label: department.code
            ? `${department.name} (${department.code})`
            : department.name,
        }))}
    />
  );
}
