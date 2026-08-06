import "server-only";

import { sendEmail } from "@/lib/email/resend";
import type { NotificationKind, Prisma } from "@prisma/client";
import { getNotificationRuntimeSupport } from "@/lib/db";
import {
  canReceiveEmailForNotificationKind,
  canReceiveNotificationKind,
  getDefaultNotificationPreferencesForRoles,
} from "@/features/notifications/lib/notification-preferences";

type NotificationRecipient = {
  userId: string | null | undefined;
  email?: string | null;
  roles?:
    | Prisma.OrganizationMembershipGetPayload<{
        select: { roles: true };
      }>["roles"]
    | null;
};

type CreateNotificationArgs = {
  tx: Prisma.TransactionClient;
  organizationId: string;
  recipients: NotificationRecipient[];
  title: string;
  message: string;
  type: string;
  kind?: NotificationKind;
  entityType?: string;
  entityId?: string;
  href?: string;
  dedupeKey?: string;
  auditLogId?: string;
  emailSubject?: string;
};

function uniqueRecipients(recipients: NotificationRecipient[]) {
  const seen = new Set<string>();

  return recipients.filter((recipient) => {
    if (!recipient.userId || seen.has(recipient.userId)) return false;
    seen.add(recipient.userId);
    return true;
  });
}

function getNotificationDelegate(tx: Prisma.TransactionClient) {
  return (
    tx as Prisma.TransactionClient & {
      notification?: Prisma.TransactionClient["notification"];
    }
  ).notification;
}

async function sendBestEffortEmail(
  recipients: NotificationRecipient[],
  subject: string,
  message: string,
) {
  const emails = Array.from(
    new Set(
      recipients
        .map((recipient) => recipient.email?.trim())
        .filter((email): email is string => Boolean(email)),
    ),
  );

  if (emails.length === 0 || !process.env.RESEND_API_KEY) return;

  try {
    await sendEmail({
      to: emails,
      subject,
      text: message,
      html: `<p>${message}</p>`,
    });
  } catch {
    // Email is intentionally best-effort; workflow mutations must not fail.
  }
}

export async function createNotifications({
  tx,
  organizationId,
  recipients,
  title,
  message,
  type,
  kind = "UPDATE",
  entityType,
  entityId,
  href,
  dedupeKey,
  auditLogId,
  emailSubject,
}: CreateNotificationArgs) {
  const unique = uniqueRecipients(recipients);

  if (unique.length === 0) return;

  const notification = getNotificationDelegate(tx);
  if (!notification) return;
  const runtimeSupport = getNotificationRuntimeSupport();

  const memberships = await tx.organizationMembership.findMany({
    where: {
      organizationId,
      userId: {
        in: unique.map((recipient) => recipient.userId as string),
      },
      status: "ACTIVE",
    },
    select: {
      userId: true,
      roles: true,
    },
  });
  const membershipByUserId = new Map(
    memberships.map((membership) => [membership.userId, membership]),
  );
  const storedPreferences = runtimeSupport.hasNotificationPreferences
    ? await (
        tx as Prisma.TransactionClient & {
          notificationPreference?: Prisma.TransactionClient["notificationPreference"];
        }
      ).notificationPreference?.findMany({
        where: {
          organizationId,
          userId: {
            in: unique.map((recipient) => recipient.userId as string),
          },
        },
        select: {
          userId: true,
          inAppEnabled: true,
          emailEnabled: true,
          remindersEnabled: true,
        },
      })
    : [];
  const preferenceByUserId = new Map(
    (storedPreferences ?? []).map((preference) => [
      preference.userId,
      preference,
    ]),
  );

  const recipientsWithPreferences = unique.map((recipient) => {
    const preference = preferenceByUserId.get(recipient.userId as string);
    const resolvedPreference =
      preference ??
      getDefaultNotificationPreferencesForRoles(
        membershipByUserId.get(recipient.userId as string)?.roles ?? null,
      );

    return {
      ...recipient,
      preferences: resolvedPreference,
    };
  });

  const inAppRecipients = recipientsWithPreferences.filter((recipient) =>
    canReceiveNotificationKind(recipient.preferences, kind),
  );
  const emailRecipients = recipientsWithPreferences.filter((recipient) =>
    canReceiveEmailForNotificationKind(recipient.preferences, kind),
  );

  if (inAppRecipients.length > 0) {
    await notification.createMany({
      data: inAppRecipients.map((recipient) => ({
        organizationId,
        userId: recipient.userId as string,
        title,
        message,
        type,
        ...(runtimeSupport.hasKind ? { kind } : {}),
        entityType,
        entityId,
        href,
        ...(runtimeSupport.hasAuditLogId ? { dedupeKey, auditLogId } : {}),
      })),
      skipDuplicates: true,
    });
  }

  if (emailRecipients.length > 0) {
    await sendBestEffortEmail(emailRecipients, emailSubject ?? title, message);

    if (inAppRecipients.length > 0 && runtimeSupport.hasEmailedAt) {
      await notification.updateMany({
        where: {
          organizationId,
          userId: {
            in: emailRecipients.map((recipient) => recipient.userId as string),
          },
          type,
          entityType,
          entityId,
          href,
          ...(runtimeSupport.hasAuditLogId
            ? { dedupeKey: dedupeKey ?? null }
            : {}),
        },
        data: {
          emailedAt: new Date(),
        },
      });
    }
  }
}
