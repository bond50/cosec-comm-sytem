import "server-only";

import { Prisma } from "@prisma/client";
import {
  getNotificationDelegate,
  getNotificationRuntimeSupport,
} from "@/lib/db";

const notificationSelect = {
  id: true,
  title: true,
  message: true,
  type: true,
  entityType: true,
  entityId: true,
  href: true,
  readAt: true,
  createdAt: true,
} satisfies Prisma.NotificationSelect;

export type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type: string;
  kind: "ACTION_REQUIRED" | "UPDATE" | "REMINDER";
  entityType: string | null;
  entityId: string | null;
  href: string | null;
  auditLogId: string | null;
  readAt: Date | null;
  emailedAt: Date | null;
  createdAt: Date;
};

export type NotificationGroup = {
  label: "Today" | "Yesterday" | "Older";
  items: NotificationItem[];
};

function getGroupLabel(value: Date): NotificationGroup["label"] {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - 1,
  );

  if (value >= todayStart) return "Today";
  if (value >= yesterdayStart) return "Yesterday";
  return "Older";
}

function normalizeNotificationItem(
  item: Prisma.NotificationGetPayload<{
    select: typeof notificationSelect;
  }> &
    Partial<{
      kind: NotificationItem["kind"];
      auditLogId: string | null;
      emailedAt: Date | null;
    }>,
): NotificationItem {
  return {
    id: item.id,
    title: item.title,
    message: item.message,
    type: item.type,
    kind: item.kind ?? "UPDATE",
    entityType: item.entityType ?? null,
    entityId: item.entityId ?? null,
    href: item.href ?? null,
    auditLogId: item.auditLogId ?? null,
    readAt: item.readAt ?? null,
    emailedAt: item.emailedAt ?? null,
    createdAt: item.createdAt,
  };
}

function groupNotifications(items: NotificationItem[]): NotificationGroup[] {
  const groups = new Map<NotificationGroup["label"], NotificationItem[]>([
    ["Today", []],
    ["Yesterday", []],
    ["Older", []],
  ]);

  for (const item of items) {
    const label = getGroupLabel(item.createdAt);
    groups.get(label)?.push(item);
  }

  return (["Today", "Yesterday", "Older"] as const)
    .map((label) => ({
      label,
      items: groups.get(label) ?? [],
    }))
    .filter((group) => group.items.length > 0);
}

export async function getUserNotifications(
  organizationId: string | null | undefined,
  userId: string | null | undefined,
) {
  if (!organizationId || !userId) {
    return {
      unreadCount: 0,
      unreadActionRequiredCount: 0,
      unreadReminderCount: 0,
      items: [] as NotificationItem[],
      unreadItems: [] as NotificationItem[],
      groups: [] as NotificationGroup[],
      unreadGroups: [] as NotificationGroup[],
    };
  }

  const notification = getNotificationDelegate();

  if (!notification) {
    return {
      unreadCount: 0,
      unreadActionRequiredCount: 0,
      unreadReminderCount: 0,
      items: [] as NotificationItem[],
      unreadItems: [] as NotificationItem[],
      groups: [] as NotificationGroup[],
      unreadGroups: [] as NotificationGroup[],
    };
  }

  const runtimeSupport = getNotificationRuntimeSupport();

  const [unreadCount, unreadActionRequiredCount, unreadReminderCount, items] =
    await Promise.all([
      notification.count({
        where: {
          organizationId,
          userId,
          readAt: null,
        },
      }),
      runtimeSupport.hasKind
        ? notification.count({
            where: {
              organizationId,
              userId,
              readAt: null,
              kind: "ACTION_REQUIRED",
            } as Prisma.NotificationWhereInput,
          })
        : Promise.resolve(0),
      runtimeSupport.hasKind
        ? notification.count({
            where: {
              organizationId,
              userId,
              readAt: null,
              kind: "REMINDER",
            } as Prisma.NotificationWhereInput,
          })
        : Promise.resolve(0),
      notification.findMany({
        where: {
          organizationId,
          userId,
        },
        orderBy: [{ createdAt: "desc" }],
        take: 30,
        select: {
          ...notificationSelect,
          ...(runtimeSupport.hasKind ? { kind: true } : {}),
          ...(runtimeSupport.hasAuditLogId ? { auditLogId: true } : {}),
          ...(runtimeSupport.hasEmailedAt ? { emailedAt: true } : {}),
        } as Prisma.NotificationSelect,
      }),
    ]);

  const normalizedItems = items.map((item) => normalizeNotificationItem(item));
  const unreadItems = normalizedItems.filter((item) => item.readAt === null);

  return {
    unreadCount,
    unreadActionRequiredCount,
    unreadReminderCount,
    items: normalizedItems,
    unreadItems,
    groups: groupNotifications(normalizedItems),
    unreadGroups: groupNotifications(unreadItems),
  };
}
