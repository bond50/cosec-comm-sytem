import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell, CheckCheck, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/auth";
import { NotificationPreferencesForm } from "@/app/dashboard/notifications/notification-preferences-form";
import { markAllNotificationsRead } from "@/features/notifications/actions/mark-notification-read";
import { getNotificationPreferences } from "@/features/notifications/queries/notification-preferences";
import { getUserNotifications } from "@/features/notifications/queries/notifications";
import { requireOrganizationPermission } from "@/features/auth/utils/require-organization-permission";

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function getKindClassName(kind: "ACTION_REQUIRED" | "UPDATE" | "REMINDER") {
  if (kind === "ACTION_REQUIRED") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  if (kind === "REMINDER") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  return "border-slate-200 bg-slate-100 text-slate-700";
}

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams?: Promise<{ filter?: string }>;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  const access = await requireOrganizationPermission("dashboard.view");
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const unreadOnly = resolvedSearchParams?.filter === "unread";

  const [notifications, preferences] = await Promise.all([
    getUserNotifications(access.organization.id, access.userId),
    getNotificationPreferences(
      access.organization.id,
      access.userId,
      session.organization?.roles ?? null,
    ),
  ]);

  const groups = unreadOnly ? notifications.unreadGroups : notifications.groups;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="flex flex-col gap-4 px-6 py-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Notification workspace
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-950">
              Workflow notifications
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Notifications are organization-scoped and tied to accountable
              workflow changes, reminders, and updates.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={
                unreadOnly
                  ? "/dashboard/notifications"
                  : "/dashboard/notifications?filter=unread"
              }
              className={
                unreadOnly
                  ? "inline-flex h-10 items-center justify-center rounded-xl border border-[#1868a6] bg-[#e6f1f8] px-4 text-sm font-semibold text-[#1868a6] hover:no-underline"
                  : "inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:no-underline"
              }
            >
              {unreadOnly ? "Show all notifications" : "Show unread only"}
            </Link>

            {notifications.unreadCount > 0 ? (
              <form action={markAllNotificationsRead}>
                <button
                  type="submit"
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  <CheckCheck className="mr-2 h-4 w-4" />
                  Mark all read
                </button>
              </form>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Unread notifications",
            value: notifications.unreadCount,
            tone: "border-slate-200 bg-slate-50 text-slate-900",
          },
          {
            label: "Action required",
            value: notifications.unreadActionRequiredCount,
            tone: "border-amber-200 bg-amber-50 text-amber-900",
          },
          {
            label: "Reminders",
            value: notifications.unreadReminderCount,
            tone: "border-rose-200 bg-rose-50 text-rose-900",
          },
          {
            label: "Preference mode",
            value: preferences.emailEnabled ? "In-app + email" : "In-app only",
            tone: "border-emerald-200 bg-emerald-50 text-emerald-900",
          },
        ].map((item) => (
          <Card key={item.label} className="border-slate-200 shadow-sm">
            <CardContent className="px-6 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                {item.label}
              </p>
              <p
                className={`mt-3 rounded-xl border px-4 py-3 text-lg font-semibold ${item.tone}`}
              >
                {item.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="px-6 py-5">
          <CardTitle className="text-[1.05rem] text-slate-950">
            Notification preferences
          </CardTitle>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Choose whether this user receives in-app notifications, best-effort
            email, and reminder alerts for the active organization.
          </p>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <NotificationPreferencesForm initialValues={preferences} />
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="px-6 py-5">
          <CardTitle className="text-[1.05rem] text-slate-950">
            Notification feed
          </CardTitle>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Grouped by recency so central-office and department users can read
            the audit-driven workflow stream without losing context.
          </p>
        </CardHeader>
        <CardContent className="space-y-6 px-6 pb-6">
          {groups.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 px-6 py-10 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-100 text-slate-500">
                <Bell className="h-6 w-6" />
              </div>
              <p className="mt-4 text-sm font-semibold text-slate-900">
                {unreadOnly
                  ? "No unread notifications right now."
                  : "No notifications recorded yet."}
              </p>
            </div>
          ) : (
            groups.map((group) => (
              <section key={group.label} className="space-y-3">
                <div className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  {group.label}
                </div>
                <div className="space-y-3">
                  {group.items.map((notification) => (
                    <Link
                      key={notification.id}
                      href={notification.href || "/dashboard"}
                      className="block rounded-2xl border border-slate-200 px-4 py-4 transition hover:bg-slate-50 hover:no-underline"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-slate-900">
                              {notification.title}
                            </p>
                            <span
                              className={`rounded-full border px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.12em] ${getKindClassName(notification.kind)}`}
                            >
                              {notification.kind.replaceAll("_", " ")}
                            </span>
                            {!notification.readAt ? (
                              <span className="rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-orange-700">
                                Unread
                              </span>
                            ) : null}
                            {notification.auditLogId ? (
                              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-emerald-700">
                                Audit-linked
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-2 text-sm leading-6 text-slate-600">
                            {notification.message}
                          </p>
                          <p className="mt-3 text-xs text-slate-500">
                            Created {formatDateTime(notification.createdAt)}
                            {notification.emailedAt
                              ? ` · emailed ${formatDateTime(notification.emailedAt)}`
                              : ""}
                          </p>
                        </div>
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-[#1868a6]">
                          Open
                          <ExternalLink className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
