import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { formatUserLabel as formatUserLabelWithDesignation } from "@/features/application/lib/user-label";
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
import { getDispatchActionState } from "@/features/correspondence/lib/correspondence-dispatch-actions";
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

function formatUserLabel(
  user:
    | { name: string | null; email: string | null; designation?: string | null }
    | null
    | undefined,
) {
  return formatUserLabelWithDesignation(user, null);
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
  openDispatches: CorrespondenceDispatchItem[],
) {
  const reviewer = formatUserLabel(correspondence.reviewedByUser);
  const assignee = formatUserLabel(correspondence.assignedToUser);
  const department = correspondence.assignedToDepartment?.name;

  switch (correspondence.status) {
    case "NEW":
      return `Waiting for central-office review. Source office: ${correspondence.senderOffice}.`;
    case "UNDER_REVIEW":
      return reviewer
        ? `Under central-office review by ${reviewer}; routing is the next decision.`
        : "Waiting for the County Secretary review path to record instructions.";
    case "DISPATCHED":
    case "IN_PROGRESS":
    case "AWAITING_FEEDBACK": {
      if (openDispatches.length === 0) {
        return `Routed to ${formatAssignmentLabel(correspondence)}; dispatch handling is in progress.`;
      }

      const pendingAck = openDispatches.filter((d) => !d.acknowledgedAt);
      const pendingFeedback = openDispatches.filter(
        (d) => d.acknowledgedAt && !d.feedbackReceivedAt,
      );
      const returned = openDispatches.filter((d) => d.feedbackReceivedAt);
      const clauses: string[] = [];

      if (pendingAck.length) {
        clauses.push(
          `awaiting acknowledgement from ${pendingAck
            .map((d) => formatDispatchTargetLabel(d))
            .join(", ")}`,
        );
      }
      if (pendingFeedback.length) {
        clauses.push(
          `in progress with ${pendingFeedback
            .map((d) => formatDispatchTargetLabel(d))
            .join(", ")}`,
        );
      }
      if (returned.length) {
        clauses.push(
          `feedback returned from ${returned
            .map((d) => formatDispatchTargetLabel(d))
            .join(", ")}`,
        );
      }

      const departmentCount = openDispatches.length;
      return `Routed to ${departmentCount} department${departmentCount > 1 ? "s" : ""}${
        clauses.length ? `: ${clauses.join("; ")}` : ""
      }.`;
    }
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
    dispatchAction.openDispatches,
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
  } else if (
    correspondence.status === "DISPATCHED" ||
    correspondence.status === "IN_PROGRESS"
  ) {
    const pendingAcknowledgements = dispatchAction.actionable.filter(
      (item) => item.canAcknowledge,
    );
    const pendingFeedback = dispatchAction.actionable.filter(
      (item) => item.canRecordFeedback,
    );
    const hasAnyAction =
      pendingAcknowledgements.length > 0 ||
      pendingFeedback.length > 0 ||
      dispatchAction.canCreateDispatch;

    title =
      dispatchAction.openDispatches.length > 1
        ? "Manage routed departments"
        : correspondence.status === "DISPATCHED"
          ? "Await acknowledgement"
          : "Record feedback";
    description =
      "Acknowledge receipt, record execution feedback, or route to another department.";
    nextStep =
      "Once every routed department has returned feedback, the file becomes ready to close.";

    action = hasAnyAction ? (
      <div className="space-y-4">
        {pendingAcknowledgements.map(({ dispatch }) => (
          <CorrespondenceCurrentStepAction
            key={dispatch.id}
            actionLabel={`Acknowledge — ${formatDispatchTargetLabel(dispatch)}`}
            summary="Open acknowledgement when the receiving office has the dispatch."
          >
            <CorrespondenceDispatchAcknowledgeForm
              dispatchId={dispatch.id}
              acknowledgedAt={dispatch.acknowledgedAt}
            />
          </CorrespondenceCurrentStepAction>
        ))}
        {pendingFeedback.map(({ dispatch }) => (
          <CorrespondenceCurrentStepAction
            key={dispatch.id}
            actionLabel={`Record feedback — ${formatDispatchTargetLabel(dispatch)}`}
            summary="Open feedback when execution details are ready to submit."
          >
            <CorrespondenceDispatchFeedbackForm
              dispatchId={dispatch.id}
              feedbackReceivedAt={dispatch.feedbackReceivedAt}
              feedbackNote={dispatch.feedbackNote}
            />
          </CorrespondenceCurrentStepAction>
        ))}
        {dispatchAction.canCreateDispatch ? (
          <CorrespondenceCurrentStepAction
            actionLabel="Route to another department"
            summary="Send this correspondence to an additional department in parallel."
          >
            <CorrespondenceDispatchForm
              correspondenceId={correspondence.id}
              defaultDispatchDate={new Date()}
              departmentOptions={departmentOptions}
              assigneeOptions={assigneeOptions}
            />
          </CorrespondenceCurrentStepAction>
        ) : null}
      </div>
    ) : (
      <ViewOnlyNotice>
        No action is available to your role at this step.
      </ViewOnlyNotice>
    );
  } else if (
    correspondence.status === "AWAITING_FEEDBACK" ||
    correspondence.status === "COMPLETED"
  ) {
    const pendingFeedback = dispatchAction.actionable.filter(
      (item) => item.canRecordFeedback,
    );

    title = "Close correspondence";
    description = "Verify completion and close the correspondence file.";
    nextStep = "After closure, the file becomes final unless reopened.";
    action = (
      <div className="space-y-4">
        {pendingFeedback.map(({ dispatch }) => (
          <CorrespondenceCurrentStepAction
            key={dispatch.id}
            actionLabel={`Record feedback — ${formatDispatchTargetLabel(dispatch)}`}
            summary="Open feedback when execution details are ready to submit."
          >
            <CorrespondenceDispatchFeedbackForm
              dispatchId={dispatch.id}
              feedbackReceivedAt={dispatch.feedbackReceivedAt}
              feedbackNote={dispatch.feedbackNote}
            />
          </CorrespondenceCurrentStepAction>
        ))}
        {dispatchAction.canCreateDispatch ? (
          <CorrespondenceCurrentStepAction
            actionLabel="Route to another department"
            summary="Send this correspondence to an additional department in parallel."
          >
            <CorrespondenceDispatchForm
              correspondenceId={correspondence.id}
              defaultDispatchDate={new Date()}
              departmentOptions={departmentOptions}
              assigneeOptions={assigneeOptions}
            />
          </CorrespondenceCurrentStepAction>
        ) : null}
        {canCloseNow ? (
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
        )}
      </div>
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
