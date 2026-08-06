import { redirect } from "next/navigation";
import { DashboardShell } from "@/app/dashboard/dashboard-shell";
import { getActiveMembershipsByUserId } from "@/features/application/queries/memberships";
import { getWorkspaceSearchHistory } from "@/features/application/queries/workspace-search-history";
import { getPortalBranding } from "@/features/application/queries/settings";
import { getCurrentUser } from "@/features/auth/utils/current-user";
import { getUserNotifications } from "@/features/notifications/queries/notifications";
import { changePasswordRoute } from "@/routes";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [branding, user] = await Promise.all([
    getPortalBranding(),
    getCurrentUser(),
  ]);

  if (user?.mustChangePassword) {
    redirect(changePasswordRoute);
  }
  const activeOrganizations = user
    ? await getActiveMembershipsByUserId(user.id)
    : [];
  const [notifications, searchHistory] = await Promise.all([
    getUserNotifications(user?.organization?.id, user?.id),
    getWorkspaceSearchHistory(user?.organization?.id, user?.id),
  ]);

  return (
    <DashboardShell
      organizationName={user?.organization?.name ?? branding.organizationName}
      hasActiveOrganization={Boolean(user?.organization)}
      activeOrganizations={activeOrganizations.map((membership) => ({
        id: membership.organization.id,
        name: membership.organization.name,
        slug: membership.organization.slug,
        role: membership.role,
        roles: membership.roles,
        isCurrent: membership.organization.id === user?.organization?.id,
      }))}
      user={
        user
          ? {
              id: user.id,
              name: user.name,
              email: user.email,
              organizationRole: user.organization?.role ?? null,
              organizationRoles: user.organization?.roles ?? null,
            }
          : null
      }
      notifications={notifications}
      searchHistory={searchHistory}
    >
      {children}
    </DashboardShell>
  );
}
