import { CalendarDays, Layers3, PieChart } from "lucide-react";
import { BreakdownDonut } from "@/components/ui/breakdown-donut";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExportActions } from "@/components/ui/export-actions";
import type { CorrespondenceDashboardMetrics } from "@/features/correspondence/queries/correspondence-dashboard";

type ReportsOverviewProps = {
  correspondenceMetrics: CorrespondenceDashboardMetrics;
};

function getBreakdownTotal(items: { count: number }[]) {
  return items.reduce((sum, item) => sum + item.count, 0);
}

function getMaxBreakdownCount(items: { count: number }[]) {
  return Math.max(...items.map((item) => item.count), 0);
}

function getBarHeight(value: number, maxValue: number) {
  if (maxValue <= 0) return 12;

  return Math.max(12, Math.round((value / maxValue) * 132));
}

// Validated 8-slot categorical order (dataviz skill reference palette) — worst
// adjacent CVD ΔE 24.2, well clear of the 12 floor. Preserve this order.
const STATUS_CHART_COLORS: Record<string, string> = {
  NEW: "#2a78d6",
  UNDER_REVIEW: "#1baf7a",
  DISPATCHED: "#eda100",
  IN_PROGRESS: "#008300",
  AWAITING_FEEDBACK: "#4a3aa7",
  COMPLETED: "#e34948",
  CANCELLED: "#e87ba4",
  CLOSED: "#eb6834",
};

// Reserved status palette (good/warning/serious/critical) — fits an escalating
// severity ramp better than identity colors.
const PRIORITY_CHART_COLORS: Record<string, string> = {
  NORMAL: "#0ca30c",
  URGENT: "#fab219",
  VERY_URGENT: "#ec835a",
  CRITICAL: "#d03b3b",
};

const MEETING_STATUS_CHART_COLORS: Record<string, string> = {
  SCHEDULED: "#2a78d6",
  HELD: "#1baf7a",
  ACTION_POINTS_ISSUED: "#eda100",
  POSTPONED: "#4a3aa7",
  CANCELLED: "#e34948",
  CLOSED: "#eb6834",
  COMPLETED: "#008300",
};

function formatSlaComplianceLabel(rate: number | null) {
  return rate === null ? "No SLA data yet" : `${rate}% compliant`;
}

export function ReportsOverview({
  correspondenceMetrics,
}: ReportsOverviewProps) {
  const monthlyIntakeMax = getMaxBreakdownCount(
    correspondenceMetrics.monthlyIntake,
  );
  const monthlySummaryHeader = ["Section", "Metric", "Value", "Notes"];
  const monthlySummaryRows = [
    [
      "SLA compliance",
      "Compliant active items",
      String(correspondenceMetrics.slaCompliantCount),
      `${correspondenceMetrics.slaTrackedCount} active items have due dates`,
    ],
    [
      "SLA compliance",
      "Average response days",
      correspondenceMetrics.averageResponseDays === null
        ? "No response data yet"
        : String(correspondenceMetrics.averageResponseDays),
      "Derived from closed records or dispatch feedback",
    ],
    [
      "Summary",
      "Pending review",
      String(correspondenceMetrics.pendingReviewCount),
      "Registry and County Secretary queue pressure",
    ],
    [
      "Summary",
      "Pending acknowledgement",
      String(correspondenceMetrics.pendingDispatchAcknowledgementCount),
      "Dispatches sent but not yet acknowledged",
    ],
    [
      "Summary",
      "Overdue action points",
      String(correspondenceMetrics.overdueActionPointCount),
      "Meeting work already past due date",
    ],
    ...correspondenceMetrics.monthlyIntake.map((item) => [
      "Trends over time",
      item.label,
      String(item.count),
      "Registered correspondence for the month",
    ]),
    ...correspondenceMetrics.statusBreakdown.map((item) => [
      "Workflow stage trend",
      item.label,
      String(item.count),
      "Current correspondence status distribution",
    ]),
  ];

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-5">
      <header className="rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
        <h1 className="text-[1.5rem] font-semibold tracking-[-0.03em] text-slate-950">
          Reports
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Detailed trends and breakdowns behind the dashboard numbers.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardContent className="px-6 py-6">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Pending review
            </p>
            <p className="mt-3 text-[1.5rem] font-semibold tracking-[-0.03em] text-slate-950">
              {correspondenceMetrics.pendingReviewCount}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Registry and County Secretary queue.
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardContent className="px-6 py-6">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Pending acknowledgement
            </p>
            <p className="mt-3 text-[1.5rem] font-semibold tracking-[-0.03em] text-slate-950">
              {correspondenceMetrics.pendingDispatchAcknowledgementCount}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Dispatched, not yet acknowledged.
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardContent className="px-6 py-6">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Overdue action points
            </p>
            <p className="mt-3 text-[1.5rem] font-semibold tracking-[-0.03em] text-slate-950">
              {correspondenceMetrics.overdueActionPointCount}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Meeting work past due date.
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardContent className="px-6 py-6">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              SLA compliance
            </p>
            <p className="mt-3 text-[1.5rem] font-semibold tracking-[-0.03em] text-slate-950">
              {formatSlaComplianceLabel(
                correspondenceMetrics.slaComplianceRate,
              )}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {correspondenceMetrics.slaTrackedCount} active item
              {correspondenceMetrics.slaTrackedCount === 1 ? "" : "s"} tracked.
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-start justify-between gap-4 px-6 py-5">
            <div>
              <CardTitle className="text-[1.05rem] text-slate-950">
                Trends over time
              </CardTitle>
              <p className="mt-1 text-xs text-slate-500">Last six months</p>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <ExportActions
                caption="Dashboard and SLA summary"
                fileName="dashboard-sla-summary"
                headerRow={monthlySummaryHeader}
                rows={monthlySummaryRows}
              />
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e6f1f8] text-[#1868a6]">
                <CalendarDays className="h-5 w-5" />
              </span>
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            {correspondenceMetrics.monthlyIntake.length ? (
              <>
                <div className="flex h-44 items-end gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  {correspondenceMetrics.monthlyIntake.map((item) => (
                    <div
                      key={item.key}
                      className="flex min-w-0 flex-1 flex-col items-center gap-3"
                    >
                      <div className="flex h-32 items-end">
                        <div
                          className="w-8 rounded-t-xl bg-[#1868a6] shadow-sm transition"
                          style={{
                            height: `${getBarHeight(item.count, monthlyIntakeMax)}px`,
                          }}
                        />
                      </div>
                      <div className="text-center">
                        <div className="text-xs font-semibold text-slate-500">
                          {item.label}
                        </div>
                        <div className="mt-1 text-sm font-semibold text-slate-950">
                          {item.count}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Six-month volume
                    </div>
                    <div className="mt-2 text-lg font-semibold text-slate-950">
                      {getBreakdownTotal(correspondenceMetrics.monthlyIntake)}
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Highest month
                    </div>
                    <div className="mt-2 text-lg font-semibold text-slate-950">
                      {monthlyIntakeMax}
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Current month
                    </div>
                    <div className="mt-2 text-lg font-semibold text-slate-950">
                      {correspondenceMetrics.monthlyIntake.at(-1)?.count ?? 0}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600">
                No intake trend yet.
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6">
          <Card className="rounded-2xl border-slate-200 shadow-sm">
            <CardHeader className="flex flex-row items-start justify-between gap-4 px-6 py-5">
              <CardTitle className="text-[1.05rem] text-slate-950">
                Workflow stage distribution
              </CardTitle>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e6f1f8] text-[#1868a6]">
                <PieChart className="h-5 w-5" />
              </span>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <BreakdownDonut
                centerLabel="Total"
                items={correspondenceMetrics.statusBreakdown.map((item) => ({
                  key: item.key,
                  label: item.label,
                  count: item.count,
                  color: STATUS_CHART_COLORS[item.key] ?? "#94a3b8",
                }))}
              />
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200 shadow-sm">
            <CardHeader className="flex flex-row items-start justify-between gap-4 px-6 py-5">
              <CardTitle className="text-[1.05rem] text-slate-950">
                Urgent pressure and meeting actions
              </CardTitle>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e6f1f8] text-[#1868a6]">
                <Layers3 className="h-5 w-5" />
              </span>
            </CardHeader>
            <CardContent className="grid gap-5 px-6 pb-6">
              <div>
                <div className="mb-3 text-sm font-semibold text-slate-950">
                  Correspondence priority mix
                </div>
                <BreakdownDonut
                  items={correspondenceMetrics.priorityBreakdown.map(
                    (item) => ({
                      key: item.key,
                      label: item.label,
                      count: item.count,
                      color: PRIORITY_CHART_COLORS[item.key] ?? "#0ca30c",
                    }),
                  )}
                />
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <div className="mb-3 text-sm font-semibold text-slate-950">
                  Meeting status snapshot
                </div>
                {correspondenceMetrics.meetingStatusBreakdown.length ? (
                  <BreakdownDonut
                    items={correspondenceMetrics.meetingStatusBreakdown.map(
                      (item) => ({
                        key: item.key,
                        label: item.label,
                        count: item.count,
                        color:
                          MEETING_STATUS_CHART_COLORS[item.key] ?? "#94a3b8",
                      }),
                    )}
                  />
                ) : (
                  <p className="text-sm text-slate-600">
                    No meetings have been recorded yet.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
