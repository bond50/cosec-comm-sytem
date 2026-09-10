import { DispatchStatus } from "@prisma/client";
import { isOpenDispatchStatus } from "@/features/correspondence/lib/correspondence-dispatch-status";
import type { CorrespondenceDetailWithSla } from "@/features/correspondence/queries/correspondence-detail";
import type { CorrespondenceDispatchItem } from "@/features/correspondence/queries/correspondence-dispatches";

const ROUTABLE_CORRESPONDENCE_STATUSES = new Set([
  "DISPATCHED",
  "IN_PROGRESS",
  "AWAITING_FEEDBACK",
]);

export type DispatchActionableItem = {
  dispatch: CorrespondenceDispatchItem;
  canAcknowledge: boolean;
  canRecordFeedback: boolean;
};

export type DispatchActionState = {
  openDispatches: CorrespondenceDispatchItem[];
  actionable: DispatchActionableItem[];
  canCreateDispatch: boolean;
};

/**
 * Computes, per open dispatch, whether the current user can acknowledge or
 * record feedback for it, since several departments can now have their own
 * open dispatch in flight at once for the same correspondence.
 */
export function getDispatchActionState({
  correspondence,
  dispatches,
  canDispatch,
  canWork,
  currentUserId,
  currentUserDepartmentId,
}: {
  correspondence: CorrespondenceDetailWithSla;
  dispatches: CorrespondenceDispatchItem[];
  canDispatch: boolean;
  canWork: boolean;
  currentUserId: string;
  currentUserDepartmentId: string | null;
}): DispatchActionState {
  const openDispatches = dispatches.filter((d) =>
    isOpenDispatchStatus(d.status),
  );

  const canCreateDispatch =
    canDispatch && ROUTABLE_CORRESPONDENCE_STATUSES.has(correspondence.status);

  const actionable: DispatchActionableItem[] = openDispatches.map(
    (dispatch) => {
      const isReceivingTarget =
        dispatch.dispatchedToUser?.id === currentUserId ||
        (!!dispatch.dispatchedToDepartment?.id &&
          dispatch.dispatchedToDepartment.id === currentUserDepartmentId);

      const canAcknowledge =
        canWork &&
        isReceivingTarget &&
        (dispatch.status === DispatchStatus.SENT ||
          dispatch.status === DispatchStatus.OVERDUE);

      const canRecordFeedback =
        canWork &&
        isReceivingTarget &&
        (dispatch.status === DispatchStatus.ACKNOWLEDGED ||
          dispatch.status === DispatchStatus.IN_PROGRESS ||
          dispatch.status === DispatchStatus.FEEDBACK_RECEIVED);

      return { dispatch, canAcknowledge, canRecordFeedback };
    },
  );

  return { openDispatches, actionable, canCreateDispatch };
}
