import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MeetingActionPointCreateForm } from "@/app/dashboard/meetings/[id]/meeting-action-point-create-form";
import { MeetingActionPointUpdateForm } from "@/app/dashboard/meetings/[id]/meeting-action-point-update-form";
import { MeetingAttachmentUploadForm } from "@/app/dashboard/meetings/[id]/meeting-attachment-upload-form";
import { MeetingEditForm } from "@/app/dashboard/meetings/[id]/meeting-edit-form";
import { MeetingPrintView } from "@/app/dashboard/meetings/[id]/meeting-print-view";
import {
  getMeetingActionPointAuditLogs,
  getMeetingCreateOptions,
  getMeetingDetail,
} from "@/features/meetings/queries/meetings";
import { requirePagePermission } from "@/features/auth/utils/require-organization-permission";
import { hasFoundationPermission } from "@/features/auth/utils/role-access";
import { getActiveMembershipByUserId } from "@/features/application/queries/memberships";
import { formatUserLabel } from "@/features/application/lib/user-label";

function formatDateTime(value: Date | null | undefined) {
  if (!value) return "Not recorded";

  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function getMeetingStatusLabel(status: string) {
  switch (status) {
    case "ACTION_POINTS_ISSUED":
      return "Action points issued";
    case "CLOSED":
      return "Closed";
    default:
      return status.replaceAll("_", " ");
  }
}

export default async function MeetingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ print?: string }>;
}) {
  const access = await requirePagePermission("meetings.view");
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const [meeting, createOptions] = await Promise.all([
    getMeetingDetail(access.organization.id, id),
    getMeetingCreateOptions(access.organization.id),
  ]);

  if (!meeting) {
    notFound();
  }

  if (resolvedSearchParams?.print === "1") {
    return (
      <MeetingPrintView
        organizationName={access.organization.name}
        meeting={meeting}
      />
    );
  }

  const actionPointAuditLogs = await getMeetingActionPointAuditLogs(
    access.organization.id,
    meeting.actionPoints.map((actionPoint) => actionPoint.id),
  );
  const actionPointAuditLogsById = new Map<
    string,
    typeof actionPointAuditLogs
  >();
  for (const auditLog of actionPointAuditLogs) {
    const existing = actionPointAuditLogsById.get(auditLog.entityId) ?? [];
    existing.push(auditLog);
    actionPointAuditLogsById.set(auditLog.entityId, existing);
  }

  const canManage = hasFoundationPermission(
    access.organizationRoles,
    "meetings.manage",
  );
  const canUploadAttachment = hasFoundationPermission(
    access.organizationRoles,
    "attachments.upload",
  );
  const viewerMembership = canManage
    ? null
    : await getActiveMembershipByUserId(access.userId, access.organization.id);
  const viewerDepartmentId = viewerMembership?.departmentId ?? null;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-5">
      <div className="rounded-[24px] border border-slate-200 bg-white px-6 py-6 shadow-[0_18px_48px_rgba(15,23,42,0.06)]">
        <div className="space-y-2">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-slate-400">
            Meeting detail
          </p>
          <h1 className="text-[1.85rem] font-semibold tracking-[-0.04em] text-slate-950">
            {meeting.title}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="rounded-full bg-[#e6f1f8] text-[#1868a6]">
              {getMeetingStatusLabel(meeting.status)}
            </Badge>
            <Badge variant="outline" className="rounded-full">
              {formatDateTime(meeting.startsAt)}
            </Badge>
          </div>
          {meeting.description ? (
            <p className="max-w-3xl text-sm leading-6 text-slate-600">
              {meeting.description}
            </p>
          ) : null}
        </div>
      </div>

      <section className="grid gap-5 lg:grid-cols-2">
        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardHeader className="px-6 py-5">
            <CardTitle className="text-lg tracking-[-0.03em] text-slate-950">
              Meeting profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 px-6 pb-6 text-sm text-slate-600">
            <div>
              <span className="font-medium text-slate-950">Starts:</span>{" "}
              {formatDateTime(meeting.startsAt)}
            </div>
            <div>
              <span className="font-medium text-slate-950">Ends:</span>{" "}
              {formatDateTime(meeting.endsAt)}
            </div>
            <div>
              <span className="font-medium text-slate-950">Venue:</span>{" "}
              {meeting.venue || "Not recorded"}
            </div>
            <div>
              <span className="font-medium text-slate-950">Organizer:</span>{" "}
              {meeting.organizer || "Not assigned"}
            </div>
            <div>
              <span className="font-medium text-slate-950">Chairperson:</span>{" "}
              {meeting.chairperson || "Not assigned"}
            </div>
            <div>
              <span className="font-medium text-slate-950">
                Linked correspondence:
              </span>{" "}
              {meeting.correspondence ? (
                <Link
                  href={`/dashboard/correspondences/${meeting.correspondence.id}`}
                  className="font-medium text-[#1868a6] hover:no-underline"
                >
                  {meeting.correspondence.referenceNumber} -{" "}
                  {meeting.correspondence.subject}
                </Link>
              ) : (
                "Not linked"
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardHeader className="px-6 py-5">
            <CardTitle className="text-lg tracking-[-0.03em] text-slate-950">
              Meeting content
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-6 pb-6 text-sm text-slate-600">
            <div>
              <div className="font-medium text-slate-950">Agenda</div>
              <p className="mt-1 whitespace-pre-wrap">
                {meeting.agenda || "No agenda has been recorded yet."}
              </p>
            </div>
            <div>
              <div className="font-medium text-slate-950">
                Discussion summary
              </div>
              <p className="mt-1 whitespace-pre-wrap">
                {meeting.discussionSummary ||
                  "No discussion summary has been recorded yet."}
              </p>
            </div>
            <div>
              <div className="font-medium text-slate-950">Resolutions</div>
              <p className="mt-1 whitespace-pre-wrap">
                {meeting.resolutions ||
                  "No resolutions have been recorded yet."}
              </p>
            </div>
            <div>
              <div className="font-medium text-slate-950">Decisions</div>
              <p className="mt-1 whitespace-pre-wrap">
                {meeting.decisions || "No decisions have been recorded yet."}
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {canManage ? (
        <MeetingEditForm
          meeting={meeting}
          correspondences={createOptions.correspondences}
        />
      ) : null}

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_420px]">
        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardHeader className="px-6 py-5">
            <CardTitle className="text-lg tracking-[-0.03em] text-slate-950">
              Action points
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-6 pb-6">
            {meeting.actionPoints.length === 0 ? (
              <p className="text-sm text-slate-600">
                No action points have been recorded for this meeting yet.
              </p>
            ) : (
              meeting.actionPoints.map((actionPoint) => (
                <div
                  key={actionPoint.id}
                  className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                >
                  {(() => {
                    const history =
                      actionPointAuditLogsById.get(actionPoint.id) ?? [];

                    return (
                      <>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="font-medium text-slate-950">
                              {actionPoint.actionPoint}
                            </div>
                            <div className="text-xs text-slate-500">
                              Created {formatDateTime(actionPoint.createdAt)} by{" "}
                              {formatUserLabel(
                                actionPoint.createdByUser,
                                "Unknown user",
                              )}
                            </div>
                          </div>
                          <Badge className="rounded-full bg-[#e6f1f8] text-[#1868a6]">
                            {actionPoint.status.replaceAll("_", " ")}
                          </Badge>
                        </div>

                        <div className="grid gap-3 text-sm text-slate-600 md:grid-cols-3">
                          <div>
                            <span className="font-medium text-slate-950">
                              User:
                            </span>{" "}
                            {formatUserLabel(
                              actionPoint.assignedToUser,
                              "Not assigned",
                            )}
                          </div>
                          <div>
                            <span className="font-medium text-slate-950">
                              Department:
                            </span>{" "}
                            {actionPoint.assignedToDepartment
                              ? actionPoint.assignedToDepartment.code
                                ? `${actionPoint.assignedToDepartment.name} (${actionPoint.assignedToDepartment.code})`
                                : actionPoint.assignedToDepartment.name
                              : "Not assigned"}
                          </div>
                          <div>
                            <span className="font-medium text-slate-950">
                              Due date:
                            </span>{" "}
                            {actionPoint.dueDate
                              ? new Intl.DateTimeFormat("en-KE", {
                                  dateStyle: "medium",
                                }).format(actionPoint.dueDate)
                              : "Not set"}
                          </div>
                        </div>

                        {(() => {
                          const canSelfUpdate =
                            !canManage &&
                            (actionPoint.assignedToUser?.id === access.userId ||
                              (!!actionPoint.assignedToDepartment?.id &&
                                actionPoint.assignedToDepartment.id ===
                                  viewerDepartmentId));

                          return canManage || canSelfUpdate;
                        })() ? (
                          <MeetingActionPointUpdateForm
                            actionPoint={actionPoint}
                            users={createOptions.users}
                            departments={createOptions.departments}
                            restricted={!canManage}
                          />
                        ) : actionPoint.remarks ? (
                          <div className="text-sm text-slate-600">
                            <span className="font-medium text-slate-950">
                              Remarks:
                            </span>{" "}
                            {actionPoint.remarks}
                          </div>
                        ) : null}

                        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                          <div className="mb-2 flex items-center justify-between gap-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                              Change history
                            </p>
                            <Badge variant="outline" className="rounded-full">
                              {history.length} entr
                              {history.length === 1 ? "y" : "ies"}
                            </Badge>
                          </div>
                          {history.length === 0 ? (
                            <p className="text-sm text-slate-500">
                              No action point history has been recorded yet.
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {history.map((auditLog) => (
                                <div
                                  key={auditLog.id}
                                  className="border-t border-slate-100 pt-2 first:border-t-0 first:pt-0"
                                >
                                  <p className="text-sm text-slate-700">
                                    {auditLog.message ||
                                      auditLog.action.replaceAll("_", " ")}
                                  </p>
                                  <p className="mt-1 text-xs text-slate-500">
                                    {formatDateTime(auditLog.createdAt)} by{" "}
                                    {formatUserLabel(
                                      auditLog.actorUser,
                                      "System",
                                    )}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <div className="space-y-5">
          {canManage ? (
            <Card className="rounded-2xl border-slate-200 shadow-sm">
              <CardHeader className="px-6 py-5">
                <CardTitle className="text-lg tracking-[-0.03em] text-slate-950">
                  Add action point
                </CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <MeetingActionPointCreateForm
                  meetingId={meeting.id}
                  users={createOptions.users}
                  departments={createOptions.departments}
                />
              </CardContent>
            </Card>
          ) : null}

          <Card className="rounded-2xl border-slate-200 shadow-sm">
            <CardHeader className="px-6 py-5">
              <CardTitle className="text-lg tracking-[-0.03em] text-slate-950">
                Office copy
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <Link
                href={`/dashboard/meetings/${meeting.id}?print=1`}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:no-underline"
              >
                Print meeting summary
              </Link>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200 shadow-sm">
            <CardHeader className="px-6 py-5">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-lg tracking-[-0.03em] text-slate-950">
                  Attachments
                </CardTitle>
                {meeting.attachments.length > 0 ? (
                  <Badge
                    variant="outline"
                    className="border-slate-200 bg-slate-50 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-slate-600"
                  >
                    {meeting.attachments.length} file
                    {meeting.attachments.length === 1 ? "" : "s"}
                  </Badge>
                ) : null}
              </div>
            </CardHeader>
            <CardContent className="space-y-3 px-6 pb-6 text-sm text-slate-600">
              {canUploadAttachment ? (
                <MeetingAttachmentUploadForm meetingId={meeting.id} />
              ) : null}

              {meeting.attachments.length === 0 ? (
                <p>No meeting attachments have been uploaded yet.</p>
              ) : (
                <div className="space-y-3">
                  {meeting.attachments.map((attachment) => (
                    <a
                      key={attachment.id}
                      href={`/api/attachments/${attachment.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-start justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 transition hover:bg-slate-100"
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
                          {formatUserLabel(
                            attachment.uploadedByUser,
                            "Unknown user",
                          )}
                        </p>
                      </div>
                      <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
                    </a>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
