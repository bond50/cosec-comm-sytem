"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, X } from "lucide-react";
import type { UserRole } from "@prisma/client";
import { getDashboardNavigation } from "@/app/dashboard/dashboard-navigation";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

type DashboardSidebarProps = {
  organizationName: string;
  hasActiveOrganization: boolean;
  organizationRole: UserRole | null;
  mobileOpen: boolean;
  onClose: () => void;
};

export function DashboardSidebar({
  organizationName,
  hasActiveOrganization,
  organizationRole,
  mobileOpen,
  onClose,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const navigation = getDashboardNavigation(
    hasActiveOrganization,
    organizationRole,
  );

  return (
    <>
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-slate-950/30 lg:hidden"
          onClick={onClose}
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[280px] shrink-0 flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-[78px] items-center gap-3 border-b border-slate-200 px-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#465fff] text-white shadow-[0_12px_24px_rgba(70,95,255,0.24)]">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-400">
              COSEC
            </p>
            <p className="truncate text-base font-semibold tracking-[-0.03em] text-slate-950">
              County Admin
            </p>
          </div>
          <button
            type="button"
            aria-label="Close navigation"
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 lg:hidden"
            onClick={onClose}
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5">
          <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-400">
              {hasActiveOrganization ? "Active organization" : "Setup required"}
            </p>
            <p className="mt-2 text-sm font-medium leading-6 text-slate-900">
              {organizationName}
            </p>
          </div>

          <nav className="space-y-4">
            {navigation.map((section) => (
              <Accordion
                key={section.label}
                type="single"
                collapsible
                defaultValue={section.defaultOpen ? section.label : undefined}
                className="px-0"
              >
                <AccordionItem value={section.label} className="border-b-0">
                  <AccordionTrigger className="px-2 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-slate-400 hover:no-underline">
                    {section.label}
                  </AccordionTrigger>
                  <AccordionContent className="pb-3">
                    <div className="space-y-1.5">
                      {section.items.map((item) => {
                        const active = item.match(pathname);
                        const Icon = item.icon;

                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                              "group flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition",
                              active
                                ? "bg-[#eef2ff] text-[#3641f5]"
                                : "text-slate-700 hover:bg-slate-50 hover:text-slate-950",
                            )}
                            onClick={onClose}
                          >
                            <span className="flex min-w-0 items-center gap-3">
                              <Icon
                                className={cn(
                                  "h-4.5 w-4.5 shrink-0",
                                  active
                                    ? "text-[#465fff]"
                                    : "text-slate-400 transition group-hover:text-slate-700",
                                )}
                              />
                              <span className="truncate">{item.label}</span>
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
}
