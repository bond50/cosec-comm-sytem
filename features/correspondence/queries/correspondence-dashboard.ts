import "server-only";

import {
  CorrespondencePriority,
  CorrespondenceStatus,
  DispatchStatus,
  MeetingStatus,
  type Prisma,
} from "@prisma/client";
import { db } from "@/lib/db";
import {
  FINAL_CORRESPONDENCE_STATUSES,
  getCorrespondenceSla,
} from "@/features/correspondence/queries/correspondence-sla";
import { buildCorrespondenceVisibilityWhere } from "@/features/correspondence/lib/correspondence-access";
import type { MembershipRoleInput } from "@/features/auth/utils/roles";

export type DashboardVisibilityScope = {
  userId: string;
  departmentId: string | null;
  orgWide: boolean;
  roles: MembershipRoleInput;
};

function buildDispatchVisibilityWhere(
  scope: DashboardVisibilityScope | undefined,
): Prisma.CorrespondenceDispatchWhereInput | undefined {
  if (!scope || scope.orgWide) return undefined;

  const or: Prisma.CorrespondenceDispatchWhereInput[] = [
    { dispatchedToUserId: scope.userId },
    { acknowledgedByUserId: scope.userId },
    { createdByUserId: scope.userId },
  ];
  if (scope.departmentId) {
    or.push({ dispatchedToDepartmentId: scope.departmentId });
  }

  return { OR: or };
}

function buildActionPointVisibilityWhere(
  scope: DashboardVisibilityScope | undefined,
): Prisma.MeetingActionPointWhereInput | undefined {
  if (!scope || scope.orgWide) return undefined;

  const or: Prisma.MeetingActionPointWhereInput[] = [
    { assignedToUserId: scope.userId },
    { createdByUserId: scope.userId },
  ];
  if (scope.departmentId) {
    or.push({ assignedToDepartmentId: scope.departmentId });
  }

  return { OR: or };
}

const URGENT_PRIORITIES = [
  CorrespondencePriority.URGENT,
  CorrespondencePriority.VERY_URGENT,
  CorrespondencePriority.CRITICAL,
] as CorrespondencePriority[];

const PENDING_REVIEW_STATUSES = [
  CorrespondenceStatus.NEW,
  CorrespondenceStatus.UNDER_REVIEW,
] as CorrespondenceStatus[];

const ACTIVE_WORKLOAD_SELECT = {
  assignedToDepartmentId: true,
  assignedToDepartment: {
    select: {
      id: true,
      name: true,
      code: true,
    },
  },
  dueDate: true,
  priority: true,
  status: true,
} satisfies Prisma.CorrespondenceSelect;

const RESPONSE_TIME_SELECT = {
  receivedAt: true,
  closedAt: true,
  dispatches: {
    where: {
      feedbackReceivedAt: {
        not: null,
      },
    },
    orderBy: {
      feedbackReceivedAt: "desc",
    },
    take: 1,
    select: {
      feedbackReceivedAt: true,
    },
  },
} satisfies Prisma.CorrespondenceSelect;

const RECENT_CORRESPONDENCE_SELECT = {
  id: true,
  referenceNumber: true,
  subject: true,
  priority: true,
  status: true,
  receivedAt: true,
} satisfies Prisma.CorrespondenceSelect;

const OVERDUE_CORRESPONDENCE_SELECT = {
  id: true,
  referenceNumber: true,
  subject: true,
  dueDate: true,
  priority: true,
  assignedToDepartment: {
    select: {
      name: true,
      code: true,
    },
  },
  assignedToUser: {
    select: {
      name: true,
      email: true,
    },
  },
} satisfies Prisma.CorrespondenceSelect;

const PENDING_DISPATCH_SELECT = {
  id: true,
  dispatchDate: true,
  status: true,
  correspondence: {
    select: {
      id: true,
      referenceNumber: true,
      subject: true,
    },
  },
  dispatchedToDepartment: {
    select: {
      name: true,
      code: true,
    },
  },
  dispatchedToUser: {
    select: {
      name: true,
      email: true,
    },
  },
} satisfies Prisma.CorrespondenceDispatchSelect;

const PENDING_ACTION_POINT_SELECT = {
  id: true,
  actionPoint: true,
  status: true,
  dueDate: true,
  meeting: {
    select: {
      id: true,
      title: true,
    },
  },
  assignedToDepartment: {
    select: {
      name: true,
      code: true,
    },
  },
  assignedToUser: {
    select: {
      name: true,
      email: true,
    },
  },
} satisfies Prisma.MeetingActionPointSelect;

type ActiveWorkloadItem = Prisma.CorrespondenceGetPayload<{
  select: typeof ACTIVE_WORKLOAD_SELECT;
}>;

type ResponseTimeItem = Prisma.CorrespondenceGetPayload<{
  select: typeof RESPONSE_TIME_SELECT;
}>;

export type DepartmentWorkloadItem = {
  departmentId: string;
  departmentName: string;
  departmentCode: string | null;
  activeCount: number;
  overdueCount: number;
  urgentCount: number;
  inProgressCount: number;
};

export type DashboardRecentCorrespondenceItem =
  Prisma.CorrespondenceGetPayload<{
    select: typeof RECENT_CORRESPONDENCE_SELECT;
  }>;

export type DashboardOverdueCorrespondenceItem =
  Prisma.CorrespondenceGetPayload<{
    select: typeof OVERDUE_CORRESPONDENCE_SELECT;
  }>;

export type DashboardPendingDispatchItem =
  Prisma.CorrespondenceDispatchGetPayload<{
    select: typeof PENDING_DISPATCH_SELECT;
  }>;

export type DashboardPendingActionPointItem =
  Prisma.MeetingActionPointGetPayload<{
    select: typeof PENDING_ACTION_POINT_SELECT;
  }>;

export type DashboardBreakdownItem = {
  key: string;
  label: string;
  count: number;
};

export type DashboardMonthlyIntakeItem = {
  key: string;
  label: string;
  count: number;
};

export type CorrespondenceDashboardMetrics = {
  totalCount: number;
  urgentCount: number;
  overdueCount: number;
  slaTrackedCount: number;
  slaCompliantCount: number;
  slaComplianceRate: number | null;
  pendingReviewCount: number;
  pendingDispatchCount: number;
  pendingDispatchAcknowledgementCount: number;
  pendingActionPointCount: number;
  overdueActionPointCount: number;
  averageResponseDays: number | null;
  respondedCount: number;
  departmentWorkload: DepartmentWorkloadItem[];
  recentCorrespondence: DashboardRecentCorrespondenceItem[];
  overdueItems: DashboardOverdueCorrespondenceItem[];
  pendingDispatches: DashboardPendingDispatchItem[];
  pendingActionPoints: DashboardPendingActionPointItem[];
  statusBreakdown: DashboardBreakdownItem[];
  priorityBreakdown: DashboardBreakdownItem[];
  monthlyIntake: DashboardMonthlyIntakeItem[];
  meetingStatusBreakdown: DashboardBreakdownItem[];
};

const STATUS_LABELS: Record<CorrespondenceStatus, string> = {
  NEW: "New",
  UNDER_REVIEW: "Under Review",
  DISPATCHED: "Dispatched",
  IN_PROGRESS: "In Progress",
  AWAITING_FEEDBACK: "Awaiting Feedback",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  CLOSED: "Closed",
};

const PRIORITY_LABELS: Record<CorrespondencePriority, string> = {
  NORMAL: "Normal",
  URGENT: "Urgent",
  VERY_URGENT: "Very Urgent",
  CRITICAL: "Critical",
};

const MEETING_STATUS_LABELS: Record<MeetingStatus, string> = {
  SCHEDULED: "Scheduled",
  HELD: "Held",
  ACTION_POINTS_ISSUED: "Action points issued",
  POSTPONED: "Postponed",
  CANCELLED: "Cancelled",
  CLOSED: "Closed",
  COMPLETED: "Completed",
};

function getDepartmentWorkload(
  items: ActiveWorkloadItem[],
  now: Date,
): DepartmentWorkloadItem[] {
  const workloadByDepartment = new Map<string, DepartmentWorkloadItem>();

  for (const item of items) {
    if (!item.assignedToDepartmentId || !item.assignedToDepartment) continue;

    const current = workloadByDepartment.get(item.assignedToDepartmentId) ?? {
      departmentId: item.assignedToDepartment.id,
      departmentName: item.assignedToDepartment.name,
      departmentCode: item.assignedToDepartment.code,
      activeCount: 0,
      overdueCount: 0,
      urgentCount: 0,
      inProgressCount: 0,
    };

    current.activeCount += 1;

    if (getCorrespondenceSla(item.dueDate, now).isOverdue) {
      current.overdueCount += 1;
    }

    if (URGENT_PRIORITIES.includes(item.priority)) {
      current.urgentCount += 1;
    }

    if (
      item.status === CorrespondenceStatus.DISPATCHED ||
      item.status === CorrespondenceStatus.IN_PROGRESS ||
      item.status === CorrespondenceStatus.AWAITING_FEEDBACK
    ) {
      current.inProgressCount += 1;
    }

    workloadByDepartment.set(item.assignedToDepartmentId, current);
  }

  return [...workloadByDepartment.values()].sort((left, right) => {
    return (
      right.activeCount - left.activeCount ||
      right.overdueCount - left.overdueCount ||
      left.departmentName.localeCompare(right.departmentName)
    );
  });
}

function getAverageResponseDays(
  items: ResponseTimeItem[],
): Pick<
  CorrespondenceDashboardMetrics,
  "averageResponseDays" | "respondedCount"
> {
  const responseTimes = items
    .map((item) => {
      const feedbackReceivedAt = item.dispatches[0]?.feedbackReceivedAt ?? null;
      const respondedAt = item.closedAt ?? feedbackReceivedAt;

      if (!respondedAt) return null;

      const differenceInMs = respondedAt.getTime() - item.receivedAt.getTime();
      if (differenceInMs < 0) return null;

      return differenceInMs / (24 * 60 * 60 * 1000);
    })
    .filter((value): value is number => value !== null);

  if (!responseTimes.length) {
    return {
      averageResponseDays: null,
      respondedCount: 0,
    };
  }

  const average =
    responseTimes.reduce((sum, value) => sum + value, 0) / responseTimes.length;

  return {
    averageResponseDays: Number(average.toFixed(1)),
    respondedCount: responseTimes.length,
  };
}

function getMonthlyIntakeBreakdown(receivedAtValues: Date[], now: Date) {
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);

    return {
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
      label: date.toLocaleString("en-KE", { month: "short" }),
      count: 0,
    };
  });

  const monthIndex = new Map(months.map((month) => [month.key, month]));

  for (const receivedAt of receivedAtValues) {
    const key = `${receivedAt.getFullYear()}-${String(receivedAt.getMonth() + 1).padStart(2, "0")}`;
    const month = monthIndex.get(key);
    if (month) {
      month.count += 1;
    }
  }

  return months;
}

export async function getCorrespondenceDashboardMetrics(
  organizationId: string,
  viewer?: DashboardVisibilityScope,
): Promise<CorrespondenceDashboardMetrics> {
  if (!organizationId) {
    return {
      totalCount: 0,
      urgentCount: 0,
      overdueCount: 0,
      slaTrackedCount: 0,
      slaCompliantCount: 0,
      slaComplianceRate: null,
      pendingReviewCount: 0,
      pendingDispatchCount: 0,
      pendingDispatchAcknowledgementCount: 0,
      pendingActionPointCount: 0,
      overdueActionPointCount: 0,
      averageResponseDays: null,
      respondedCount: 0,
      departmentWorkload: [],
      recentCorrespondence: [],
      overdueItems: [],
      pendingDispatches: [],
      pendingActionPoints: [],
      statusBreakdown: [],
      priorityBreakdown: [],
      monthlyIntake: [],
      meetingStatusBreakdown: [],
    };
  }

  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const correspondenceVisibility = buildCorrespondenceVisibilityWhere(
    viewer
      ? {
          userId: viewer.userId,
          departmentId: viewer.departmentId,
          roles: viewer.roles,
        }
      : undefined,
  );
  const dispatchVisibility = buildDispatchVisibilityWhere(viewer);
  const actionPointVisibility = buildActionPointVisibilityWhere(viewer);

  const [
    totalCount,
    urgentCount,
    overdueCount,
    slaTrackedCount,
    slaCompliantCount,
    pendingReviewCount,
    pendingDispatchCount,
    pendingDispatchAcknowledgementCount,
    pendingActionPointCount,
    overdueActionPointCount,
    activeDepartmentItems,
    responseTimeItems,
    recentCorrespondence,
    overdueItems,
    pendingDispatches,
    pendingActionPoints,
    statusBreakdownRows,
    priorityBreakdownRows,
    monthlyIntakeRows,
    meetingStatusBreakdownRows,
  ] = await Promise.all([
    db.correspondence.count({
      where: {
        organizationId,
        ...correspondenceVisibility,
      },
    }),
    db.correspondence.count({
      where: {
        organizationId,
        status: {
          notIn: FINAL_CORRESPONDENCE_STATUSES,
        },
        priority: {
          in: URGENT_PRIORITIES,
        },
        ...correspondenceVisibility,
      },
    }),
    db.correspondence.count({
      where: {
        organizationId,
        status: {
          notIn: FINAL_CORRESPONDENCE_STATUSES,
        },
        dueDate: {
          lt: now,
        },
        ...correspondenceVisibility,
      },
    }),
    db.correspondence.count({
      where: {
        organizationId,
        status: {
          notIn: FINAL_CORRESPONDENCE_STATUSES,
        },
        dueDate: {
          not: null,
        },
        ...correspondenceVisibility,
      },
    }),
    db.correspondence.count({
      where: {
        organizationId,
        status: {
          notIn: FINAL_CORRESPONDENCE_STATUSES,
        },
        dueDate: {
          gte: now,
        },
        ...correspondenceVisibility,
      },
    }),
    db.correspondence.count({
      where: {
        organizationId,
        status: {
          in: PENDING_REVIEW_STATUSES,
        },
        ...correspondenceVisibility,
      },
    }),
    db.correspondenceDispatch.count({
      where: {
        organizationId,
        status: {
          in: [
            DispatchStatus.SENT,
            DispatchStatus.ACKNOWLEDGED,
            DispatchStatus.IN_PROGRESS,
          ],
        },
        ...dispatchVisibility,
      },
    }),
    db.correspondenceDispatch.count({
      where: {
        organizationId,
        status: DispatchStatus.SENT,
        ...dispatchVisibility,
      },
    }),
    db.meetingActionPoint.count({
      where: {
        organizationId,
        status: {
          in: ["OPEN", "IN_PROGRESS", "OVERDUE"],
        },
        ...actionPointVisibility,
      },
    }),
    db.meetingActionPoint.count({
      where: {
        organizationId,
        status: {
          in: ["OPEN", "IN_PROGRESS", "OVERDUE"],
        },
        dueDate: {
          lt: now,
        },
        ...actionPointVisibility,
      },
    }),
    db.correspondence.findMany({
      where: {
        organizationId,
        status: {
          notIn: FINAL_CORRESPONDENCE_STATUSES,
        },
        assignedToDepartmentId: {
          not: null,
        },
        ...correspondenceVisibility,
      },
      select: ACTIVE_WORKLOAD_SELECT,
    }),
    db.correspondence.findMany({
      where: {
        organizationId,
        AND: [
          {
            OR: [
              {
                closedAt: {
                  not: null,
                },
              },
              {
                dispatches: {
                  some: {
                    feedbackReceivedAt: {
                      not: null,
                    },
                  },
                },
              },
            ],
          },
          ...(correspondenceVisibility ? [correspondenceVisibility] : []),
        ],
      },
      select: RESPONSE_TIME_SELECT,
    }),
    db.correspondence.findMany({
      where: {
        organizationId,
        ...correspondenceVisibility,
      },
      orderBy: [{ receivedAt: "desc" }],
      take: 5,
      select: RECENT_CORRESPONDENCE_SELECT,
    }),
    db.correspondence.findMany({
      where: {
        organizationId,
        status: {
          notIn: FINAL_CORRESPONDENCE_STATUSES,
        },
        dueDate: {
          lt: now,
        },
        ...correspondenceVisibility,
      },
      orderBy: [{ dueDate: "asc" }],
      take: 5,
      select: OVERDUE_CORRESPONDENCE_SELECT,
    }),
    db.correspondenceDispatch.findMany({
      where: {
        organizationId,
        status: {
          in: [
            DispatchStatus.SENT,
            DispatchStatus.ACKNOWLEDGED,
            DispatchStatus.IN_PROGRESS,
          ],
        },
        ...dispatchVisibility,
      },
      orderBy: [{ dispatchDate: "asc" }],
      take: 5,
      select: PENDING_DISPATCH_SELECT,
    }),
    db.meetingActionPoint.findMany({
      where: {
        organizationId,
        status: {
          in: ["OPEN", "IN_PROGRESS", "OVERDUE"],
        },
        ...actionPointVisibility,
      },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
      take: 5,
      select: PENDING_ACTION_POINT_SELECT,
    }),
    db.correspondence.groupBy({
      by: ["status"],
      where: {
        organizationId,
        ...correspondenceVisibility,
      },
      _count: {
        _all: true,
      },
    }),
    db.correspondence.groupBy({
      by: ["priority"],
      where: {
        organizationId,
        ...correspondenceVisibility,
      },
      _count: {
        _all: true,
      },
    }),
    db.correspondence.findMany({
      where: {
        organizationId,
        receivedAt: {
          gte: sixMonthsAgo,
        },
        ...correspondenceVisibility,
      },
      select: {
        receivedAt: true,
      },
    }),
    db.meeting.groupBy({
      by: ["status"],
      where: {
        organizationId,
      },
      _count: {
        _all: true,
      },
    }),
  ]);

  const { averageResponseDays, respondedCount } =
    getAverageResponseDays(responseTimeItems);

  return {
    totalCount,
    urgentCount,
    overdueCount,
    slaTrackedCount,
    slaCompliantCount,
    slaComplianceRate:
      slaTrackedCount > 0
        ? Math.round((slaCompliantCount / slaTrackedCount) * 100)
        : null,
    pendingReviewCount,
    pendingDispatchCount,
    pendingDispatchAcknowledgementCount,
    pendingActionPointCount,
    overdueActionPointCount,
    averageResponseDays,
    respondedCount,
    departmentWorkload: getDepartmentWorkload(activeDepartmentItems, now),
    recentCorrespondence,
    overdueItems,
    pendingDispatches,
    pendingActionPoints,
    statusBreakdown: (Object.keys(STATUS_LABELS) as CorrespondenceStatus[]).map(
      (status) => ({
        key: status,
        label: STATUS_LABELS[status],
        count:
          statusBreakdownRows.find((row) => row.status === status)?._count
            ._all ?? 0,
      }),
    ),
    priorityBreakdown: (
      Object.keys(PRIORITY_LABELS) as CorrespondencePriority[]
    ).map((priority) => ({
      key: priority,
      label: PRIORITY_LABELS[priority],
      count:
        priorityBreakdownRows.find((row) => row.priority === priority)?._count
          ._all ?? 0,
    })),
    monthlyIntake: getMonthlyIntakeBreakdown(
      monthlyIntakeRows.map((row) => row.receivedAt),
      now,
    ),
    meetingStatusBreakdown: (
      Object.keys(MEETING_STATUS_LABELS) as MeetingStatus[]
    ).map((status) => ({
      key: status,
      label: MEETING_STATUS_LABELS[status],
      count:
        meetingStatusBreakdownRows.find((row) => row.status === status)?._count
          ._all ?? 0,
    })),
  };
}
