"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, Clock3, ExternalLink } from "lucide-react";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/features/notifications/actions/mark-notification-read";
import type {
  NotificationGroup,
  NotificationItem,
} from "@/features/notifications/queries/notifications";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type DashboardNotificationsMenuProps = {
  notifications: {
    unreadCount: number;
    unreadActionRequiredCount: number;
    unreadReminderCount: number;
    items: NotificationItem[];
    unreadItems: NotificationItem[];
    groups: NotificationGroup[];
    unreadGroups: NotificationGroup[];
  };
};

function getKindLabel(item: NotificationItem) {
  if (item.kind === "ACTION_REQUIRED") return "Action";
  if (item.kind === "REMINDER") return "Reminder";
  return "Update";
}

function getKindClassName(item: NotificationItem) {
  if (item.kind === "ACTION_REQUIRED") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  if (item.kind === "REMINDER") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  return "border-slate-200 bg-slate-100 text-slate-700";
}

function getVisibleGroups(
  unreadOnly: boolean,
  groups: NotificationGroup[],
  unreadGroups: NotificationGroup[],
) {
  return unreadOnly ? unreadGroups : groups;
}

export function DashboardNotificationsMenu({
  notifications,
}: DashboardNotificationsMenuProps) {
  const router = useRouter();
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [isPending, startTransition] = useTransition();

  const visibleGroups = useMemo(
    () =>
      getVisibleGroups(
        unreadOnly,
        notifications.groups,
        notifications.unreadGroups,
      ),
    [notifications.groups, notifications.unreadGroups, unreadOnly],
  );

  function handleNotificationClick(notification: NotificationItem) {
    const targetHref = notification.href || "/dashboard/notifications";

    startTransition(() => {
      void markNotificationRead(notification.id);
    });
    router.push(targetHref);
  }

  function handleMarkAllNotificationsRead() {
    startTransition(async () => {
      await markAllNotificationsRead();
      router.refresh();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-transparent text-white transition hover:bg-white/10"
          aria-label="Notifications"
        >
          <Bell className="h-4.5 w-4.5" />
          {notifications.unreadCount > 0 ? (
            <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-orange-500 px-1.5 py-0.5 text-[0.65rem] font-semibold text-white">
              {notifications.unreadCount > 9 ? "9+" : notifications.unreadCount}
            </span>
          ) : null}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[400px]">
        <DropdownMenuLabel className="space-y-3 px-3 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-950">
                Notifications
              </div>
              <div className="mt-1 text-xs text-slate-500">
                Accountability changes, reminders, and workflow updates.
              </div>
            </div>
            {notifications.unreadCount > 0 ? (
              <button
                type="button"
                className="text-xs font-medium text-[#1868a6]"
                onClick={handleMarkAllNotificationsRead}
              >
                Mark all read
              </button>
            ) : null}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <div className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Unread
              </div>
              <div className="mt-1 text-sm font-semibold text-slate-950">
                {notifications.unreadCount}
              </div>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
              <div className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-amber-700">
                Action
              </div>
              <div className="mt-1 text-sm font-semibold text-amber-900">
                {notifications.unreadActionRequiredCount}
              </div>
            </div>
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2">
              <div className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-rose-700">
                Reminders
              </div>
              <div className="mt-1 text-sm font-semibold text-rose-900">
                {notifications.unreadReminderCount}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              className={
                unreadOnly
                  ? "inline-flex items-center gap-2 rounded-full border border-[#1868a6] bg-[#e6f1f8] px-3 py-1 text-[0.72rem] font-semibold text-[#1868a6]"
                  : "inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[0.72rem] font-medium text-slate-600"
              }
              onClick={() => setUnreadOnly((value) => !value)}
            >
              <Clock3 className="h-3.5 w-3.5" />
              {unreadOnly ? "Showing unread only" : "Show unread only"}
            </button>

            <Link
              href="/dashboard/notifications"
              className="inline-flex items-center gap-1 text-xs font-medium text-[#1868a6] hover:no-underline"
            >
              View all
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {visibleGroups.length === 0 ? (
          <DropdownMenuLabel className="px-3 py-5 text-sm font-normal text-slate-500">
            {unreadOnly
              ? "No unread notifications right now."
              : "No notifications yet."}
          </DropdownMenuLabel>
        ) : (
          visibleGroups.map((group, groupIndex) => (
            <div key={group.label}>
              {groupIndex > 0 ? <DropdownMenuSeparator /> : null}
              <DropdownMenuLabel className="px-3 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-slate-400">
                {group.label}
              </DropdownMenuLabel>
              {group.items.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className="block rounded-xl px-3 py-3 text-left"
                  onSelect={() => handleNotificationClick(notification)}
                  disabled={isPending}
                >
                  <div className="flex items-start gap-3">
                    {!notification.readAt ? (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-orange-500" />
                    ) : (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-slate-200" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {notification.title}
                        </p>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[0.68rem] font-semibold uppercase tracking-[0.12em] ${getKindClassName(notification)}`}
                        >
                          {getKindLabel(notification)}
                        </span>
                        {notification.auditLogId ? (
                          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-emerald-700">
                            Audit-linked
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                        {notification.message}
                      </p>
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
          ))
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link
            href="/dashboard/notifications"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:no-underline"
          >
            <CheckCheck className="h-4 w-4" />
            Open notification workspace
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
