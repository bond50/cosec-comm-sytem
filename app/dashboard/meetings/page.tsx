import { CalendarDays, ClipboardList, TimerReset, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { MeetingsWorkspace } from "@/app/dashboard/meetings/meetings-workspace";
import {
  getMeetingCreateOptions,
  getMeetingsList,
} from "@/features/meetings/queries/meetings";
import { requireMeetingWorkspaceAccess } from "@/features/auth/utils/require-organization-permission";
import { hasFoundationPermission } from "@/features/auth/utils/role-access";

export default async function MeetingsPage() {
  const access = await requireMeetingWorkspaceAccess();
  const [meetings, createOptions] = await Promise.all([
    getMeetingsList(access.organization.id),
    getMeetingCreateOptions(access.organization.id),
  ]);

  const canManage = hasFoundationPermission(
    access.organizationRoles,
    "meetings.manage",
  );
  const scheduledCount = meetings.filter(
    (meeting) => meeting.status === "SCHEDULED",
  ).length;
  const actionPointTotal = meetings.reduce(
    (total, meeting) => total + meeting._count.actionPoints,
    0,
  );

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-5">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-[1.65rem]">
          Manage meetings
        </h1>
        <p className="text-sm text-slate-600">
          Schedule and track meetings for {access.organization.name}.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardContent className="flex items-start justify-between px-5 py-4">
            <div>
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Total meetings
              </p>
              <p className="mt-2 text-[1.7rem] font-semibold tracking-[-0.04em] text-slate-950">
                {meetings.length}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e6f1f8] text-[#1868a6]">
              <CalendarDays className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardContent className="flex items-start justify-between px-5 py-4">
            <div>
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Scheduled
              </p>
              <p className="mt-2 text-[1.7rem] font-semibold tracking-[-0.04em] text-slate-950">
                {scheduledCount}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e6f1f8] text-[#1868a6]">
              <TimerReset className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardContent className="flex items-start justify-between px-5 py-4">
            <div>
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Action points
              </p>
              <p className="mt-2 text-[1.7rem] font-semibold tracking-[-0.04em] text-slate-950">
                {actionPointTotal}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e6f1f8] text-[#1868a6]">
              <ClipboardList className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardContent className="flex items-start justify-between px-5 py-4">
            <div>
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Access level
              </p>
              <p className="mt-2 text-base font-semibold text-slate-950">
                {canManage ? "Manage meetings" : "View meetings"}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e6f1f8] text-[#1868a6]">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </section>

      <MeetingsWorkspace
        meetings={meetings}
        canManage={canManage}
        correspondences={createOptions.correspondences}
      />
    </div>
  );
}
