import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ExportActions } from "@/components/ui/export-actions";
import { requireMeetingWorkspaceAccess } from "@/features/auth/utils/require-organization-permission";
import { getMyMeetingActionPoints } from "@/features/meetings/queries/meetings";
import { formatUserLabel } from "@/features/application/lib/user-label";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
  }).format(value);
}

function isOverdue(dueDate: Date, status: string) {
  if (status === "COMPLETED" || status === "CANCELLED") return false;
  return dueDate.getTime() < new Date().setHours(0, 0, 0, 0);
}

export default async function MyMeetingActionPointsPage() {
  const access = await requireMeetingWorkspaceAccess();
  const actionPoints = await getMyMeetingActionPoints(
    access.organization.id,
    access.userId,
  );

  const rows = actionPoints.map((actionPoint) => [
    actionPoint.actionPoint,
    actionPoint.meeting.title,
    actionPoint.status.replaceAll("_", " "),
    formatDate(actionPoint.dueDate),
    actionPoint.assignedToDepartment?.name ?? "Not assigned",
    formatUserLabel(actionPoint.assignedToUser, "Not assigned"),
    isOverdue(actionPoint.dueDate, actionPoint.status) ? "Overdue" : "On time",
  ]);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-5">
      <div className="flex flex-col gap-4 rounded-[24px] border border-slate-200 bg-white px-6 py-6 shadow-[0_18px_48px_rgba(15,23,42,0.06)] lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-slate-400">
            Meetings
          </p>
          <h1 className="text-[1.85rem] font-semibold tracking-[-0.04em] text-slate-950">
            My action points
          </h1>
          <p className="max-w-3xl text-sm leading-6 text-slate-600">
            Work assigned directly to you or to your department, with due dates
            and overdue visibility.
          </p>
        </div>
        <ExportActions
          caption="Meeting Action Point Register"
          fileName="meeting-action-points"
          headerRow={[
            "Action point",
            "Meeting",
            "Status",
            "Due date",
            "Department",
            "User",
            "Overdue",
          ]}
          rows={rows}
        />
      </div>

      <Card className="rounded-2xl border-slate-200 shadow-sm">
        <CardContent className="space-y-3 px-5 py-5">
          {actionPoints.length === 0 ? (
            <p className="text-sm text-slate-600">
              No action points are assigned to you or your department.
            </p>
          ) : (
            actionPoints.map((actionPoint) => {
              const overdue = isOverdue(
                actionPoint.dueDate,
                actionPoint.status,
              );

              return (
                <Link
                  key={actionPoint.id}
                  href={`/dashboard/meetings/${actionPoint.meeting.id}`}
                  className="block rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 transition hover:bg-white hover:no-underline"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="font-medium text-slate-950">
                        {actionPoint.actionPoint}
                      </p>
                      <p className="text-sm text-slate-600">
                        {actionPoint.meeting.title}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge className="rounded-full bg-[#e6f1f8] text-[#1868a6]">
                        {actionPoint.status.replaceAll("_", " ")}
                      </Badge>
                      {overdue ? (
                        <Badge className="rounded-full bg-rose-50 text-rose-700">
                          Overdue
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                  <div className="mt-3 grid gap-2 text-sm text-slate-600 md:grid-cols-3">
                    <div>Due {formatDate(actionPoint.dueDate)}</div>
                    <div>
                      {actionPoint.assignedToDepartment?.name ??
                        "No department"}
                    </div>
                    <div>
                      {formatUserLabel(
                        actionPoint.assignedToUser,
                        "No named user",
                      )}
                    </div>
                  </div>
                  {actionPoint.remarks ? (
                    <p className="mt-3 text-sm text-slate-500">
                      {actionPoint.remarks}
                    </p>
                  ) : null}
                </Link>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
