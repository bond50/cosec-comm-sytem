import { ReportsOverview } from "@/app/dashboard/reports/reports-overview";
import { requirePagePermission } from "@/features/auth/utils/require-organization-permission";
import { getCorrespondenceDashboardMetrics } from "@/features/correspondence/queries/correspondence-dashboard";

export default async function ReportsPage() {
  const access = await requirePagePermission("reports.view");

  const correspondenceMetrics = await getCorrespondenceDashboardMetrics(
    access.organization.id,
  );

  return <ReportsOverview correspondenceMetrics={correspondenceMetrics} />;
}
