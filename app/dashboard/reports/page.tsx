import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ReportsOverview } from "@/app/dashboard/reports/reports-overview";
import {
  MissingOrganizationError,
  UnauthorizedError,
} from "@/features/auth/utils/auth-errors";
import { requireCurrentOrganization } from "@/features/auth/utils/current-organization";
import { resolveOrganizationEntry } from "@/features/auth/utils/organization-entry";
import { getCorrespondenceDashboardMetrics } from "@/features/correspondence/queries/correspondence-dashboard";

export default async function ReportsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  const organizationEntry = await resolveOrganizationEntry(session.user.id);
  if (organizationEntry === "NO_ORG") {
    redirect("/dashboard/organization/setup");
  }

  let organizationId: string;

  try {
    const organization = await requireCurrentOrganization();
    organizationId = organization.id;
  } catch (error) {
    if (error instanceof MissingOrganizationError) {
      redirect("/dashboard/organization/setup");
    }

    if (error instanceof UnauthorizedError) {
      redirect("/auth/login");
    }

    throw error;
  }

  const correspondenceMetrics =
    await getCorrespondenceDashboardMetrics(organizationId);

  return <ReportsOverview correspondenceMetrics={correspondenceMetrics} />;
}
