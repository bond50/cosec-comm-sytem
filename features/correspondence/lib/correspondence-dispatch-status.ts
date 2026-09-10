import { CorrespondenceStatus, DispatchStatus } from "@prisma/client";

const OPEN_DISPATCH_STATUSES = [
  DispatchStatus.SENT,
  DispatchStatus.OVERDUE,
  DispatchStatus.ACKNOWLEDGED,
  DispatchStatus.IN_PROGRESS,
  DispatchStatus.FEEDBACK_RECEIVED,
] as const;

export function isOpenDispatchStatus(status: DispatchStatus): boolean {
  return (OPEN_DISPATCH_STATUSES as readonly DispatchStatus[]).includes(status);
}

/**
 * Aggregates correspondence status across every open dispatch using
 * "least-complete wins": the correspondence only advances to a later stage
 * once every open dispatch (i.e. every department the item is currently
 * routed to) has reached at least that stage. This lets several departments
 * be routed to in parallel while a single Correspondence.status field still
 * reflects overall progress.
 */
export function computeAggregateCorrespondenceStatus(
  dispatchStatuses: DispatchStatus[],
): CorrespondenceStatus {
  const open = dispatchStatuses.filter(isOpenDispatchStatus);

  if (open.length === 0) {
    return CorrespondenceStatus.DISPATCHED;
  }

  if (
    open.some(
      (status) =>
        status === DispatchStatus.SENT || status === DispatchStatus.OVERDUE,
    )
  ) {
    return CorrespondenceStatus.DISPATCHED;
  }

  if (open.some((status) => status !== DispatchStatus.FEEDBACK_RECEIVED)) {
    return CorrespondenceStatus.IN_PROGRESS;
  }

  return CorrespondenceStatus.AWAITING_FEEDBACK;
}
