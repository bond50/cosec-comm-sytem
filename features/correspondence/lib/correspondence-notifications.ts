import "server-only";

import type { Prisma } from "@prisma/client";
import { createNotifications } from "@/features/notifications/lib/notifications";
import {
  excludeActor,
  getExecutionRecipients,
  getRegistryRecipients,
  getReviewAuthorityRecipients,
  mergeRecipients,
} from "@/features/notifications/lib/notification-routing";

type CorrespondenceNotificationBase = {
  tx: Prisma.TransactionClient;
  organizationId: string;
  correspondenceId: string;
  referenceNumber: string;
  actorUserId?: string | null;
  auditLogId?: string | null;
};

export async function notifyCorrespondenceAwaitingReview({
  tx,
  organizationId,
  correspondenceId,
  referenceNumber,
  actorUserId,
  auditLogId,
}: CorrespondenceNotificationBase) {
  const recipients = excludeActor(
    await getReviewAuthorityRecipients({ tx, organizationId }),
    actorUserId,
  );

  await createNotifications({
    tx,
    organizationId,
    recipients,
    title: "Correspondence awaiting review",
    message: `${referenceNumber} has been registered and is awaiting County Secretary review.`,
    type: "CORRESPONDENCE_AWAITING_REVIEW",
    kind: "ACTION_REQUIRED",
    entityType: "Correspondence",
    entityId: correspondenceId,
    href: `/dashboard/correspondences/${correspondenceId}`,
    auditLogId: auditLogId ?? undefined,
    emailSubject: `Correspondence awaiting review: ${referenceNumber}`,
  });
}

export async function notifyCorrespondenceDispatchIssued({
  tx,
  organizationId,
  correspondenceId,
  referenceNumber,
  actorUserId,
  auditLogId,
  dispatchedToUserId,
  dispatchedToDepartmentId,
  departmentName,
  dueDateLabel,
}: CorrespondenceNotificationBase & {
  dispatchedToUserId?: string | null;
  dispatchedToUserEmail?: string | null;
  dispatchedToDepartmentId?: string | null;
  departmentName?: string | null;
  dueDateLabel?: string | null;
}) {
  const recipients = excludeActor(
    await getExecutionRecipients(
      { tx, organizationId },
      {
        assignedUserId: dispatchedToUserId,
        assignedDepartmentId: dispatchedToDepartmentId,
      },
    ),
    actorUserId,
  );

  await createNotifications({
    tx,
    organizationId,
    recipients,
    title: "Dispatch issued",
    message: `${referenceNumber} has been dispatched to ${departmentName || "the receiving office"}${dueDateLabel ? ` and is due by ${dueDateLabel}` : ""}.`,
    type: "CORRESPONDENCE_DISPATCH_ISSUED",
    kind: "ACTION_REQUIRED",
    entityType: "Correspondence",
    entityId: correspondenceId,
    href: `/dashboard/correspondences/${correspondenceId}`,
    auditLogId: auditLogId ?? undefined,
    emailSubject: `Dispatch issued: ${referenceNumber}`,
  });
}

export async function notifyCorrespondenceReviewed({
  tx,
  organizationId,
  correspondenceId,
  referenceNumber,
  actorUserId,
  auditLogId,
}: CorrespondenceNotificationBase) {
  const recipients = excludeActor(
    mergeRecipients(
      await getReviewAuthorityRecipients({ tx, organizationId }),
      await getRegistryRecipients({ tx, organizationId }),
    ),
    actorUserId,
  );

  await createNotifications({
    tx,
    organizationId,
    recipients,
    title: "Review recorded",
    message: `${referenceNumber} has been reviewed and central-office instructions have been updated.`,
    type: "CORRESPONDENCE_REVIEW_RECORDED",
    kind: "UPDATE",
    entityType: "Correspondence",
    entityId: correspondenceId,
    href: `/dashboard/correspondences/${correspondenceId}`,
    auditLogId: auditLogId ?? undefined,
    emailSubject: `Review recorded: ${referenceNumber}`,
  });
}

export async function notifyCorrespondenceRoutingRecorded({
  tx,
  organizationId,
  correspondenceId,
  referenceNumber,
  actorUserId,
  auditLogId,
  departmentName,
  assignedUserName,
  dueDateLabel,
}: CorrespondenceNotificationBase & {
  departmentName: string;
  assignedUserName?: string | null;
  dueDateLabel?: string | null;
}) {
  const recipients = excludeActor(
    mergeRecipients(
      await getReviewAuthorityRecipients({ tx, organizationId }),
      await getRegistryRecipients({ tx, organizationId }),
    ),
    actorUserId,
  );

  const assignedLabel = assignedUserName
    ? `${departmentName} (${assignedUserName})`
    : departmentName;

  await createNotifications({
    tx,
    organizationId,
    recipients,
    title: "Routing decision saved",
    message: `${referenceNumber} has been routed to ${assignedLabel}${dueDateLabel ? ` with a due date of ${dueDateLabel}` : ""}. Formal dispatch issuance is now pending.`,
    type: "CORRESPONDENCE_ROUTING_RECORDED",
    kind: "UPDATE",
    entityType: "Correspondence",
    entityId: correspondenceId,
    href: `/dashboard/correspondences/${correspondenceId}`,
    auditLogId: auditLogId ?? undefined,
    emailSubject: `Routing decision saved: ${referenceNumber}`,
  });
}

export async function notifyCorrespondenceAcknowledged({
  tx,
  organizationId,
  correspondenceId,
  referenceNumber,
  actorUserId,
  auditLogId,
}: CorrespondenceNotificationBase) {
  const recipients = excludeActor(
    mergeRecipients(
      await getReviewAuthorityRecipients({ tx, organizationId }),
      await getRegistryRecipients({ tx, organizationId }),
    ),
    actorUserId,
  );

  await createNotifications({
    tx,
    organizationId,
    recipients,
    title: "Dispatch acknowledged",
    message: `${referenceNumber} has been acknowledged by the receiving office and is now in progress.`,
    type: "CORRESPONDENCE_DISPATCH_ACKNOWLEDGED",
    kind: "UPDATE",
    entityType: "Correspondence",
    entityId: correspondenceId,
    href: `/dashboard/correspondences/${correspondenceId}`,
    auditLogId: auditLogId ?? undefined,
    emailSubject: `Dispatch acknowledged: ${referenceNumber}`,
  });
}

export async function notifyCorrespondenceFeedbackReturned({
  tx,
  organizationId,
  correspondenceId,
  referenceNumber,
  actorUserId,
  auditLogId,
}: CorrespondenceNotificationBase) {
  const recipients = excludeActor(
    await getReviewAuthorityRecipients({ tx, organizationId }),
    actorUserId,
  );

  await createNotifications({
    tx,
    organizationId,
    recipients,
    title: "Feedback returned",
    message: `${referenceNumber} has execution feedback ready for verification and closure review.`,
    type: "CORRESPONDENCE_FEEDBACK_RETURNED",
    kind: "ACTION_REQUIRED",
    entityType: "Correspondence",
    entityId: correspondenceId,
    href: `/dashboard/correspondences/${correspondenceId}`,
    auditLogId: auditLogId ?? undefined,
    emailSubject: `Feedback returned: ${referenceNumber}`,
  });
}

export async function notifyCorrespondenceFinalized({
  tx,
  organizationId,
  correspondenceId,
  referenceNumber,
  actorUserId,
  auditLogId,
  assignedToUserId,
  assignedToDepartmentId,
  finalStatus,
}: CorrespondenceNotificationBase & {
  assignedToUserId?: string | null;
  assignedToUserEmail?: string | null;
  assignedToDepartmentId?: string | null;
  finalStatus: "closed" | "cancelled";
}) {
  const executionRecipients = await getExecutionRecipients(
    { tx, organizationId },
    {
      assignedUserId: assignedToUserId,
      assignedDepartmentId: assignedToDepartmentId,
    },
  );
  const reviewRecipients = await getReviewAuthorityRecipients({
    tx,
    organizationId,
  });
  const registryRecipients = await getRegistryRecipients({
    tx,
    organizationId,
  });

  const recipients = excludeActor(
    mergeRecipients(executionRecipients, reviewRecipients, registryRecipients),
    actorUserId,
  );

  await createNotifications({
    tx,
    organizationId,
    recipients,
    title:
      finalStatus === "closed"
        ? "Correspondence closed"
        : "Correspondence cancelled",
    message: `${referenceNumber} has been ${finalStatus} by the central office.`,
    type:
      finalStatus === "closed"
        ? "CORRESPONDENCE_CLOSED"
        : "CORRESPONDENCE_CANCELLED",
    kind: "UPDATE",
    entityType: "Correspondence",
    entityId: correspondenceId,
    href: `/dashboard/correspondences/${correspondenceId}`,
    auditLogId: auditLogId ?? undefined,
    emailSubject: `${finalStatus === "closed" ? "Closed" : "Cancelled"}: ${referenceNumber}`,
  });
}

export async function notifyCorrespondenceReopened({
  tx,
  organizationId,
  correspondenceId,
  referenceNumber,
  actorUserId,
  auditLogId,
  assignedToUserId,
  assignedToDepartmentId,
}: CorrespondenceNotificationBase & {
  assignedToUserId?: string | null;
  assignedToUserEmail?: string | null;
  assignedToDepartmentId?: string | null;
}) {
  const reviewRecipients = excludeActor(
    await getReviewAuthorityRecipients({ tx, organizationId }),
    actorUserId,
  );
  const executionRecipients = excludeActor(
    await getExecutionRecipients(
      { tx, organizationId },
      {
        assignedUserId: assignedToUserId,
        assignedDepartmentId: assignedToDepartmentId,
      },
    ),
    actorUserId,
  );

  await createNotifications({
    tx,
    organizationId,
    recipients: reviewRecipients,
    title: "Correspondence reopened",
    message: `${referenceNumber} has been reopened and returned to the central review workflow.`,
    type: "CORRESPONDENCE_REOPENED",
    kind: "ACTION_REQUIRED",
    entityType: "Correspondence",
    entityId: correspondenceId,
    href: `/dashboard/correspondences/${correspondenceId}`,
    auditLogId: auditLogId ?? undefined,
    emailSubject: `Correspondence reopened: ${referenceNumber}`,
  });

  await createNotifications({
    tx,
    organizationId,
    recipients: executionRecipients,
    title: "Correspondence reopened",
    message: `${referenceNumber} was reopened by the central office and may be routed back for follow-up action.`,
    type: "CORRESPONDENCE_REOPENED_EXECUTION_UPDATE",
    kind: "UPDATE",
    entityType: "Correspondence",
    entityId: correspondenceId,
    href: `/dashboard/correspondences/${correspondenceId}`,
    auditLogId: auditLogId ?? undefined,
    emailSubject: `Correspondence reopened: ${referenceNumber}`,
  });
}
