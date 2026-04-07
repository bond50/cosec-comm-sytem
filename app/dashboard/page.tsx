import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { DashboardOverview } from "@/app/dashboard/dashboard-overview";
import { getDepartmentsByOrganization } from "@/features/application/queries/departments";
import { getMembershipsByOrganization } from "@/features/application/queries/memberships";
import {
  MissingOrganizationError,
  UnauthorizedError,
} from "@/features/auth/utils/auth-errors";
import { requireCurrentOrganization } from "@/features/auth/utils/current-organization";
import { getCurrentUser } from "@/features/auth/utils/current-user";
import { resolveOrganizationEntry } from "@/features/auth/utils/organization-entry";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  const organizationEntry = await resolveOrganizationEntry(session.user.id);
  if (organizationEntry === "NO_ORG") {
    redirect("/dashboard/organization/setup");
  }

  let organizationId: string;
  let organizationName: string;

  try {
    const organization = await requireCurrentOrganization();
    organizationId = organization.id;
    organizationName = organization.name;
  } catch (error) {
    if (error instanceof MissingOrganizationError) {
      redirect("/dashboard/organization/setup");
    }

    if (error instanceof UnauthorizedError) {
      redirect("/auth/login");
    }

    throw error;
  }

  const [memberships, departments, user] = await Promise.all([
    getMembershipsByOrganization(organizationId),
    getDepartmentsByOrganization(organizationId),
    getCurrentUser(),
  ]);

  return (
    <DashboardOverview
      organizationName={organizationName}
      memberships={memberships}
      departments={departments}
      organizationRole={user?.organization?.role ?? null}
    />
  );
}
