import { DashboardShell } from "@/app/dashboard/dashboard-shell";
import { getPortalBranding } from "@/features/application/queries/settings";
import { getCurrentUser } from "@/features/auth/utils/current-user";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [branding, user] = await Promise.all([
    getPortalBranding(),
    getCurrentUser(),
  ]);

  return (
    <DashboardShell
      organizationName={user?.organization?.name ?? branding.organizationName}
      hasActiveOrganization={Boolean(user?.organization)}
      user={
        user
          ? {
              name: user.name,
              email: user.email,
              organizationRole: user.organization?.role ?? null,
            }
          : null
      }
    >
      {children}
    </DashboardShell>
  );
}
