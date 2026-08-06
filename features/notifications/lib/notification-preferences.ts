import "server-only";

import type { NotificationKind, UserRole } from "@prisma/client";

export type NotificationPreferenceResolved = {
  inAppEnabled: boolean;
  emailEnabled: boolean;
  remindersEnabled: boolean;
};

export function getDefaultNotificationPreferencesForRoles(
  roles: UserRole[] | null | undefined,
): NotificationPreferenceResolved {
  const resolvedRoles = roles ?? [];
  const hasCentralAuthority =
    resolvedRoles.includes("SUPER_ADMIN") ||
    resolvedRoles.includes("ORG_ADMIN") ||
    resolvedRoles.includes("REGISTRY_OFFICER") ||
    resolvedRoles.includes("REVIEWING_OFFICER") ||
    resolvedRoles.includes("MANAGEMENT");

  return {
    inAppEnabled: true,
    emailEnabled: hasCentralAuthority,
    remindersEnabled: true,
  };
}

export function canReceiveNotificationKind(
  preferences: NotificationPreferenceResolved,
  kind: NotificationKind,
) {
  if (!preferences.inAppEnabled) return false;
  if (kind === "REMINDER" && !preferences.remindersEnabled) return false;
  return true;
}

export function canReceiveEmailForNotificationKind(
  preferences: NotificationPreferenceResolved,
  kind: NotificationKind,
) {
  if (!preferences.emailEnabled) return false;
  if (kind === "REMINDER" && !preferences.remindersEnabled) return false;
  return true;
}
