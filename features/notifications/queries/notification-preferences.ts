import "server-only";

import {
  getNotificationPreferenceDelegate,
  getNotificationRuntimeSupport,
} from "@/lib/db";
import { getDefaultNotificationPreferencesForRoles } from "@/features/notifications/lib/notification-preferences";

export async function getNotificationPreferences(
  organizationId: string | null | undefined,
  userId: string | null | undefined,
  roles: import("@prisma/client").UserRole[] | null | undefined,
) {
  if (!organizationId || !userId) {
    return getDefaultNotificationPreferencesForRoles(roles);
  }

  if (!getNotificationRuntimeSupport().hasNotificationPreferences) {
    return getDefaultNotificationPreferencesForRoles(roles);
  }

  const notificationPreference = getNotificationPreferenceDelegate();
  if (!notificationPreference) {
    return getDefaultNotificationPreferencesForRoles(roles);
  }

  const preferences = await notificationPreference.findUnique({
    where: {
      organizationId_userId: {
        organizationId,
        userId,
      },
    },
    select: {
      inAppEnabled: true,
      emailEnabled: true,
      remindersEnabled: true,
    },
  });

  return preferences ?? getDefaultNotificationPreferencesForRoles(roles);
}
