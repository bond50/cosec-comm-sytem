import Link from "next/link";
import { CorrespondencePrintActions } from "@/app/dashboard/correspondences/[id]/correspondence-print-actions";
import type { CorrespondenceAuditItem } from "@/features/correspondence/queries/correspondence-audit";
import type { CorrespondenceDetailWithSla } from "@/features/correspondence/queries/correspondence-detail";
import type { CorrespondenceDispatchItem } from "@/features/correspondence/queries/correspondence-dispatches";
import type { CorrespondenceMovementItem } from "@/features/correspondence/queries/correspondence-movements";

type CorrespondencePrintViewProps = {
  organizationName: string;
  correspondence: CorrespondenceDetailWithSla;
  movements: CorrespondenceMovementItem[];
  dispatches: CorrespondenceDispatchItem[];
  auditLogs: CorrespondenceAuditItem[];
};

function formatDateTime(value: Date | null | undefined) {
  if (!value) return "Not set";

  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 border-b border-slate-200 py-3 sm:grid-cols-[180px_minmax(0,1fr)]">
      <div className="text-sm font-semibold text-slate-600">{label}</div>
      <div className="text-sm leading-6 text-slate-900">{value}</div>
    </div>
  );
}

export function CorrespondencePrintView({
  organizationName,
  correspondence,
  movements,
  dispatches,
  auditLogs,
}: CorrespondencePrintViewProps) {
  return (
    <div className="mx-auto max-w-4xl px-6 py-8 text-slate-900 print:max-w-none print:px-0 print:py-0">
      <div className="print:hidden">
        <Link
          href={`/dashboard/correspondences/${correspondence.id}`}
          className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Back to detail
        </Link>
      </div>

      <CorrespondencePrintActions />

      <div className="rounded-2xl border border-slate-200 bg-white px-8 py-8 shadow-sm print:rounded-none print:border-0 print:p-0 print:shadow-none">
        <header className="border-b border-slate-200 pb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
            Correspondence office copy
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950">
            {correspondence.subject}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {organizationName} • {correspondence.referenceNumber}
          </p>
        </header>

        <section className="mt-8">
          <h2 className="text-lg font-semibold text-slate-950">
            Registration summary
          </h2>
          <div className="mt-4">
            <DetailRow
              label="Reference number"
              value={correspondence.referenceNumber}
            />
            <DetailRow label="Type" value={correspondence.type} />
            <DetailRow
              label="Workflow stage"
              value={correspondence.status.replaceAll("_", " ")}
            />
            <DetailRow
              label="Priority"
              value={correspondence.priority.replaceAll("_", " ")}
            />
            <DetailRow
              label="Confidentiality"
              value={correspondence.confidentiality.replaceAll("_", " ")}
            />
            <DetailRow label="Sender name" value={correspondence.senderName} />
            <DetailRow
              label="Sender office"
              value={correspondence.senderOffice}
            />
            <DetailRow
              label="Delivered by"
              value={correspondence.deliveredBy || "Not recorded"}
            />
            <DetailRow
              label="Delivery method"
              value={
                correspondence.deliveryMethod === "OTHER" &&
                correspondence.deliveryMethodOther
                  ? correspondence.deliveryMethodOther
                  : correspondence.deliveryMethod.replaceAll("_", " ")
              }
            />
            <DetailRow
              label="Received at"
              value={formatDateTime(correspondence.receivedAt)}
            />
            <DetailRow
              label="Received by"
              value={
                correspondence.receivedByUser?.name ||
                correspondence.receivedByUser?.email ||
                "Not recorded"
              }
            />
            <DetailRow
              label="Description"
              value={correspondence.description || "No description provided."}
            />
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-semibold text-slate-950">
            Review and routing
          </h2>
          <div className="mt-4">
            <DetailRow
              label="Reviewed at"
              value={formatDateTime(correspondence.reviewedAt)}
            />
            <DetailRow
              label="Reviewed by"
              value={
                correspondence.reviewedByUser?.name ||
                correspondence.reviewedByUser?.email ||
                "Pending review"
              }
            />
            <DetailRow
              label="Instructions"
              value={correspondence.instructions || "No instructions recorded."}
            />
            <DetailRow
              label="Receiving department"
              value={correspondence.assignedToDepartment?.name || "Unassigned"}
            />
            <DetailRow
              label="Receiving officer"
              value={
                correspondence.assignedToUser?.name ||
                correspondence.assignedToUser?.email ||
                "No named receiving officer"
              }
            />
            <DetailRow
              label="Routed by"
              value={
                correspondence.assignedByUser?.name ||
                correspondence.assignedByUser?.email ||
                "Not recorded"
              }
            />
            <DetailRow
              label="Due date"
              value={formatDateTime(correspondence.dueDate)}
            />
            <DetailRow
              label="Verified/closed at"
              value={formatDateTime(correspondence.closedAt)}
            />
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-semibold text-slate-950">
            Dispatch history
          </h2>
          <div className="mt-4 space-y-4">
            {dispatches.length ? (
              dispatches.map((dispatch) => (
                <div
                  key={dispatch.id}
                  className="rounded-xl border border-slate-200 px-4 py-4"
                >
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="text-sm text-slate-700">
                      <span className="font-semibold text-slate-950">
                        Status:
                      </span>{" "}
                      {dispatch.status.replaceAll("_", " ")}
                    </div>
                    <div className="text-sm text-slate-700">
                      <span className="font-semibold text-slate-950">
                        Dispatch date:
                      </span>{" "}
                      {formatDateTime(dispatch.dispatchDate)}
                    </div>
                    <div className="text-sm text-slate-700">
                      <span className="font-semibold text-slate-950">
                        Receiving office:
                      </span>{" "}
                      {dispatch.dispatchedToDepartment?.name ||
                        dispatch.dispatchedToUser?.name ||
                        dispatch.dispatchedToUser?.email ||
                        "Not recorded"}
                    </div>
                    <div className="text-sm text-slate-700">
                      <span className="font-semibold text-slate-950">
                        Acknowledged:
                      </span>{" "}
                      {formatDateTime(dispatch.acknowledgedAt)}
                    </div>
                    <div className="text-sm text-slate-700">
                      <span className="font-semibold text-slate-950">
                        Feedback received:
                      </span>{" "}
                      {formatDateTime(dispatch.feedbackReceivedAt)}
                    </div>
                    <div className="text-sm text-slate-700">
                      <span className="font-semibold text-slate-950">
                        Created by:
                      </span>{" "}
                      {dispatch.createdByUser?.name ||
                        dispatch.createdByUser?.email ||
                        "System"}
                    </div>
                  </div>
                  <div className="mt-3 text-sm leading-6 text-slate-700">
                    {dispatch.note ||
                      dispatch.feedbackNote ||
                      "No dispatch note recorded."}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-600">
                No dispatch records have been created.
              </p>
            )}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-semibold text-slate-950">
            Movement timeline
          </h2>
          <div className="mt-4 space-y-3">
            {movements.length ? (
              movements.map((movement, index) => (
                <div
                  key={movement.id}
                  className="rounded-xl border border-slate-200 px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">
                        Step {index + 1} •{" "}
                        {movement.status.replaceAll("_", " ")}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-700">
                        {movement.note || "No movement note recorded."}
                      </p>
                    </div>
                    <p className="text-sm text-slate-500">
                      {formatDateTime(movement.movedAt)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-600">
                No movement entries are recorded beyond registration.
              </p>
            )}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-semibold text-slate-950">
            Accountability summary
          </h2>
          <div className="mt-4 space-y-3">
            {auditLogs.length ? (
              auditLogs.map((auditLog) => (
                <div
                  key={auditLog.id}
                  className="rounded-xl border border-slate-200 px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">
                        {auditLog.action.replaceAll("_", " ")}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-700">
                        {auditLog.message || "No audit message recorded."}
                      </p>
                    </div>
                    <p className="text-sm text-slate-500">
                      {formatDateTime(auditLog.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-600">
                No audit entries are available for this correspondence.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
