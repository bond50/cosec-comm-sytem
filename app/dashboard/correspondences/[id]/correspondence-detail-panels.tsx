import Link from "next/link";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  LockKeyhole,
  MessageSquareText,
  Building2,
  Clock3,
  FileArchive,
  CalendarClock,
  FileText,
  Info,
  Printer,
  ShieldCheck,
  UserCircle2,
  Workflow,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { CorrespondenceAssignForm } from "@/app/dashboard/correspondences/[id]/correspondence-assign-form";
import { CorrespondenceAttachmentUploadForm } from "@/app/dashboard/correspondences/[id]/correspondence-attachment-upload-form";
import { CorrespondenceDispatchAcknowledgeForm } from "@/app/dashboard/correspondences/[id]/correspondence-dispatch-ack-form";
import { CorrespondenceDispatchFeedbackForm } from "@/app/dashboard/correspondences/[id]/correspondence-dispatch-feedback-form";
import { CorrespondenceDispatchForm } from "@/app/dashboard/correspondences/[id]/correspondence-dispatch-form";
import { CorrespondenceCloseForm } from "@/app/dashboard/correspondences/[id]/correspondence-close-form";
import { CorrespondenceReopenForm } from "@/app/dashboard/correspondences/[id]/correspondence-reopen-form";
import { CorrespondenceReviewForm } from "@/app/dashboard/correspondences/[id]/correspondence-review-form";
import type { CorrespondenceAuditItem } from "@/features/correspondence/queries/correspondence-audit";
import type {
  CorrespondenceAttachmentItem,
  CorrespondenceLinkedDocumentItem,
  CorrespondenceLinkedMeetingItem,
} from "@/features/correspondence/queries/correspondence-assets";
import type { CorrespondenceDetailWithSla } from "@/features/correspondence/queries/correspondence-detail";
import type { CorrespondenceDispatchItem } from "@/features/correspondence/queries/correspondence-dispatches";
import type { CorrespondenceMovementItem } from "@/features/correspondence/queries/correspondence-movements";

type CorrespondenceHeroProps = {
  correspondence: CorrespondenceDetailWithSla;
  dispatches: CorrespondenceDispatchItem[];
  organizationName: string;
};

type CorrespondenceTopSummaryStripProps = {
  correspondence: CorrespondenceDetailWithSla;
  dispatches: CorrespondenceDispatchItem[];
  movements: CorrespondenceMovementItem[];
};

type CorrespondenceSummaryCardsProps = {
  correspondence: CorrespondenceDetailWithSla;
};

type CorrespondenceRegistrationCardProps = {
  correspondence: CorrespondenceDetailWithSla;
};

type CorrespondenceReviewCardProps = {
  correspondence: CorrespondenceDetailWithSla;
  canReview: boolean;
  showForm?: boolean;
};

type CorrespondenceAssignmentCardProps = {
  correspondence: CorrespondenceDetailWithSla;
  canAssign: boolean;
  showForm?: boolean;
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

type CorrespondenceStatusCardProps = {
  correspondence: CorrespondenceDetailWithSla;
  canClose: boolean;
  showForm?: boolean;
};

type CorrespondenceDispatchCardProps = {
  correspondence: CorrespondenceDetailWithSla;
  dispatches: CorrespondenceDispatchItem[];
  canDispatch: boolean;
  showForm?: boolean;
  canWork: boolean;
  currentUserId: string;
  currentUserDepartmentId: string | null;
  registryDispatchGranted: boolean;
};

type CorrespondenceMovementCardProps = {
  movements: CorrespondenceMovementItem[];
  senderOffice: string;
  sourceType: CorrespondenceDetailWithSla["sourceType"];
  sourceDepartment: CorrespondenceDetailWithSla["sourceDepartment"];
};

type CorrespondenceAttachmentsCardProps = {
  correspondence: CorrespondenceDetailWithSla;
  attachments: CorrespondenceAttachmentItem[];
  linkedDocuments: CorrespondenceLinkedDocumentItem[];
  linkedMeetings: CorrespondenceLinkedMeetingItem[];
  canUpload: boolean;
};

type CorrespondenceAuditCardProps = {
  auditLogs: CorrespondenceAuditItem[];
};

function formatDateTime(value: Date | null | undefined) {
  if (!value) return "Not set";

  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

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

function formatAssignmentLabel(correspondence: CorrespondenceDetailWithSla) {
  const department = correspondence.assignedToDepartment?.code
    ? `${correspondence.assignedToDepartment.name} (${correspondence.assignedToDepartment.code})`
    : correspondence.assignedToDepartment?.name;
  const user =
    correspondence.assignedToUser?.name || correspondence.assignedToUser?.email;

  if (department && user) {
    return `${department} / ${user}`;
  }

  return department || user || "Unassigned";
}

function formatDueDateState(correspondence: CorrespondenceDetailWithSla) {
  if (!correspondence.dueDate) return "No due date";
  if (correspondence.isOverdue) {
    const daysOverdue = Math.abs(correspondence.daysRemaining ?? 0);

    return `Overdue by ${daysOverdue} day${daysOverdue === 1 ? "" : "s"}`;
  }
  if (correspondence.daysRemaining === 0) return "Due today";

  return `${correspondence.daysRemaining} day${
    correspondence.daysRemaining === 1 ? "" : "s"
  } remaining`;
}

function formatUserLabel(
  user: { name: string | null; email: string | null } | null | undefined,
) {
  return user?.name || user?.email || null;
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

function getCorrespondenceStatusClue(
  correspondence: CorrespondenceDetailWithSla,
  dispatches: CorrespondenceDispatchItem[],
) {
  const latestDispatch = dispatches[0] ?? null;
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
      return `Waiting for feedback from ${owner}.`;
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

function findMovementAt(
  movements: CorrespondenceMovementItem[],
  status: string,
) {
  for (let index = movements.length - 1; index >= 0; index -= 1) {
    if (movements[index].status === status) {
      return movements[index].movedAt;
    }
  }

  return null;
}

function getLatestReopenedAt(movements: CorrespondenceMovementItem[]) {
  for (let index = movements.length - 1; index >= 0; index -= 1) {
    if (movements[index].note?.startsWith("Reopened correspondence")) {
      return movements[index].movedAt;
    }
  }

  return null;
}

function getWorkflowEvents({
  correspondence,
  dispatches,
  movements,
}: {
  correspondence: CorrespondenceDetailWithSla;
  dispatches: CorrespondenceDispatchItem[];
  movements: CorrespondenceMovementItem[];
}) {
  const latestDispatch = dispatches[0] ?? null;
  const routedAt =
    findMovementAt(movements, "DISPATCHED") ??
    latestDispatch?.dispatchDate ??
    null;
  const dispatchedAt = latestDispatch?.dispatchDate ?? null;
  const acknowledgedAt = latestDispatch?.acknowledgedAt ?? null;
  const feedbackAt = latestDispatch?.feedbackReceivedAt ?? null;
  const reviewedAt = correspondence.reviewedAt;

  return [
    {
      key: "registered",
      label: "Registered",
      at: correspondence.createdAt,
      detail: "Registry intake recorded",
    },
    {
      key: "reviewed",
      label: "Reviewed",
      at: reviewedAt,
      detail:
        reviewedAt && correspondence.reviewedByUser
          ? `By ${formatUserLabel(correspondence.reviewedByUser)}`
          : "Central-office review pending",
    },
    {
      key: "routed",
      label: "Routed",
      at: routedAt,
      detail: routedAt
        ? `To ${formatAssignmentLabel(correspondence)}`
        : "Routing decision pending",
    },
    {
      key: "dispatched",
      label: "Dispatched",
      at: dispatchedAt,
      detail: dispatchedAt
        ? `To ${formatDispatchTargetLabel(latestDispatch) || "receiving office"}`
        : "Dispatch record pending",
    },
    {
      key: "acknowledged",
      label: "Acknowledged",
      at: acknowledgedAt,
      detail:
        acknowledgedAt && latestDispatch?.acknowledgedByUser
          ? `By ${formatUserLabel(latestDispatch.acknowledgedByUser)}`
          : "Receiving acknowledgement pending",
    },
    {
      key: "feedback",
      label: "Feedback",
      at: feedbackAt,
      detail: "Execution feedback from receiving office",
    },
    {
      key: "closed",
      label: "Closed",
      at: correspondence.closedAt,
      detail: "Final central-office closure",
    },
  ];
}

function getCurrentEventIndex(
  workflowEvents: ReturnType<typeof getWorkflowEvents>,
) {
  const firstPendingIndex = workflowEvents.findIndex((event) => !event.at);

  return firstPendingIndex === -1
    ? workflowEvents.length - 1
    : firstPendingIndex;
}

function getCurrentHolderLabel(
  correspondence: CorrespondenceDetailWithSla,
  dispatches: CorrespondenceDispatchItem[],
) {
  const latestDispatch = dispatches[0] ?? null;
  const dispatchTarget = formatDispatchTargetLabel(latestDispatch);
  const assignedTarget = formatAssignmentLabel(correspondence);

  if (correspondence.status === "NEW") return "County Secretary review path";
  if (correspondence.status === "UNDER_REVIEW") {
    return (
      formatUserLabel(correspondence.reviewedByUser) ||
      "County Secretary review path"
    );
  }

  return dispatchTarget || assignedTarget;
}

function getLastMovementClue(movements: CorrespondenceMovementItem[]) {
  const latestMovement = movements[movements.length - 1];

  if (!latestMovement) return "No movement history recorded yet.";

  const actor =
    latestMovement.createdByUser?.name ||
    latestMovement.createdByUser?.email ||
    "System";
  const target = getMovementTargetLabel(latestMovement);

  return `Last moved: ${latestMovement.status.replaceAll("_", " ")} to ${target} by ${actor} on ${formatDateTime(latestMovement.movedAt)}.`;
}

function getPriorityDueTone(correspondence: CorrespondenceDetailWithSla) {
  if (correspondence.isOverdue || correspondence.priority === "CRITICAL") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }
  if (
    correspondence.priority === "VERY_URGENT" ||
    correspondence.priority === "URGENT" ||
    correspondence.daysRemaining === 0
  ) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-[#bde5cf] bg-[#f0fbf5] text-[#0f6b3a]";
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

function getMovementTargetLabel(movement: CorrespondenceMovementItem) {
  const department = movement.toDepartment?.name;
  const user = movement.toUser?.name || movement.toUser?.email;

  if (department && user) {
    return `${department} / ${user}`;
  }

  return department || user || "Central office";
}

function getDispatchTargetLabel(dispatch: CorrespondenceDispatchItem) {
  const department = dispatch.dispatchedToDepartment?.name;
  const user =
    dispatch.dispatchedToUser?.name || dispatch.dispatchedToUser?.email;

  if (department && user) {
    return `${department} / ${user}`;
  }

  return department || user || "No receiving office recorded";
}

function getMovementSourceLabel(
  movement: CorrespondenceMovementItem,
  index: number,
  senderOffice: string,
  sourceType: CorrespondenceDetailWithSla["sourceType"],
  sourceDepartment: CorrespondenceDetailWithSla["sourceDepartment"],
) {
  if (index === 0) {
    if (sourceType === "INTERNAL" && sourceDepartment) {
      const label = sourceDepartment.code
        ? `${sourceDepartment.name} (${sourceDepartment.code})`
        : sourceDepartment.name;

      return `${label} (internal department)`;
    }

    return `${senderOffice} (external sender)`;
  }

  const department = movement.fromDepartment?.name;
  const user = movement.fromUser?.name || movement.fromUser?.email;

  if (department && user) {
    return `${department} / ${user}`;
  }

  return department || user || "Central office";
}

function getMovementStepLabel(
  movement: CorrespondenceMovementItem,
  index: number,
  total: number,
) {
  if (index === 0) return "Registration";
  if (movement.note?.startsWith("Reopened correspondence")) return "Reopened";
  if (movement.status === "UNDER_REVIEW") return "Review";
  if (movement.status === "DISPATCHED") {
    if (
      movement.note?.toLowerCase().includes("explicit central-office dispatch")
    ) {
      return "Dispatch issued";
    }

    return "Routing decision";
  }
  if (movement.status === "IN_PROGRESS") return "Acknowledgement";
  if (movement.status === "AWAITING_FEEDBACK") return "Feedback returned";
  if (movement.status === "COMPLETED") return "Feedback returned";
  if (movement.status === "CLOSED") return "Verification / closure";
  if (index === total - 1) return "Latest step";

  return "Office workflow step";
}

function getMovementStepIcon(
  movement: CorrespondenceMovementItem,
  index: number,
) {
  if (index === 0) return FileText;
  if (movement.status === "UNDER_REVIEW") return ShieldCheck;
  if (movement.status === "DISPATCHED") return Workflow;
  if (movement.status === "IN_PROGRESS") return CheckCircle2;
  if (movement.status === "AWAITING_FEEDBACK") return MessageSquareText;
  if (movement.status === "COMPLETED" || movement.status === "CLOSED") {
    return LockKeyhole;
  }

  return Workflow;
}
function DetailStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 space-y-1">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>
      <p className="break-words text-sm font-medium leading-6 text-slate-700">
        {value}
      </p>
    </div>
  );
}

function SectionCardTitle({
  hint,
  children,
}: {
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <CardTitle className="text-[1.05rem] text-slate-950">
        {children}
      </CardTitle>
      {hint ? <InfoTooltip text={hint} /> : null}
    </div>
  );
}

function ViewOnlyNotice({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <Alert className={cn("border-[#b7d3e6] bg-[#eef7fb]", className)}>
      <AlertDescription className="text-slate-600">{children}</AlertDescription>
    </Alert>
  );
}

export function CorrespondenceHero({
  correspondence,
  dispatches,
  organizationName,
}: CorrespondenceHeroProps) {
  const statusClue = getCorrespondenceStatusClue(correspondence, dispatches);
  const currentHolder = getCurrentHolderLabel(correspondence, dispatches);
  const priorityDueTone = getPriorityDueTone(correspondence);

  return (
    <header className="overflow-hidden rounded-2xl border border-[#a9cfe3] bg-[#eef7fb] shadow-sm">
      <div className="grid lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="border-l-4 border-[#1868a6] px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className="border-[#b7d3e6] bg-[#dff0fa] px-2.5 py-1 text-[0.68rem] font-medium uppercase tracking-[0.12em] text-[#124f7d]"
              >
                Correspondence file
              </Badge>
              <Badge
                variant="outline"
                className="border-[#bde5cf] bg-[#f0fbf5] px-2.5 py-1 text-[0.68rem] font-medium uppercase tracking-[0.12em] text-[#0f6b3a]"
              >
                {correspondence.type}
              </Badge>
              <Badge
                variant="outline"
                className={`px-2.5 py-1 text-[0.68rem] font-medium uppercase tracking-[0.12em] ${getStatusBadgeClass(
                  correspondence.status,
                )}`}
              >
                {correspondence.status.replaceAll("_", " ")}
              </Badge>
            </div>

            <div className="space-y-2">
              <h1 className="break-words text-2xl font-medium leading-tight text-slate-950">
                {correspondence.subject}
              </h1>
              <p className="break-words text-sm font-medium text-[#124f7d]">
                {correspondence.referenceNumber}
              </p>
            </div>

            <div className="rounded-xl border border-[#bde5cf] bg-[#f0fbf5] px-4 py-3">
              <div className="flex items-start gap-3">
                <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-[#0f6b3a]" />
                <p className="text-sm font-medium leading-6 text-[#0f6b3a]">
                  {statusClue}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
              <span>{organizationName}</span>
              <span className="text-slate-300">/</span>
              <span>From {correspondence.senderOffice}</span>
              <span className="text-slate-300">/</span>
              <span>Received {formatDateTime(correspondence.receivedAt)}</span>
            </div>
          </div>
        </div>

        <aside className="border-t border-[#c7ddea] bg-[#e6f1f8] px-5 py-5 lg:border-l lg:border-t-0">
          <div className="space-y-3">
            <div className="rounded-xl border border-[#bdd8e8] bg-[#f8fcff] px-4 py-3">
              <p className="text-[0.68rem] font-medium uppercase tracking-[0.12em] text-slate-500">
                Currently with
              </p>
              <p className="mt-1 break-words text-sm font-semibold leading-5 text-slate-900">
                {currentHolder}
              </p>
            </div>
            <div className="rounded-xl border border-[#bde5cf] bg-[#f0fbf5] px-4 py-3">
              <p className="text-[0.68rem] font-medium uppercase tracking-[0.12em] text-slate-500">
                Source / confidentiality
              </p>
              <p className="mt-1 break-words text-sm font-medium leading-5 text-slate-800">
                {correspondence.senderOffice} /{" "}
                {correspondence.confidentiality.replaceAll("_", " ")}
              </p>
            </div>
            <div className={`rounded-xl border px-4 py-3 ${priorityDueTone}`}>
              <div className="flex items-start gap-2">
                {correspondence.isOverdue ||
                correspondence.priority === "CRITICAL" ? (
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                ) : (
                  <CalendarClock className="mt-0.5 h-4 w-4 shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-[0.68rem] font-medium uppercase tracking-[0.12em] opacity-80">
                    Priority / due
                  </p>
                  <p className="mt-1 text-sm font-semibold leading-5">
                    {correspondence.priority.replaceAll("_", " ")} /{" "}
                    {formatDueDateState(correspondence)}
                  </p>
                  <p className="mt-1 text-xs font-medium opacity-80">
                    {formatDateTime(correspondence.dueDate)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </header>
  );
}

export function CorrespondenceTopSummaryStrip({
  correspondence,
  dispatches,
  movements,
}: CorrespondenceTopSummaryStripProps) {
  const workflowEvents = getWorkflowEvents({
    correspondence,
    dispatches,
    movements,
  });
  const currentStepIndex = getCurrentEventIndex(workflowEvents);
  const currentHolder = getCurrentHolderLabel(correspondence, dispatches);
  const lastMovementClue = getLastMovementClue(movements);
  const priorityDueTone = getPriorityDueTone(correspondence);
  const latestReopenedAt = getLatestReopenedAt(movements);

  return (
    <section className="overflow-hidden rounded-2xl border border-[#a9cfe3] bg-[#f8fcff] shadow-sm">
      <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_330px]">
        <div className="px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[0.68rem] font-medium uppercase tracking-[0.12em] text-slate-500">
                Workflow progress
              </p>
              <p className="mt-1 text-sm text-slate-600">{lastMovementClue}</p>
              {latestReopenedAt ? (
                <p className="mt-1 text-xs font-medium text-amber-700">
                  Reopened on {formatDateTime(latestReopenedAt)} — steps below
                  reflect progress since then.
                </p>
              ) : null}
            </div>
            <Badge
              variant="outline"
              className={`w-fit px-2.5 py-1 text-[0.66rem] font-medium uppercase tracking-[0.1em] ${getStatusBadgeClass(
                correspondence.status,
              )}`}
            >
              {correspondence.status.replaceAll("_", " ")}
            </Badge>
          </div>

          <ol className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]">
            {workflowEvents.map((step, index) => {
              const isDone = !!step.at && index < currentStepIndex;
              const isCurrent = index === currentStepIndex;
              const isFuture = !step.at && index > currentStepIndex;

              return (
                <li key={step.key}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        tabIndex={0}
                        className={cn(
                          "flex min-w-[140px] cursor-default items-center gap-2 rounded-xl border px-3 py-2.5 outline-none",
                          isCurrent && "border-[#1868a6] bg-[#e6f1f8]",
                          isDone && "border-[#bde5cf] bg-[#f0fbf5]",
                          isFuture && "border-slate-200 bg-slate-50",
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[0.68rem] font-semibold",
                            isCurrent &&
                              "border-[#1868a6] bg-[#1868a6] text-white",
                            isDone &&
                              "border-[#0f8a4b] bg-[#e7f6ee] text-[#0f6b3a]",
                            isFuture &&
                              "border-slate-200 bg-white text-slate-400",
                          )}
                        >
                          {step.at ? (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          ) : (
                            index + 1
                          )}
                        </span>
                        <span
                          className={cn(
                            "truncate text-sm font-medium leading-5",
                            isCurrent && "text-[#124f7d]",
                            isDone && "text-[#0f6b3a]",
                            isFuture && "text-slate-500",
                          )}
                        >
                          {step.label}
                        </span>
                        <Info className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-semibold text-white">
                        {step.at ? formatDateTime(step.at) : "Pending"}
                      </p>
                      <p className="mt-1 text-slate-300">{step.detail}</p>
                    </TooltipContent>
                  </Tooltip>
                </li>
              );
            })}
          </ol>
        </div>

        <aside className="border-t border-[#c7ddea] bg-[#eef7fb] px-4 py-4 sm:px-5 lg:border-l lg:border-t-0">
          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-xl border border-[#bdd8e8] bg-[#f8fcff] px-3.5 py-3">
              <UserCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#1868a6]" />
              <div className="min-w-0">
                <p className="text-[0.68rem] font-medium uppercase tracking-[0.12em] text-slate-500">
                  Currently with
                </p>
                <p className="mt-1 break-words text-sm font-medium leading-5 text-slate-800">
                  {currentHolder}
                </p>
              </div>
            </div>
            <div
              className={`flex items-start gap-3 rounded-xl border px-3.5 py-3 ${priorityDueTone}`}
            >
              <CalendarClock className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="min-w-0">
                <p className="text-[0.68rem] font-medium uppercase tracking-[0.12em] opacity-80">
                  Priority / due
                </p>
                <p className="mt-1 text-sm font-semibold leading-5">
                  {correspondence.priority.replaceAll("_", " ")} /{" "}
                  {formatDueDateState(correspondence)}
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

export function CorrespondenceSummaryCards({
  correspondence,
}: CorrespondenceSummaryCardsProps) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Card className="rounded-2xl border-[#c7ddea] bg-[#fbfdff] shadow-sm">
        <CardContent className="flex items-center justify-between px-5 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Receiving office
            </p>
            <p className="mt-2 text-base font-semibold text-slate-950">
              {correspondence.assignedToDepartment?.name || "Unassigned"}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {correspondence.assignedToUser?.name ||
                correspondence.assignedToUser?.email ||
                "No named receiving officer"}
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e6f1f8] text-[#1868a6]">
            <Building2 className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-[#c7ddea] bg-[#fbfdff] shadow-sm">
        <CardContent className="flex items-center justify-between px-5 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Deadline state
            </p>
            <p className="mt-2 text-base font-semibold text-slate-950">
              {correspondence.isOverdue
                ? "Overdue"
                : correspondence.daysRemaining === null
                  ? "No due date"
                  : correspondence.daysRemaining === 0
                    ? "Due today"
                    : "On track"}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {correspondence.daysRemaining === null
                ? "Set a due date before dispatch."
                : `${correspondence.daysRemaining} day${correspondence.daysRemaining === 1 ? "" : "s"} remaining`}
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e6f1f8] text-[#1868a6]">
            <Clock3 className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-[#c7ddea] bg-[#fbfdff] shadow-sm">
        <CardContent className="flex items-center justify-between px-5 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Movement trail
            </p>
            <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
              {correspondence._count.movements}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Recorded intake, dispatch, feedback, and closure events
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e6f1f8] text-[#1868a6]">
            <Workflow className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-[#c7ddea] bg-[#fbfdff] shadow-sm">
        <CardContent className="flex items-center justify-between px-5 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Supporting files + audit
            </p>
            <p className="mt-2 text-base font-semibold text-slate-950">
              {correspondence._count.attachments} files /{" "}
              {correspondence._count.auditLogs} log entries
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Documents: {correspondence._count.documents}
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e6f1f8] text-[#1868a6]">
            <ShieldCheck className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

export function CorrespondenceRegistrationCard({
  correspondence,
}: CorrespondenceRegistrationCardProps) {
  return (
    <Card className="rounded-2xl border-[#c7ddea] bg-[#fbfdff] shadow-sm">
      <CardHeader className="px-6 py-5">
        <SectionCardTitle hint="Who sent this item, how it arrived, and who received it. Reference, type, source office, and received-at are already shown above.">
          Intake registration
        </SectionCardTitle>
      </CardHeader>
      <CardContent className="grid gap-5 px-6 pb-6 sm:grid-cols-2">
        <DetailStat label="Sender" value={correspondence.senderName} />
        <DetailStat
          label="Source"
          value={
            correspondence.sourceType === "INTERNAL" &&
            correspondence.sourceDepartment
              ? `${
                  correspondence.sourceDepartment.code
                    ? `${correspondence.sourceDepartment.name} (${correspondence.sourceDepartment.code})`
                    : correspondence.sourceDepartment.name
                } · Internal county office`
              : `${correspondence.senderOffice} · External sender`
          }
        />
        <DetailStat
          label="Delivered by"
          value={correspondence.deliveredBy || "Not recorded"}
        />
        <DetailStat
          label="Delivery method"
          value={
            correspondence.deliveryMethod === "OTHER" &&
            correspondence.deliveryMethodOther
              ? correspondence.deliveryMethodOther
              : correspondence.deliveryMethod.replaceAll("_", " ")
          }
        />
        <DetailStat
          label="Received by"
          value={
            correspondence.receivedByUser?.name ||
            correspondence.receivedByUser?.email ||
            "Not recorded"
          }
        />
        <div className="space-y-1 sm:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            Description
          </p>
          <p className="text-sm leading-6 text-slate-700">
            {correspondence.description ||
              "No registration description provided."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function CorrespondenceReviewCard({
  correspondence,
  canReview,
  showForm = true,
}: CorrespondenceReviewCardProps) {
  const canReviewNow =
    canReview &&
    (correspondence.status === "NEW" ||
      correspondence.status === "UNDER_REVIEW" ||
      correspondence.status === "DISPATCHED" ||
      correspondence.status === "IN_PROGRESS" ||
      correspondence.status === "AWAITING_FEEDBACK");

  return (
    <Card className="rounded-2xl border-[#c7ddea] bg-[#fbfdff] shadow-sm">
      <CardHeader className="px-6 py-5">
        <SectionCardTitle hint="The Reviewing Officer or County Secretary reads the item and sets instructions here first. These instructions aren't addressed to anyone yet — the routing decision below determines which department and officer will see them.">
          Review & central-office instructions
        </SectionCardTitle>
      </CardHeader>
      <CardContent className="grid gap-5 px-6 pb-6 sm:grid-cols-2">
        {correspondence.instructions ? (
          <div className="rounded-2xl border border-brand-border bg-brand-soft px-4 py-4 sm:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand">
              Instructions
            </p>
            <p className="mt-1.5 text-sm leading-6 font-medium text-slate-900">
              {correspondence.instructions}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Travels with the record — visible to whoever this is routed to
              next.
            </p>
          </div>
        ) : (
          <div className="space-y-1 sm:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Instructions
            </p>
            <p className="text-sm leading-6 text-slate-700">
              No instructions have been recorded for this correspondence yet.
            </p>
          </div>
        )}
        <DetailStat
          label="Reviewed at"
          value={formatDateTime(correspondence.reviewedAt)}
        />
        <DetailStat
          label="Reviewed by"
          value={
            correspondence.reviewedByUser?.name ||
            correspondence.reviewedByUser?.email ||
            "Pending review"
          }
        />
        {showForm ? (
          canReviewNow ? (
            <CorrespondenceReviewForm
              correspondenceId={correspondence.id}
              instructions={correspondence.instructions}
            />
          ) : (
            <ViewOnlyNotice className="sm:col-span-2">
              {canReview
                ? "Reopen this record to review again."
                : "View only - review is restricted to review-authorized roles."}
            </ViewOnlyNotice>
          )
        ) : null}
      </CardContent>
    </Card>
  );
}

export function CorrespondenceAssignmentCard({
  correspondence,
  canAssign,
  showForm = true,
  departmentOptions,
  assigneeOptions,
}: CorrespondenceAssignmentCardProps) {
  const canAssignNow = canAssign && correspondence.status === "UNDER_REVIEW";

  return (
    <Card className="rounded-2xl border-[#c7ddea] bg-[#fbfdff] shadow-sm">
      <CardHeader className="px-6 py-5">
        <SectionCardTitle hint="Which execution department this item is routed to, and who is expected to act on it there.">
          Routing decision
        </SectionCardTitle>
      </CardHeader>
      <CardContent className="grid gap-5 px-6 pb-6 sm:grid-cols-2">
        <DetailStat
          label="Receiving department"
          value={
            correspondence.assignedToDepartment
              ? correspondence.assignedToDepartment.code
                ? `${correspondence.assignedToDepartment.name} (${correspondence.assignedToDepartment.code})`
                : correspondence.assignedToDepartment.name
              : "Unassigned"
          }
        />
        <DetailStat
          label="Receiving officer"
          value={
            correspondence.assignedToUser?.name ||
            correspondence.assignedToUser?.email ||
            "No named receiving officer"
          }
        />
        <DetailStat
          label="Routed by"
          value={
            correspondence.assignedByUser?.name ||
            correspondence.assignedByUser?.email ||
            "Not recorded"
          }
        />
        {showForm ? (
          canAssignNow ? (
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
          ) : (
            <ViewOnlyNotice className="sm:col-span-2">
              {canAssign
                ? "Available once review moves this record to Under Review."
                : "View only - routing is restricted to central-office roles."}
            </ViewOnlyNotice>
          )
        ) : null}
      </CardContent>
    </Card>
  );
}

export function CorrespondenceDispatchCard({
  correspondence,
  dispatches,
  canDispatch,
  showForm = true,
  canWork,
  currentUserId,
  currentUserDepartmentId,
  registryDispatchGranted,
}: CorrespondenceDispatchCardProps) {
  const {
    latestDispatch,
    canCreateDispatch,
    canAcknowledge,
    canRecordFeedback,
  } = getDispatchActionState({
    correspondence,
    dispatches,
    canDispatch,
    canWork,
    currentUserId,
    currentUserDepartmentId,
  });

  return (
    <Card className="rounded-2xl border-[#c7ddea] bg-[#fbfdff] shadow-sm">
      <CardHeader className="px-6 py-5">
        <SectionCardTitle hint="Tracks when the record was sent to the department, when it was acknowledged, and when feedback came back.">
          Dispatch, execution & feedback
        </SectionCardTitle>
      </CardHeader>
      <CardContent className="space-y-4 px-6 pb-6">
        {registryDispatchGranted ? (
          <Alert className="border-indigo-200 bg-indigo-50">
            <AlertDescription className="text-indigo-700">
              Admin also granted this registry member central-office dispatch
              authority.
            </AlertDescription>
          </Alert>
        ) : null}

        {dispatches.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#b7d3e6] bg-[#eef7fb] px-4 py-5 text-sm text-slate-500">
            No dispatch record yet.
          </div>
        ) : (
          dispatches.map((dispatch) => (
            <div
              key={dispatch.id}
              className="space-y-4 rounded-2xl border border-[#c7ddea] bg-[#eef7fb] px-4 py-4"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <Badge
                    variant="outline"
                    className="border-indigo-200 bg-indigo-50 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-indigo-700"
                  >
                    {dispatch.status.replaceAll("_", " ")}
                  </Badge>
                  <p className="text-sm text-slate-700">
                    {dispatch.note || "No dispatch note recorded."}
                  </p>
                </div>
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-400">
                  {formatDateTime(dispatch.dispatchDate)}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <DetailStat
                  label="Receiving office"
                  value={getDispatchTargetLabel(dispatch)}
                />
                <DetailStat
                  label="Receipt confirmed"
                  value={formatDateTime(dispatch.acknowledgedAt)}
                />
                <DetailStat
                  label="Feedback returned"
                  value={formatDateTime(dispatch.feedbackReceivedAt)}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <DetailStat
                  label="Dispatch recorded by"
                  value={
                    dispatch.createdByUser?.name ||
                    dispatch.createdByUser?.email ||
                    "System"
                  }
                />
                <DetailStat
                  label="Receipt confirmed by"
                  value={
                    dispatch.acknowledgedByUser?.name ||
                    dispatch.acknowledgedByUser?.email ||
                    "Pending acknowledgement"
                  }
                />
              </div>
              {dispatch.feedbackNote ? (
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Feedback response
                  </p>
                  <p className="text-sm leading-6 text-slate-700">
                    {dispatch.feedbackNote}
                  </p>
                </div>
              ) : null}
            </div>
          ))
        )}

        {showForm ? (
          <>
            {canCreateDispatch ? (
              <CorrespondenceDispatchForm
                correspondenceId={correspondence.id}
                defaultDispatchDate={new Date()}
              />
            ) : null}

            {canAcknowledge && latestDispatch ? (
              <CorrespondenceDispatchAcknowledgeForm
                dispatchId={latestDispatch.id}
                acknowledgedAt={latestDispatch.acknowledgedAt}
              />
            ) : null}

            {canRecordFeedback && latestDispatch ? (
              <CorrespondenceDispatchFeedbackForm
                dispatchId={latestDispatch.id}
                feedbackReceivedAt={latestDispatch.feedbackReceivedAt}
                feedbackNote={latestDispatch.feedbackNote}
              />
            ) : null}

            {!canCreateDispatch && !canAcknowledge && !canRecordFeedback ? (
              <ViewOnlyNotice>
                {!canDispatch && !canWork
                  ? "View only - dispatch, acknowledgement, and feedback are role-restricted."
                  : latestDispatch
                    ? "No further action available on the latest dispatch."
                    : "Available once routing is saved."}
              </ViewOnlyNotice>
            ) : null}
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function CorrespondenceStatusCard({
  correspondence,
  canClose,
  showForm = true,
}: CorrespondenceStatusCardProps) {
  const canCloseNow =
    canClose &&
    correspondence.status !== "CANCELLED" &&
    correspondence.status !== "CLOSED";
  const canReopenNow =
    canClose &&
    (correspondence.status === "CANCELLED" ||
      correspondence.status === "CLOSED");

  return (
    <Card className="rounded-2xl border-[#c7ddea] bg-[#fbfdff] shadow-sm">
      <CardHeader className="px-6 py-5">
        <SectionCardTitle hint="Workflow stage and priority are shown in the badges above; this section covers the due date and, once final, when the record was verified or closed.">
          Verification & closure
        </SectionCardTitle>
      </CardHeader>
      <CardContent className="grid gap-5 px-6 pb-6 sm:grid-cols-2">
        <DetailStat
          label="Due date"
          value={formatDateTime(correspondence.dueDate)}
        />
        <DetailStat
          label="Verified/closed at"
          value={formatDateTime(correspondence.closedAt)}
        />
        {showForm ? (
          canCloseNow ? (
            <CorrespondenceCloseForm correspondenceId={correspondence.id} />
          ) : canReopenNow ? (
            <CorrespondenceReopenForm correspondenceId={correspondence.id} />
          ) : (
            <ViewOnlyNotice className="sm:col-span-2">
              {canClose
                ? "Already in a final state."
                : "View only - closure is restricted to central-office roles."}
            </ViewOnlyNotice>
          )
        ) : null}
      </CardContent>
    </Card>
  );
}

export function CorrespondenceMovementCard({
  movements,
  senderOffice,
  sourceType,
  sourceDepartment,
}: CorrespondenceMovementCardProps) {
  const currentStatus = movements[movements.length - 1]?.status ?? "NEW";

  return (
    <Card className="rounded-2xl border-[#c7ddea] bg-[#fbfdff] shadow-sm">
      <CardHeader className="px-6 py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SectionCardTitle hint="Every step this record has moved through: registration, review, dispatch, feedback, and closure - in order.">
            Movement history
          </SectionCardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className={`w-fit px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.12em] ${getStatusBadgeClass(
                currentStatus,
              )}`}
            >
              Latest: {currentStatus.replaceAll("_", " ")}
            </Badge>
            <Badge
              variant="outline"
              className="border-[#b7d3e6] bg-[#eef7fb] px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[#1868a6]"
            >
              {movements.length} recorded step
              {movements.length === 1 ? "" : "s"}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        {movements.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#b7d3e6] bg-[#eef7fb] px-4 py-6 text-sm text-slate-500">
            No movement beyond registration yet.
          </div>
        ) : (
          <ol className="relative space-y-0">
            {movements.map((movement, index) => {
              const isLast = index === movements.length - 1;
              const StepIcon = getMovementStepIcon(movement, index);
              const stepLabel = getMovementStepLabel(
                movement,
                index,
                movements.length,
              );
              const stepStatusLabel =
                (movement.status === "COMPLETED" ||
                  movement.status === "AWAITING_FEEDBACK") &&
                stepLabel === "Feedback returned"
                  ? "FEEDBACK RETURNED"
                  : movement.status.replaceAll("_", " ");
              const stepMeta = `${stepStatusLabel} - ${formatDateTime(
                movement.movedAt,
              )}`;
              const movementDetails = (
                <>
                  <p className="text-sm leading-6 text-slate-700">
                    {movement.note || "No movement note recorded."}
                  </p>
                  <div className="mt-4 grid gap-3 rounded-lg border border-[#c7ddea] bg-[#fbfdff]/90 p-3 md:grid-cols-3">
                    <DetailStat
                      label="From"
                      value={getMovementSourceLabel(
                        movement,
                        index,
                        senderOffice,
                        sourceType,
                        sourceDepartment,
                      )}
                    />
                    <DetailStat
                      label="To"
                      value={getMovementTargetLabel(movement)}
                    />
                    <DetailStat
                      label="Recorded by"
                      value={
                        movement.createdByUser?.name ||
                        movement.createdByUser?.email ||
                        "System"
                      }
                    />
                  </div>
                </>
              );

              return (
                <li
                  key={movement.id}
                  className="relative grid grid-cols-[36px_minmax(0,1fr)] gap-4 pb-5 last:pb-0"
                >
                  <div className="relative flex justify-center">
                    {!isLast ? (
                      <div className="absolute top-9 h-[calc(100%-1rem)] w-px bg-[#bde5cf]" />
                    ) : null}
                    <div
                      className={cn(
                        "relative z-10 mt-1 flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold shadow-sm",
                        isLast
                          ? "border-[#1868a6] bg-[#1868a6] text-white"
                          : "border-[#0f8a4b] bg-[#e7f6ee] text-[#0f6b3a]",
                      )}
                    >
                      {isLast ? (
                        <StepIcon className="h-4 w-4" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                    </div>
                  </div>

                  {isLast ? (
                    <div className="min-w-0 rounded-xl border border-[#c7ddea] bg-[#e6f1f8] px-4 py-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold text-slate-950">
                              {stepLabel}
                            </span>
                            <Badge
                              variant="outline"
                              className={`px-2.5 py-1 text-[0.66rem] font-semibold uppercase tracking-[0.12em] ${getStatusBadgeClass(
                                movement.status,
                              )}`}
                            >
                              {stepStatusLabel}
                            </Badge>
                          </div>
                          {movementDetails}
                        </div>

                        <p className="shrink-0 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 sm:text-right">
                          {formatDateTime(movement.movedAt)}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <details className="group min-w-0 rounded-xl border border-[#bde5cf] bg-[#f0fbf5] px-4 py-3">
                      <summary className="flex cursor-pointer list-none flex-col gap-2 sm:flex-row sm:items-center sm:justify-between [&::-webkit-details-marker]:hidden">
                        <span className="flex min-w-0 items-center gap-2">
                          <StepIcon className="h-4 w-4 shrink-0 text-[#0f6b3a]" />
                          <span className="truncate text-sm font-semibold text-slate-950">
                            {stepLabel}
                          </span>
                          <span className="hidden text-xs font-medium text-[#0f6b3a] sm:inline">
                            Completed
                          </span>
                        </span>
                        <span className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
                          {stepMeta}
                        </span>
                      </summary>
                      <div className="mt-4 border-t border-[#bde5cf] pt-4">
                        {movementDetails}
                      </div>
                    </details>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
export function CorrespondenceAttachmentsCard({
  correspondence,
  attachments,
  linkedDocuments,
  linkedMeetings,
  canUpload,
}: CorrespondenceAttachmentsCardProps) {
  return (
    <Card className="rounded-2xl border-[#c7ddea] bg-[#fbfdff] shadow-sm">
      <CardHeader className="px-6 py-5">
        <SectionCardTitle hint="Files uploaded directly to this record, plus any document or dispatch records linked to it.">
          Attachments & documents
        </SectionCardTitle>
      </CardHeader>
      <CardContent className="space-y-4 px-6 pb-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-[#c7ddea] bg-[#eef7fb] px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Attachments
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">
              {correspondence._count.attachments}
            </p>
          </div>
          <div className="rounded-2xl border border-[#c7ddea] bg-[#eef7fb] px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Documents
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">
              {correspondence._count.documents}
            </p>
          </div>
          <div className="rounded-2xl border border-[#c7ddea] bg-[#eef7fb] px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Dispatch records
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">
              {correspondence._count.dispatches}
            </p>
          </div>
        </div>
        {canUpload ? (
          <CorrespondenceAttachmentUploadForm
            correspondenceId={correspondence.id}
          />
        ) : (
          <ViewOnlyNotice>
            View only — closed, cancelled, or upload-restricted role.
          </ViewOnlyNotice>
        )}

        {attachments.length === 0 &&
        linkedDocuments.length === 0 &&
        linkedMeetings.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#b7d3e6] bg-[#fbfdff] px-4 py-5 text-sm text-slate-500">
            No files, linked documents, or meetings recorded yet.
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {attachments.length > 0 ? (
              <div className="rounded-2xl border border-[#c7ddea] bg-[#eef7fb] px-4 py-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">
                      Attached files
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="border-[#b7d3e6] bg-[#eef7fb] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[#1868a6]"
                  >
                    {attachments.length} file
                    {attachments.length === 1 ? "" : "s"}
                  </Badge>
                </div>

                <div className="space-y-3">
                  {attachments.map((attachment) => (
                    <a
                      key={attachment.id}
                      href={`/api/attachments/${attachment.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-start justify-between rounded-xl border border-[#c7ddea] bg-[#fbfdff] px-4 py-4 transition hover:bg-[#eef7fb]"
                    >
                      <div className="min-w-0 space-y-1">
                        <p className="truncate text-sm font-semibold text-slate-950">
                          {attachment.originalName}
                        </p>
                        <p className="text-xs text-slate-500">
                          {attachment.mimeType} ·{" "}
                          {Math.max(1, Math.round(attachment.fileSize / 1024))}{" "}
                          KB
                        </p>
                        <p className="text-xs text-slate-500">
                          Uploaded {formatDateTime(attachment.createdAt)} by{" "}
                          {attachment.uploadedByUser?.name ||
                            attachment.uploadedByUser?.email ||
                            "System"}
                        </p>
                      </div>
                      <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
                    </a>
                  ))}
                </div>
              </div>
            ) : null}

            {linkedDocuments.length > 0 ? (
              <div className="rounded-2xl border border-[#c7ddea] bg-[#eef7fb] px-4 py-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">
                      Linked documents
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="border-[#b7d3e6] bg-[#eef7fb] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[#1868a6]"
                  >
                    {linkedDocuments.length} linked
                  </Badge>
                </div>

                <div className="space-y-3">
                  {linkedDocuments.map((document) => (
                    <Link
                      key={document.id}
                      href={`/dashboard/documents/${document.id}`}
                      className="block rounded-xl border border-[#c7ddea] bg-[#fbfdff] px-4 py-4 transition hover:bg-[#eef7fb]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 space-y-1">
                          <p className="truncate text-sm font-semibold text-slate-950">
                            {document.title}
                          </p>
                          <p className="text-xs text-slate-500">
                            {document.referenceNumber ||
                              "No document reference"}{" "}
                            · {document.status.replaceAll("_", " ")}
                          </p>
                          <p className="text-xs text-slate-500">
                            {document.currentLocation || "No current location"}{" "}
                            · Linked {formatDateTime(document.createdAt)}
                          </p>
                        </div>
                        <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}

            {linkedMeetings.length > 0 ? (
              <div className="rounded-2xl border border-[#c7ddea] bg-[#eef7fb] px-4 py-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">
                      Linked meetings
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="border-[#b7d3e6] bg-[#eef7fb] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[#1868a6]"
                  >
                    {linkedMeetings.length} linked
                  </Badge>
                </div>

                <div className="space-y-3">
                  {linkedMeetings.map((meeting) => (
                    <Link
                      key={meeting.id}
                      href={`/dashboard/meetings/${meeting.id}`}
                      className="block rounded-xl border border-[#c7ddea] bg-[#fbfdff] px-4 py-4 transition hover:bg-[#eef7fb]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 space-y-1">
                          <p className="truncate text-sm font-semibold text-slate-950">
                            {meeting.title}
                          </p>
                          <p className="text-xs text-slate-500">
                            {meeting.status.replaceAll("_", " ")} ·{" "}
                            {formatDateTime(meeting.startsAt)}
                          </p>
                          <p className="text-xs text-slate-500">
                            {meeting._count.actionPoints} action point
                            {meeting._count.actionPoints === 1 ? "" : "s"}
                          </p>
                        </div>
                        <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function CorrespondenceAuditCard({
  auditLogs,
}: CorrespondenceAuditCardProps) {
  return (
    <Card className="rounded-2xl border-[#c7ddea] bg-[#fbfdff] shadow-sm">
      <CardHeader className="px-6 py-5">
        <SectionCardTitle hint="A full log of who did what and when, for accountability and audit purposes.">
          Accountability summary
        </SectionCardTitle>
      </CardHeader>
      <CardContent className="space-y-4 px-6 pb-6">
        {auditLogs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
            No audit entries yet.
          </div>
        ) : (
          auditLogs.map((auditLog) => (
            <div
              key={auditLog.id}
              className="rounded-2xl border border-[#c7ddea] bg-[#eef7fb] px-4 py-4"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-950">
                    {auditLog.action.replaceAll("_", " ")}
                  </p>
                  <p className="text-sm text-slate-600">
                    {auditLog.message || "No audit message recorded."}
                  </p>
                  <p className="text-xs text-slate-500">
                    {auditLog.actorUser?.name ||
                      auditLog.actorUser?.email ||
                      "System actor"}
                  </p>
                </div>
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-400">
                  {formatDateTime(auditLog.createdAt)}
                </p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export function CorrespondenceActionLink({
  href,
  icon,
  label,
  description,
}: {
  href: string;
  icon: "list" | "register" | "member" | "print";
  label: string;
  description: string;
}) {
  const Icon =
    icon === "register"
      ? FileArchive
      : icon === "print"
        ? Printer
        : icon === "member"
          ? UserCircle2
          : FileText;

  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-2xl border border-[#c7ddea] bg-[#fbfdff] px-4 py-4 transition hover:bg-[#eef7fb]"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e6f1f8] text-[#1868a6]">
          <Icon className="h-4.5 w-4.5" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-950">{label}</p>
          <p className="text-sm leading-6 text-slate-600">{description}</p>
        </div>
      </div>
      <ArrowRight className="h-4 w-4 text-slate-400" />
    </Link>
  );
}
