"use client";

import { useState } from "react";
import { DashboardHeader } from "@/app/dashboard/dashboard-header";
import { DashboardSidebar } from "@/app/dashboard/dashboard-sidebar";
import type {
  NotificationGroup,
  NotificationItem,
} from "@/features/notifications/queries/notifications";

type DashboardShellProps = {
  organizationName: string;
  hasActiveOrganization: boolean;
  activeOrganizations: {
    id: string;
    name: string;
    slug: string;
    role: import("@prisma/client").UserRole;
    roles: import("@prisma/client").UserRole[];
    isCurrent: boolean;
  }[];
  user: {
    id: string;
    name: string | null;
    email: string | null;
    organizationRole: import("@prisma/client").UserRole | null;
    organizationRoles: import("@prisma/client").UserRole[] | null;
  } | null;
  notifications: {
    unreadCount: number;
    unreadActionRequiredCount: number;
    unreadReminderCount: number;
    items: NotificationItem[];
    unreadItems: NotificationItem[];
    groups: NotificationGroup[];
    unreadGroups: NotificationGroup[];
  };
  searchHistory: {
    saved: {
      id: string;
      query: string;
      normalizedQuery: string;
      isSaved: boolean;
      searchCount: number;
      lastSearchedAt: Date;
    }[];
    recent: {
      id: string;
      query: string;
      normalizedQuery: string;
      isSaved: boolean;
      searchCount: number;
      lastSearchedAt: Date;
    }[];
    frequent: {
      id: string;
      query: string;
      normalizedQuery: string;
      isSaved: boolean;
      searchCount: number;
      lastSearchedAt: Date;
    }[];
    stats: {
      savedCount: number;
      recentCount: number;
      frequentCount: number;
    };
  };
  children: React.ReactNode;
};

export function DashboardShell({
  organizationName,
  hasActiveOrganization,
  activeOrganizations,
  user,
  notifications,
  searchHistory,
  children,
}: DashboardShellProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--background)] text-slate-900 print:bg-white">
      <div className="flex min-h-screen print:block">
        <div className="print:hidden">
          <DashboardSidebar
            organizationName={organizationName}
            hasActiveOrganization={hasActiveOrganization}
            organizationRoles={user?.organizationRoles ?? null}
            mobileOpen={mobileSidebarOpen}
            onClose={() => setMobileSidebarOpen(false)}
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="print:hidden">
            <DashboardHeader
              organizationName={organizationName}
              hasActiveOrganization={hasActiveOrganization}
              activeOrganizations={activeOrganizations}
              user={user}
              notifications={notifications}
              searchHistory={searchHistory}
              onOpenNavigation={() => setMobileSidebarOpen(true)}
            />
          </div>

          <main className="flex-1 px-4 py-5 sm:px-6 lg:px-8 print:p-0">
            <div className="mx-auto w-full max-w-[1400px] print:max-w-none">
              {children}
            </div>
          </main>

          <footer className="border-t border-slate-200 bg-white px-4 py-4 text-sm text-slate-500 sm:px-6 lg:px-8 print:hidden">
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
