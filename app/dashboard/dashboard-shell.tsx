"use client";

import { useState } from "react";
import { DashboardHeader } from "@/app/dashboard/dashboard-header";
import { DashboardSidebar } from "@/app/dashboard/dashboard-sidebar";

type DashboardShellProps = {
  organizationName: string;
  hasActiveOrganization: boolean;
  user: {
    name: string | null;
    email: string | null;
    organizationRole: import("@prisma/client").UserRole | null;
  } | null;
  children: React.ReactNode;
};

export function DashboardShell({
  organizationName,
  hasActiveOrganization,
  user,
  children,
}: DashboardShellProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="flex min-h-screen">
        <DashboardSidebar
          organizationName={organizationName}
          hasActiveOrganization={hasActiveOrganization}
          organizationRole={user?.organizationRole ?? null}
          mobileOpen={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <DashboardHeader
            organizationName={organizationName}
            hasActiveOrganization={hasActiveOrganization}
            user={user}
            onOpenNavigation={() => setMobileSidebarOpen(true)}
          />

          <main className="flex-1 px-4 py-5 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-[1400px]">{children}</div>
          </main>

          <footer className="border-t border-slate-200 bg-white px-4 py-4 text-sm text-slate-500 sm:px-6 lg:px-8">
            <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="font-medium text-slate-600">
                COSEC Communication System
              </p>
              <p>
                County correspondence workspace for communication movement and
                accountability.
              </p>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
