"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireOrganizationPermission } from "@/features/auth/utils/require-organization-permission";

function getNotificationDelegate() {
  return (
    db as typeof db & {
      notification?: typeof db.notification;
    }
  ).notification;
}

export async function markNotificationRead(notificationId: string) {
  if (!notificationId) return;

  const access = await requireOrganizationPermission("dashboard.view");
  const notification = getNotificationDelegate();
  if (!notification) return;

  await notification.updateMany({
    where: {
      id: notificationId,
      organizationId: access.organization.id,
      userId: access.userId,
      readAt: null,
    },
    data: {
      readAt: new Date(),
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/notifications");
}

export async function markAllNotificationsRead() {
  const access = await requireOrganizationPermission("dashboard.view");
  const notification = getNotificationDelegate();
  if (!notification) return;

  await notification.updateMany({
    where: {
      organizationId: access.organization.id,
      userId: access.userId,
      readAt: null,
    },
    data: {
      readAt: new Date(),
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/notifications");
}
