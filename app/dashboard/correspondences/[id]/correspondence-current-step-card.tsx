import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CorrespondenceAssignForm } from "@/app/dashboard/correspondences/[id]/correspondence-assign-form";
import { CorrespondenceCurrentStepAction } from "@/app/dashboard/correspondences/[id]/correspondence-current-step-action";
import { CorrespondenceDispatchAcknowledgeForm } from "@/app/dashboard/correspondences/[id]/correspondence-dispatch-ack-form";
import { CorrespondenceDispatchFeedbackForm } from "@/app/dashboard/correspondences/[id]/correspondence-dispatch-feedback-form";
import { CorrespondenceDispatchForm } from "@/app/dashboard/correspondences/[id]/correspondence-dispatch-form";
import { CorrespondenceCloseForm } from "@/app/dashboard/correspondences/[id]/correspondence-close-form";
import { CorrespondenceReopenForm } from "@/app/dashboard/correspondences/[id]/correspondence-reopen-form";
import { CorrespondenceReviewForm } from "@/app/dashboard/correspondences/[id]/correspondence-review-form";
import type { CorrespondenceDetailWithSla } from "@/features/correspondence/queries/correspondence-detail";
import type { CorrespondenceDispatchItem } from "@/features/correspondence/queries/correspondence-dispatches";

type CorrespondenceCurrentStepCardProps = {
  correspondence: CorrespondenceDetailWithSla;
  dispatches: CorrespondenceDispatchItem[];
  canReview: boolean;
  canAssign: boolean;
  canWork: boolean;
  canClose: boolean;
  currentUserId: string;
  currentUserDepartmentId: string | null;
  departmentOptions: {
    id: string;
    label: string;
  }[];
  assigneeOptions: {
    id: string;
    label: string;
    departmentId: string | null;
  }[];
};

function getStatusBadgeClass(status: string) {
  switch (status) {
    case "NEW":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "UNDER_REVIEW":
      return "border-violet-200 bg-violet-50 text-violet-700";
    case "DISPATCHED":
      return "border-indigo-200 bg-indigo-50 text-indigo-700";
    case "IN_PROGRESS":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "AWAITING_FEEDBACK":
      return "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700";
    case "COMPLETED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "CANCELLED":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "CLOSED":
      return "border-slate-200 bg-slate-100 text-slate-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
}

function ViewOnlyNotice({ children }: { children: ReactNode }) {
  return (
    <Alert className="border-[#c7ddea] bg-[#eef7fb]">
      <AlertDescription className="text-slate-600">{children}</AlertDescription>
    </Alert>
  );
}

function getDispatchActionState({
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
}) {
  const latestDispatch = dispatches[0] ?? null;
  const latestDispatchIsComplete =
    latestDispatch === null ||
    latestDispatch.status === "CLOSED" ||
    latestDispatch.feedbackReceivedAt !== null;
  const isReceivingTarget =
    latestDispatch !== null &&
    (latestDispatch.dispatchedToUser?.id === currentUserId ||
      (!!latestDispatch.dispatchedToDepartment?.id &&
        latestDispatch.dispatchedToDepartment.id === currentUserDepartmentId));
  const canCreateDispatch =
    canDispatch &&
    correspondence.status === "DISPATCHED" &&
    latestDispatchIsComplete;
  const canAcknowledge =
    canWork &&
    isReceivingTarget &&
    correspondence.status === "DISPATCHED" &&
    latestDispatch !== null &&
    (latestDispatch.status === "SENT" || latestDispatch.status === "OVERDUE");
  const canRecordFeedback =
    canWork &&
    isReceivingTarget &&
    (correspondence.status === "IN_PROGRESS" ||
      correspondence.status === "AWAITING_FEEDBACK") &&
    latestDispatch !== null &&
    (latestDispatch.status === "ACKNOWLEDGED" ||
      latestDispatch.status === "IN_PROGRESS" ||
      latestDispatch.status === "FEEDBACK_RECEIVED");

  return {
    latestDispatch,
    canCreateDispatch,
    canAcknowledge,
    canRecordFeedback,
  };
}

function formatUserLabel(
  user: { name: string | null; email: string | null } | null | undefined,
) {
  return user?.name || user?.email || null;
}

function formatAssignmentLabel(correspondence: CorrespondenceDetailWithSla) {
  const department = correspondence.assignedToDepartment?.code
    ? `${correspondence.assignedToDepartment.name} (${correspondence.assignedToDepartment.code})`
    : correspondence.assignedToDepartment?.name;
  const user = formatUserLabel(correspondence.assignedToUser);

  if (department && user) return `${department} / ${user}`;

  return department || user || "Unassigned";
}

function formatDispatchTargetLabel(
  dispatch: CorrespondenceDispatchItem | null,
) {
  if (!dispatch) return null;

  const department = dispatch.dispatchedToDepartment?.name;
  const user = formatUserLabel(dispatch.dispatchedToUser);

  if (department && user) return `${department} / ${user}`;

  return department || user;
}

function getCurrentStatusClue(
  correspondence: CorrespondenceDetailWithSla,
  latestDispatch: CorrespondenceDispatchItem | null,
) {
  const reviewer = formatUserLabel(correspondence.reviewedByUser);
  const assignee = formatUserLabel(correspondence.assignedToUser);
  const department = correspondence.assignedToDepartment?.name;
  const dispatchTarget = formatDispatchTargetLabel(latestDispatch);
  const owner = dispatchTarget || formatAssignmentLabel(correspondence);

  switch (correspondence.status) {
    case "NEW":
      return `Waiting for central-office review. Source office: ${correspondence.senderOffice}.`;
    case "UNDER_REVIEW":
      return reviewer
        ? `Under central-office review by ${reviewer}; routing is the next decision.`
        : "Waiting for the County Secretary review path to record instructions.";
    case "DISPATCHED":
      if (latestDispatch && !latestDispatch.acknowledgedAt) {
        return `Waiting for acknowledgement by ${owner}.`;
      }

      return `Routed to ${owner}; dispatch handling is in progress.`;
    case "IN_PROGRESS":
      return `With ${owner} for action and execution feedback.`;
    case "AWAITING_FEEDBACK":
      return `Feedback received from ${department || assignee || owner || "the receiving office"}; ready for central-office verification and closure.`;
    case "COMPLETED":
      return `Completed by ${department || assignee || "the receiving office"}; ready for closure.`;
    case "CANCELLED":
      return "Cancelled; reopen only if official action is required.";
    case "CLOSED":
      return "Closed and final unless reopened for new official action.";
    default:
      return "Current responsibility is being resolved.";
  }
}

export function CorrespondenceCurrentStepCard({
  correspondence,
  dispatches,
  canReview,
  canAssign,
  canWork,
  canClose,
  currentUserId,
  currentUserDepartmentId,
  departmentOptions,
  assigneeOptions,
}: CorrespondenceCurrentStepCardProps) {
  const dispatchAction = getDispatchActionState({
    correspondence,
    dispatches,
    canDispatch: canAssign,
    canWork,
    currentUserId,
    currentUserDepartmentId,
  });
  const statusClue = getCurrentStatusClue(
    correspondence,
    dispatchAction.latestDispatch,
  );
  const canReviewNow =
    canReview &&
    (correspondence.status === "NEW" ||
      correspondence.status === "UNDER_REVIEW" ||
      correspondence.status === "DISPATCHED" ||
      correspondence.status === "IN_PROGRESS" ||
      correspondence.status === "AWAITING_FEEDBACK");
  const canAssignNow = canAssign && correspondence.status === "UNDER_REVIEW";
  const canCloseNow =
    canClose &&
    correspondence.status !== "CANCELLED" &&
    correspondence.status !== "CLOSED";
  const canReopenNow =
    canClose &&
    (correspondence.status === "CANCELLED" ||
      correspondence.status === "CLOSED");

  let title = "View correspondence";
  let description = "Review the current file details and movement history.";
  let nextStep = "No next workflow step is available.";
  let action: ReactNode = (
    <ViewOnlyNotice>No active workflow action is available.</ViewOnlyNotice>
  );

  if (correspondence.status === "NEW") {
    title = "Review correspondence";
    description = "Record the central-office review and instructions first.";
    nextStep = "After review, this moves to routing.";
    action = canReviewNow ? (
      <CorrespondenceCurrentStepAction
        actionLabel="Review"
        summary="Open the review form only when you are ready to record instructions."
      >
        <CorrespondenceReviewForm
          correspondenceId={correspondence.id}
          instructions={correspondence.instructions}
        />
      </CorrespondenceCurrentStepAction>
    ) : (
      <ViewOnlyNotice>
        View only - review is restricted to review-authorized roles.
      </ViewOnlyNotice>
    );
  } else if (correspondence.status === "UNDER_REVIEW") {
    title = "Route correspondence";
    description =
      "Choose the responsible department, receiving officer, and due date.";
    nextStep = "After routing, this becomes ready for dispatch.";
    action = canAssignNow ? (
      <CorrespondenceCurrentStepAction
        actionLabel="Route"
        summary="Open routing only when you are ready to choose responsibility and due date."
      >
        <CorrespondenceAssignForm
          correspondenceId={correspondence.id}
          assignedToDepartmentId={
            correspondence.assignedToDepartment?.id ?? null
          }
          assignedToUserId={correspondence.assignedToUser?.id ?? null}
          dueDate={correspondence.dueDate}
          departmentOptions={departmentOptions}
          assigneeOptions={assigneeOptions}
        />
      </CorrespondenceCurrentStepAction>
    ) : (
      <ViewOnlyNotice>
        View only - routing is restricted to central-office roles.
      </ViewOnlyNotice>
    );
  } else if (correspondence.status === "DISPATCHED") {
    if (dispatchAction.canCreateDispatch) {
      title = "Issue dispatch";
      description = "Send the routed correspondence to the receiving office.";
      nextStep = "After dispatch, the receiving office acknowledges it.";
      action = (
        <CorrespondenceCurrentStepAction
          actionLabel="Dispatch"
          summary="Open dispatch only when the record is ready to leave central office."
        >
          <CorrespondenceDispatchForm
            correspondenceId={correspondence.id}
            defaultDispatchDate={new Date()}
          />
        </CorrespondenceCurrentStepAction>
      );
    } else if (dispatchAction.canAcknowledge && dispatchAction.latestDispatch) {
      title = "Acknowledge dispatch";
      description =
        "Confirm that the receiving office has accepted the dispatch.";
      nextStep = "After acknowledgement, execution feedback can be recorded.";
      action = (
        <CorrespondenceCurrentStepAction
          actionLabel="Acknowledge"
          summary="Open acknowledgement when the receiving office has the dispatch."
        >
          <CorrespondenceDispatchAcknowledgeForm
            dispatchId={dispatchAction.latestDispatch.id}
            acknowledgedAt={dispatchAction.latestDispatch.acknowledgedAt}
          />
        </CorrespondenceCurrentStepAction>
      );
    } else {
      title = "Await acknowledgement";
      description =
        "The dispatch has been issued and is waiting for receiving-office acknowledgement.";
      nextStep = "Once acknowledged, feedback can be recorded.";
      action = (
        <ViewOnlyNotice>
          No action is available to your role at this step.
        </ViewOnlyNotice>
      );
    }
  } else if (correspondence.status === "IN_PROGRESS") {
    title = "Record feedback";
    description = "Capture execution feedback from the receiving office.";
    nextStep = "After feedback, central office can verify and close the file.";
    action =
      dispatchAction.canRecordFeedback && dispatchAction.latestDispatch ? (
        <CorrespondenceCurrentStepAction
          actionLabel="Record feedback"
          summary="Open feedback when execution details are ready to submit."
        >
          <CorrespondenceDispatchFeedbackForm
            dispatchId={dispatchAction.latestDispatch.id}
            feedbackReceivedAt={
              dispatchAction.latestDispatch.feedbackReceivedAt
            }
            feedbackNote={dispatchAction.latestDispatch.feedbackNote}
          />
        </CorrespondenceCurrentStepAction>
      ) : (
        <ViewOnlyNotice>
          Feedback is available only to the assigned receiving office.
        </ViewOnlyNotice>
      );
  } else if (
    correspondence.status === "AWAITING_FEEDBACK" ||
    correspondence.status === "COMPLETED"
  ) {
    title = "Close correspondence";
    description = "Verify completion and close the correspondence file.";
    nextStep = "After closure, the file becomes final unless reopened.";
    action = canCloseNow ? (
      <CorrespondenceCurrentStepAction
        actionLabel="Close"
        summary="Open closure when completion has been verified."
      >
        <CorrespondenceCloseForm correspondenceId={correspondence.id} />
      </CorrespondenceCurrentStepAction>
    ) : (
      <ViewOnlyNotice>
        View only - closure is restricted to central-office roles.
      </ViewOnlyNotice>
    );
  } else if (
    correspondence.status === "CLOSED" ||
    correspondence.status === "CANCELLED"
  ) {
    title = "Final state";
    description =
      "This file is final. Reopen it only when more official action is required.";
    nextStep = "If reopened, this returns to Under Review.";
    action = canReopenNow ? (
      <CorrespondenceCurrentStepAction
        actionLabel="Reopen"
        summary="Keep this closed unless new official action is required."
        steps={["Reason", "Review", "Reopen"]}
        tone="caution"
      >
        <CorrespondenceReopenForm correspondenceId={correspondence.id} />
      </CorrespondenceCurrentStepAction>
    ) : (
      <ViewOnlyNotice>
        View only - reopening is restricted to central-office roles.
      </ViewOnlyNotice>
    );
  }

  return (
    <Card className="rounded-2xl border-[#9cc7df] bg-[#eef7fb] shadow-md shadow-[#c7ddea]/70">
      <CardHeader className="px-6 py-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand">
              Current workflow step
            </p>
            <CardTitle className="mt-2 text-[1.25rem] text-slate-950">
              {title}
            </CardTitle>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              {description}
            </p>
            <p className="mt-3 rounded-xl border border-[#bde5cf] bg-[#f0fbf5] px-3 py-2 text-sm font-medium text-[#0f6b3a]">
              {statusClue}
            </p>
            <p className="mt-2 rounded-xl border border-[#c7ddea] bg-[#fbfdff] px-3 py-2 text-sm font-medium text-[#124f7d]">
              {nextStep}
            </p>
          </div>
          <Badge
            variant="outline"
            className={`w-fit px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.12em] ${getStatusBadgeClass(
              correspondence.status,
            )}`}
          >
            {correspondence.status.replaceAll("_", " ")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-6">{action}</CardContent>
    </Card>
  );
}
