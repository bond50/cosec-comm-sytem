"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import type { UserRole } from "@prisma/client";
import {
  getDashboardNavigation,
  type DashboardNavItem,
} from "@/app/dashboard/dashboard-navigation";
import {
  DEFAULT_ORGANIZATION_LOGO_PATH,
  DEFAULT_ORGANIZATION_SYSTEM_NAME,
  DEFAULT_ORGANIZATION_UNIT,
} from "@/features/application/lib/portal-branding";
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
  organizationRoles: UserRole[] | null;
  mobileOpen: boolean;
  onClose: () => void;
};

export function DashboardSidebar({
  organizationName,
  hasActiveOrganization,
  organizationRoles,
  mobileOpen,
  onClose,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const navigation = getDashboardNavigation(
    hasActiveOrganization,
    organizationRoles,
  );

  function isItemActive(item: DashboardNavItem): boolean {
    if (item.items?.length) {
      return item.items.some((child) => isItemActive(child));
    }

    return item.match?.(pathname) ?? false;
  }

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
          "fixed inset-y-0 left-0 z-50 flex w-[280px] shrink-0 flex-col border-r border-black/10 bg-[var(--brand-sidebar)] transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="relative flex flex-col items-center gap-2 border-b border-white/15 px-6 py-5 text-center">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white lg:hidden"
            onClick={onClose}
          >
            <X className="h-4.5 w-4.5" />
          </button>
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white p-1.5 shadow-sm">
            <Image
              src={DEFAULT_ORGANIZATION_LOGO_PATH}
              alt={`${organizationName} logo`}
              width={84}
              height={84}
              className="h-full w-full object-contain"
            />
          </div>
          <p className="truncate text-sm font-bold leading-tight text-white">
            {hasActiveOrganization ? organizationName : "Setup required"}
          </p>
          <p className="text-[0.65rem] font-semibold uppercase leading-tight tracking-[0.08em] text-amber-300">
            {DEFAULT_ORGANIZATION_UNIT}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5">
          <div className="mb-6 rounded-xl border border-white/20 px-4 py-3">
            <p className="text-sm font-semibold leading-5 text-white">
              {DEFAULT_ORGANIZATION_SYSTEM_NAME}
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
                  <AccordionTrigger className="px-2 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-white/70 hover:no-underline [&>svg]:text-white/60">
                    {section.label}
                  </AccordionTrigger>
                  <AccordionContent className="pb-3">
                    <div className="space-y-1.5">
                      {section.items.map((item) => {
                        const Icon = item.icon;
                        const active = isItemActive(item);

                        if (item.items?.length) {
                          return (
                            <Accordion
                              key={item.label}
                              type="single"
                              collapsible
                              defaultValue={
                                item.defaultOpen || active
                                  ? item.label
                                  : undefined
                              }
                              className="rounded-2xl bg-white/10 px-2 py-1"
                            >
                              <AccordionItem
                                value={item.label}
                                className="border-b-0"
                              >
                                <AccordionTrigger
                                  className={cn(
                                    "rounded-xl px-3 py-3 text-sm font-medium hover:bg-white/10 hover:no-underline [&>svg]:text-white/60",
                                    active
                                      ? "text-white font-semibold"
                                      : "text-white/85",
                                  )}
                                >
                                  <span className="flex min-w-0 items-center gap-3">
                                    <Icon
                                      className={cn(
                                        "h-4.5 w-4.5 shrink-0",
                                        active ? "text-white" : "text-white/60",
                                      )}
                                    />
                                    <span className="truncate">
                                      {item.label}
                                    </span>
                                  </span>
                                </AccordionTrigger>
                                <AccordionContent className="pb-2">
                                  <div className="space-y-1 pl-6">
                                    {item.items.map((child) => {
                                      const childActive = isItemActive(child);
                                      const ChildIcon = child.icon;

                                      return child.href ? (
                                        <Link
                                          key={child.href}
                                          href={child.href}
                                          className={cn(
                                            "group flex items-center rounded-xl px-3 py-2.5 text-sm font-medium no-underline transition hover:no-underline",
                                            childActive
                                              ? "bg-white text-[#0f4c79] shadow-sm"
                                              : "text-white/85 hover:bg-white/10 hover:text-white",
                                          )}
                                          onClick={onClose}
                                        >
                                          <span className="flex min-w-0 items-center gap-3">
                                            <ChildIcon
                                              className={cn(
                                                "h-4 w-4 shrink-0",
                                                childActive
                                                  ? "text-[#1868a6]"
                                                  : "text-white/60 transition group-hover:text-white/90",
                                              )}
                                            />
                                            <span className="truncate">
                                              {child.label}
                                            </span>
                                          </span>
                                        </Link>
                                      ) : null;
                                    })}
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            </Accordion>
                          );
                        }

                        if (!item.href) return null;

                        const linkClassName = cn(
                          "group flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium no-underline transition hover:no-underline",
                          active
                            ? "bg-white text-[#0f4c79] shadow-sm"
                            : "text-white/85 hover:bg-white/10 hover:text-white",
                        );
                        const linkContent = (
                          <span className="flex min-w-0 items-center gap-3">
                            <Icon
                              className={cn(
                                "h-4.5 w-4.5 shrink-0",
                                active
                                  ? "text-[#1868a6]"
                                  : "text-white/60 transition group-hover:text-white/90",
                              )}
                            />
                            <span className="truncate">{item.label}</span>
                          </span>
                        );

                        return item.external ? (
                          <a
                            key={item.href}
                            href={item.href}
                            target="_blank"
                            rel="noreferrer"
                            className={linkClassName}
                          >
                            {linkContent}
                          </a>
                        ) : (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={linkClassName}
                            onClick={onClose}
                          >
                            {linkContent}
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
