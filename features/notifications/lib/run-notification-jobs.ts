import "server-only";

import { db } from "@/lib/db";
import { ensureUserNotificationReminders } from "@/features/notifications/lib/notification-reminders";

export type NotificationJobRunResult = {
  organizationsProcessed: number;
  membershipsProcessed: number;
  reminderPassesCompleted: number;
};

export async function runNotificationReminderJob() {
  const memberships = await db.organizationMembership.findMany({
    where: {
      status: "ACTIVE",
    },
    select: {
      organizationId: true,
      userId: true,
    },
    orderBy: [{ organizationId: "asc" }, { createdAt: "asc" }],
  });

  let reminderPassesCompleted = 0;

  for (const membership of memberships) {
    await db.$transaction(async (tx) => {
      await ensureUserNotificationReminders({
        tx,
        organizationId: membership.organizationId,
        userId: membership.userId,
      });
    });

    reminderPassesCompleted += 1;
  }

  const organizationsProcessed = new Set(
    memberships.map((membership) => membership.organizationId),
  ).size;

  return {
    organizationsProcessed,
    membershipsProcessed: memberships.length,
    reminderPassesCompleted,
  } satisfies NotificationJobRunResult;
}
