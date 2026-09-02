import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { DashboardOverview } from "@/app/dashboard/dashboard-overview";
import { DashboardSearchResults } from "@/app/dashboard/dashboard-search-results";
import { getWorkspaceSearchHistory } from "@/features/application/queries/workspace-search-history";
import { getWorkspaceSearchResults } from "@/features/application/queries/workspace-search";
import {
  MissingOrganizationError,
  UnauthorizedError,
} from "@/features/auth/utils/auth-errors";
import { requireCurrentOrganization } from "@/features/auth/utils/current-organization";
import { getCurrentUser } from "@/features/auth/utils/current-user";
import { resolveOrganizationEntry } from "@/features/auth/utils/organization-entry";
import { hasOrgWideCorrespondenceVisibility } from "@/features/auth/utils/role-access";
import { getActiveMembershipByUserId } from "@/features/application/queries/memberships";
import { getCorrespondenceDashboardMetrics } from "@/features/correspondence/queries/correspondence-dashboard";
import { getUserNotifications } from "@/features/notifications/queries/notifications";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; scope?: string }>;
}) {
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

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const workspaceQuery = resolvedSearchParams?.q?.trim() ?? "";
  const workspaceScope = resolvedSearchParams?.scope?.trim() ?? "all";

  const user = await getCurrentUser();
  const orgWide = hasOrgWideCorrespondenceVisibility(
    user?.organization?.roles ?? null,
  );
  const membership = orgWide
    ? null
    : await getActiveMembershipByUserId(session.user.id, organizationId);

  const correspondenceMetrics = await getCorrespondenceDashboardMetrics(
    organizationId,
    user
      ? {
          userId: user.id,
          departmentId: membership?.departmentId ?? null,
          orgWide,
          roles: user.organization?.roles ?? null,
        }
      : undefined,
  );

  if (workspaceQuery.length > 0) {
    const [results, searchHistory] = await Promise.all([
      getWorkspaceSearchResults({
        organizationId,
        query: workspaceQuery,
        roles: user?.organization?.roles ?? null,
        userId: user?.id ?? null,
      }),
      getWorkspaceSearchHistory(organizationId, user?.id ?? null),
    ]);

    const isSaved = searchHistory.saved.some(
      (item: (typeof searchHistory.saved)[number]) =>
        item.normalizedQuery === results.normalizedQuery,
    );

    return (
      <DashboardSearchResults
        query={workspaceQuery}
        results={results}
        isSaved={isSaved}
        searchHistory={searchHistory}
        scope={workspaceScope}
      />
    );
  }

  const notifications = await getUserNotifications(
    organizationId,
    user?.id ?? null,
  );

  return (
    <DashboardOverview
      organizationName={organizationName}
      organizationRoles={user?.organization?.roles ?? null}
      correspondenceMetrics={correspondenceMetrics}
      notificationSummary={{
        unreadCount: notifications.unreadCount,
        unreadActionRequiredCount: notifications.unreadActionRequiredCount,
        unreadReminderCount: notifications.unreadReminderCount,
      }}
    />
  );
}
