import "server-only";

import {
  ActionPointStatus,
  CorrespondenceStatus,
  DispatchStatus,
  type Prisma,
} from "@prisma/client";
import { getCorrespondenceSla } from "@/features/correspondence/queries/correspondence-sla";
import { hasFoundationPermission } from "@/features/auth/utils/role-access";
import { createNotifications } from "@/features/notifications/lib/notifications";
import {
  getExecutionRecipients,
  getReviewAuthorityRecipients,
} from "@/features/notifications/lib/notification-routing";

type EnsureNotificationRemindersArgs = {
  tx: Prisma.TransactionClient;
  organizationId: string;
  userId: string;
};

function formatDateLabel(value: Date) {
  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
  }).format(value);
}

function startOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function addDays(value: Date, amount: number) {
  return new Date(
    value.getFullYear(),
    value.getMonth(),
    value.getDate() + amount,
    value.getHours(),
    value.getMinutes(),
    value.getSeconds(),
    value.getMilliseconds(),
  );
}

function toDateKey(value: Date) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

export async function ensureUserNotificationReminders({
  tx,
  organizationId,
  userId,
}: EnsureNotificationRemindersArgs) {
  const membership = await tx.organizationMembership.findFirst({
    where: {
      organizationId,
      userId,
      status: "ACTIVE",
    },
    select: {
      departmentId: true,
      roles: true,
      user: {
        select: {
          email: true,
        },
      },
    },
  });

  if (!membership) return;

  const roles = membership.roles;
  const today = new Date();
  const todayStart = startOfDay(today);
  const tomorrowStart = startOfDay(addDays(today, 1));
  const dayAfterTomorrowStart = startOfDay(addDays(today, 2));
  const todayKey = toDateKey(todayStart);

  const reminderRecipients = [
    {
      userId,
      email: membership.user.email,
      roles,
    },
  ];

  const canWorkCorrespondence = hasFoundationPermission(
    roles,
    "correspondence.work",
  );
  const canCloseCorrespondence = hasFoundationPermission(
    roles,
    "correspondence.close",
  );

  if (canWorkCorrespondence) {
    const dueTomorrowItems = await tx.correspondence.findMany({
      where: {
        organizationId,
        status: {
          in: [
            CorrespondenceStatus.DISPATCHED,
            CorrespondenceStatus.IN_PROGRESS,
            CorrespondenceStatus.AWAITING_FEEDBACK,
          ],
        },
        dueDate: {
          gte: tomorrowStart,
          lt: dayAfterTomorrowStart,
        },
        OR: [
          {
            assignedToUserId: userId,
          },
          membership.departmentId
            ? {
                assignedToDepartmentId: membership.departmentId,
              }
            : undefined,
        ].filter(Boolean) as Prisma.CorrespondenceWhereInput[],
      },
      select: {
        id: true,
        referenceNumber: true,
        subject: true,
        dueDate: true,
        assignedToUserId: true,
        assignedToDepartmentId: true,
      },
    });

    for (const item of dueTomorrowItems) {
      const recipients = await getExecutionRecipients(
        { tx, organizationId },
        {
          assignedUserId: item.assignedToUserId,
          assignedDepartmentId: item.assignedToDepartmentId,
        },
      );
      const shouldNotifyCurrentUser = recipients.some(
        (recipient) => recipient.userId === userId,
      );
      if (!shouldNotifyCurrentUser) continue;

      await createNotifications({
        tx,
        organizationId,
        recipients: reminderRecipients,
        title: "Due tomorrow",
        message: `${item.referenceNumber} is due tomorrow on ${formatDateLabel(item.dueDate as Date)}.`,
        type: "CORRESPONDENCE_DUE_TOMORROW",
        kind: "REMINDER",
        entityType: "Correspondence",
        entityId: item.id,
        href: `/dashboard/correspondences/${item.id}`,
        dedupeKey: `corr-due-tomorrow:${item.id}:${toDateKey(item.dueDate as Date)}`,
        emailSubject: `Due tomorrow: ${item.referenceNumber}`,
      });
    }

    const overdueItems = await tx.correspondence.findMany({
      where: {
        organizationId,
        status: {
          in: [
            CorrespondenceStatus.DISPATCHED,
            CorrespondenceStatus.IN_PROGRESS,
            CorrespondenceStatus.AWAITING_FEEDBACK,
          ],
        },
        dueDate: {
          lt: todayStart,
        },
        OR: [
          {
            assignedToUserId: userId,
          },
          membership.departmentId
            ? {
                assignedToDepartmentId: membership.departmentId,
              }
            : undefined,
        ].filter(Boolean) as Prisma.CorrespondenceWhereInput[],
      },
      select: {
        id: true,
        referenceNumber: true,
        dueDate: true,
        assignedToUserId: true,
        assignedToDepartmentId: true,
      },
    });

    for (const item of overdueItems) {
      const recipients = await getExecutionRecipients(
        { tx, organizationId },
        {
          assignedUserId: item.assignedToUserId,
          assignedDepartmentId: item.assignedToDepartmentId,
        },
      );
      const shouldNotifyCurrentUser = recipients.some(
        (recipient) => recipient.userId === userId,
      );
      if (!shouldNotifyCurrentUser) continue;

      await createNotifications({
        tx,
        organizationId,
        recipients: reminderRecipients,
        title: "Overdue correspondence",
        message: `${item.referenceNumber} is overdue and needs action.`,
        type: "CORRESPONDENCE_OVERDUE",
        kind: "REMINDER",
        entityType: "Correspondence",
        entityId: item.id,
        href: `/dashboard/correspondences/${item.id}`,
        dedupeKey: `corr-overdue:${item.id}:${todayKey}`,
        emailSubject: `Overdue correspondence: ${item.referenceNumber}`,
      });
    }

    const awaitingAcknowledgementDispatches =
      await tx.correspondenceDispatch.findMany({
        where: {
          organizationId,
          status: DispatchStatus.SENT,
          OR: [
            {
              dispatchedToUserId: userId,
            },
            membership.departmentId
              ? {
                  dispatchedToDepartmentId: membership.departmentId,
                }
              : undefined,
          ].filter(Boolean) as Prisma.CorrespondenceDispatchWhereInput[],
        },
        select: {
          id: true,
          dispatchedToUserId: true,
          dispatchedToDepartmentId: true,
          correspondence: {
            select: {
              id: true,
              referenceNumber: true,
            },
          },
        },
      });

    for (const dispatch of awaitingAcknowledgementDispatches) {
      const recipients = await getExecutionRecipients(
        { tx, organizationId },
        {
          assignedUserId: dispatch.dispatchedToUserId,
          assignedDepartmentId: dispatch.dispatchedToDepartmentId,
        },
      );
      const shouldNotifyCurrentUser = recipients.some(
        (recipient) => recipient.userId === userId,
      );
      if (!shouldNotifyCurrentUser) continue;

      await createNotifications({
        tx,
        organizationId,
        recipients: reminderRecipients,
        title: "Receipt acknowledgement pending",
        message: `${dispatch.correspondence.referenceNumber} is waiting for receipt acknowledgement.`,
        type: "CORRESPONDENCE_AWAITING_ACKNOWLEDGEMENT",
        kind: "REMINDER",
        entityType: "Correspondence",
        entityId: dispatch.correspondence.id,
        href: `/dashboard/correspondences/${dispatch.correspondence.id}`,
        dedupeKey: `dispatch-awaiting-ack:${dispatch.id}:${todayKey}`,
        emailSubject: `Acknowledgement pending: ${dispatch.correspondence.referenceNumber}`,
      });
    }
  }

  if (canCloseCorrespondence) {
    const pendingFeedbackItems = await tx.correspondence.findMany({
      where: {
        organizationId,
        status: CorrespondenceStatus.AWAITING_FEEDBACK,
      },
      select: {
        id: true,
        referenceNumber: true,
      },
    });

    for (const item of pendingFeedbackItems) {
      const reviewRecipients = await getReviewAuthorityRecipients({
        tx,
        organizationId,
      });
      const shouldNotifyCurrentUser = reviewRecipients.some(
        (recipient) => recipient.userId === userId,
      );
      if (!shouldNotifyCurrentUser) continue;

      await createNotifications({
        tx,
        organizationId,
        recipients: reminderRecipients,
        title: "Verification pending",
        message: `${item.referenceNumber} is awaiting central-office verification and closure review.`,
        type: "CORRESPONDENCE_PENDING_FEEDBACK_REVIEW",
        kind: "REMINDER",
        entityType: "Correspondence",
        entityId: item.id,
        href: `/dashboard/correspondences/${item.id}`,
        dedupeKey: `corr-pending-feedback:${item.id}:${todayKey}`,
        emailSubject: `Verification pending: ${item.referenceNumber}`,
      });
    }
  }

  const actionPointItems = await tx.meetingActionPoint.findMany({
    where: {
      organizationId,
      status: {
        in: [
          ActionPointStatus.OPEN,
          ActionPointStatus.IN_PROGRESS,
          ActionPointStatus.OVERDUE,
        ],
      },
      OR: [
        {
          assignedToUserId: userId,
        },
        membership.departmentId
          ? {
              assignedToDepartmentId: membership.departmentId,
            }
          : undefined,
      ].filter(Boolean) as Prisma.MeetingActionPointWhereInput[],
    },
    select: {
      id: true,
      actionPoint: true,
      dueDate: true,
      assignedToUserId: true,
      assignedToDepartmentId: true,
      meeting: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });

  for (const item of actionPointItems) {
    const sla = getCorrespondenceSla(item.dueDate, today);
    const recipients = await getExecutionRecipients(
      { tx, organizationId },
      {
        assignedUserId: item.assignedToUserId,
        assignedDepartmentId: item.assignedToDepartmentId,
      },
    );
    const shouldNotifyCurrentUser = recipients.some(
      (recipient) => recipient.userId === userId,
    );
    if (!shouldNotifyCurrentUser) continue;

    if (sla.daysRemaining === 1) {
      await createNotifications({
        tx,
        organizationId,
        recipients: reminderRecipients,
        title: "Action point due tomorrow",
        message: `${item.actionPoint} is due tomorrow in ${item.meeting.title}.`,
        type: "ACTION_POINT_DUE_TOMORROW",
        kind: "REMINDER",
        entityType: "MeetingActionPoint",
        entityId: item.id,
        href: `/dashboard/meetings/${item.meeting.id}`,
        dedupeKey: `action-point-due-tomorrow:${item.id}:${toDateKey(item.dueDate)}`,
        emailSubject: `Action point due tomorrow: ${item.meeting.title}`,
      });
    }

    if (sla.isOverdue) {
      await createNotifications({
        tx,
        organizationId,
        recipients: reminderRecipients,
        title: "Overdue action point",
        message: `${item.actionPoint} is overdue in ${item.meeting.title}.`,
        type: "ACTION_POINT_OVERDUE",
        kind: "REMINDER",
        entityType: "MeetingActionPoint",
        entityId: item.id,
        href: `/dashboard/meetings/${item.meeting.id}`,
        dedupeKey: `action-point-overdue:${item.id}:${todayKey}`,
        emailSubject: `Overdue action point: ${item.meeting.title}`,
      });
    }
  }
}
