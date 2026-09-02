import { MeetingPrintToolbar } from "@/app/dashboard/meetings/[id]/meeting-print-toolbar";
import type { MeetingDetailItem } from "@/features/meetings/queries/meetings";

function formatDateTime(value: Date | null | undefined) {
  if (!value) return "Not recorded";

  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export function MeetingPrintView({
  organizationName,
  meeting,
}: {
  organizationName: string;
  meeting: MeetingDetailItem;
}) {
  return (
    <>
      <MeetingPrintToolbar />
      <main className="mx-auto max-w-4xl bg-white px-10 py-10 text-slate-950 print:px-0">
        <div className="mb-8 border-b border-slate-300 pb-5">
          <p className="text-sm font-semibold uppercase tracking-[0.16em]">
            {organizationName}
          </p>
          <h1 className="mt-2 text-2xl font-semibold">{meeting.title}</h1>
          <p className="mt-1 text-sm text-slate-600">Meeting summary</p>
        </div>

        <section className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <strong>Status:</strong> {meeting.status.replaceAll("_", " ")}
          </div>
          <div>
            <strong>Venue:</strong> {meeting.venue || "Not recorded"}
          </div>
          <div>
            <strong>Starts:</strong> {formatDateTime(meeting.startsAt)}
          </div>
          <div>
            <strong>Ends:</strong> {formatDateTime(meeting.endsAt)}
          </div>
          <div>
            <strong>Organizer:</strong> {meeting.organizer || "Not assigned"}
          </div>
          <div>
            <strong>Chairperson:</strong>{" "}
            {meeting.chairperson || "Not assigned"}
          </div>
        </section>

        {[
          ["Agenda", meeting.agenda],
          ["Discussion summary", meeting.discussionSummary],
          ["Resolutions", meeting.resolutions],
          ["Decisions", meeting.decisions],
        ].map(([label, value]) => (
          <section key={label} className="mt-7">
            <h2 className="border-b border-slate-200 pb-2 text-base font-semibold">
              {label}
            </h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
              {value || "Not recorded"}
            </p>
          </section>
        ))}

        <section className="mt-7">
          <h2 className="border-b border-slate-200 pb-2 text-base font-semibold">
            Action points
          </h2>
          {meeting.actionPoints.length === 0 ? (
            <p className="mt-3 text-sm text-slate-600">
              No action points recorded.
            </p>
          ) : (
            <table className="mt-3 w-full border-collapse text-left text-sm">
              <thead>
                <tr>
                  {[
                    "Action point",
                    "Assignee",
                    "Department",
                    "Due",
                    "Status",
                  ].map((header) => (
                    <th key={header} className="border border-slate-300 p-2">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {meeting.actionPoints.map((actionPoint) => (
                  <tr key={actionPoint.id}>
                    <td className="border border-slate-300 p-2">
                      {actionPoint.actionPoint}
                    </td>
                    <td className="border border-slate-300 p-2">
                      {actionPoint.assignedToUser?.name ||
                        actionPoint.assignedToUser?.email ||
                        "Not assigned"}
                    </td>
                    <td className="border border-slate-300 p-2">
                      {actionPoint.assignedToDepartment?.name || "Not assigned"}
                    </td>
                    <td className="border border-slate-300 p-2">
                      {formatDateTime(actionPoint.dueDate)}
                    </td>
                    <td className="border border-slate-300 p-2">
                      {actionPoint.status.replaceAll("_", " ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </main>
    </>
  );
}
