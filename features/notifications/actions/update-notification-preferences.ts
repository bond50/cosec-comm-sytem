"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { db, getNotificationPreferenceDelegate } from "@/lib/db";
import { requireOrganizationPermission } from "@/features/auth/utils/require-organization-permission";
import {
  getNotificationPreferencesValuesFromFormData,
  notificationPreferencesSchema,
  type NotificationPreferencesActionState,
} from "@/features/notifications/lib/notification-preferences.shared";

export async function updateNotificationPreferencesAction(
  _previousState: NotificationPreferencesActionState,
  formData: FormData,
): Promise<NotificationPreferencesActionState> {
  const values = getNotificationPreferencesValuesFromFormData(formData);
  const parsed = notificationPreferencesSchema.safeParse(values);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please correct the highlighted notification settings.",
      values,
    };
  }

  try {
    const access = await requireOrganizationPermission("dashboard.view");

    const notificationPreference = getNotificationPreferenceDelegate();

    if (notificationPreference) {
      await notificationPreference.upsert({
        where: {
          organizationId_userId: {
            organizationId: access.organization.id,
            userId: access.userId,
          },
        },
        update: parsed.data,
        create: {
          organizationId: access.organization.id,
          userId: access.userId,
          ...parsed.data,
        },
      });
    } else {
      await db.$executeRaw(
        Prisma.sql`
          INSERT INTO notification_preferences (
            id,
            organization_id,
            user_id,
            in_app_enabled,
            email_enabled,
            reminders_enabled,
            created_at,
            updated_at
          )
          VALUES (
            ${crypto.randomUUID()},
            ${access.organization.id},
            ${access.userId},
            ${parsed.data.inAppEnabled},
            ${parsed.data.emailEnabled},
            ${parsed.data.remindersEnabled},
            NOW(),
            NOW()
          )
          ON CONFLICT (organization_id, user_id)
          DO UPDATE SET
            in_app_enabled = EXCLUDED.in_app_enabled,
            email_enabled = EXCLUDED.email_enabled,
            reminders_enabled = EXCLUDED.reminders_enabled,
            updated_at = NOW()
        `,
      );
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/notifications");

    return {
      ok: true,
      message: "Notification preferences updated.",
      values: parsed.data,
    };
  } catch {
    return {
      ok: false,
      message: "We could not update notification preferences right now.",
      values: parsed.data,
    };
  }
}
