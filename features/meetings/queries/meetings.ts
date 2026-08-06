import "server-only";

import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export const meetingRegistrySelect = {
  id: true,
  title: true,
  description: true,
  venue: true,
  startsAt: true,
  endsAt: true,
  status: true,
  correspondence: {
    select: {
      id: true,
      referenceNumber: true,
      subject: true,
    },
  },
  organizerUser: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  chairpersonUser: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  _count: {
    select: {
      actionPoints: true,
      attachments: true,
    },
  },
} satisfies Prisma.MeetingSelect;

export type MeetingRegistryItem = Prisma.MeetingGetPayload<{
  select: typeof meetingRegistrySelect;
}>;

export async function getMeetingsList(organizationId: string) {
  if (!organizationId) return [];

  return db.meeting.findMany({
    where: {
      organizationId,
    },
    orderBy: [{ startsAt: "desc" }],
    select: meetingRegistrySelect,
  });
}

export async function getMeetingCreateOptions(organizationId: string) {
  if (!organizationId) {
    return {
      users: [],
      departments: [],
      correspondences: [],
    };
  }

  const [memberships, departments, correspondences] = await Promise.all([
    db.organizationMembership.findMany({
      where: {
        organizationId,
        status: "ACTIVE",
      },
      orderBy: [{ user: { name: "asc" } }],
      select: {
        userId: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    }),
    db.department.findMany({
      where: {
        organizationId,
        status: "ACTIVE",
      },
      orderBy: [{ name: "asc" }],
      select: {
        id: true,
        name: true,
        code: true,
      },
    }),
    db.correspondence.findMany({
      where: {
        organizationId,
      },
      orderBy: [{ receivedAt: "desc" }],
      take: 50,
      select: {
        id: true,
        referenceNumber: true,
        subject: true,
      },
    }),
  ]);

  return {
    users: memberships.map((membership) => ({
      id: membership.userId,
      label: membership.user.name || membership.user.email || "Unnamed member",
    })),
    departments: departments.map((department) => ({
      id: department.id,
      label: department.code
        ? `${department.name} (${department.code})`
        : department.name,
    })),
    correspondences: correspondences.map((correspondence) => ({
      id: correspondence.id,
      label: `${correspondence.referenceNumber} - ${correspondence.subject}`,
    })),
  };
}

export const meetingDetailSelect = {
  id: true,
  title: true,
  description: true,
  agenda: true,
  discussionSummary: true,
  resolutions: true,
  venue: true,
  startsAt: true,
  endsAt: true,
  status: true,
  correspondence: {
    select: {
      id: true,
      referenceNumber: true,
      subject: true,
    },
  },
  organizerUser: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  chairpersonUser: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  attachments: {
    orderBy: [{ createdAt: "desc" }],
    select: {
      id: true,
      originalName: true,
      mimeType: true,
      fileSize: true,
      storagePath: true,
      createdAt: true,
      uploadedByUser: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  },
  actionPoints: {
    orderBy: [{ createdAt: "desc" }],
    select: {
      id: true,
      actionPoint: true,
      dueDate: true,
      status: true,
      remarks: true,
      createdAt: true,
      assignedToUser: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      assignedToDepartment: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
      createdByUser: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  },
} satisfies Prisma.MeetingSelect;

function meetingRuntimeSupportsDecisions() {
  const runtimeModels = (
    db as typeof db & {
      _runtimeDataModel?: {
        models?: Record<string, { fields?: { name?: string }[] }>;
      };
    }
  )._runtimeDataModel?.models;

  return Boolean(
    runtimeModels?.Meeting?.fields?.some((field) => field.name === "decisions"),
  );
}

function getMeetingDetailSelect() {
  if (!meetingRuntimeSupportsDecisions()) {
    return meetingDetailSelect;
  }

  return {
    ...meetingDetailSelect,
    decisions: true,
  } satisfies Prisma.MeetingSelect;
}

export type MeetingDetailItem = Prisma.MeetingGetPayload<{
  select: typeof meetingDetailSelect;
}> & {
  decisions?: string | null;
};

export async function getMeetingDetail(
  organizationId: string,
  meetingId: string,
) {
  if (!organizationId || !meetingId) return null;

  return db.meeting.findFirst({
    where: {
      id: meetingId,
      organizationId,
    },
    select: getMeetingDetailSelect(),
  }) as Promise<MeetingDetailItem | null>;
}

export async function getMeetingActionPointAuditLogs(
  organizationId: string,
  actionPointIds: string[],
) {
  if (!organizationId || actionPointIds.length === 0) return [];

  return db.auditLog.findMany({
    where: {
      organizationId,
      entityType: "MeetingActionPoint",
      entityId: {
        in: actionPointIds,
      },
    },
    orderBy: [{ createdAt: "desc" }],
    select: {
      id: true,
      entityId: true,
      action: true,
      message: true,
      createdAt: true,
      actorUser: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

export async function getMyMeetingActionPoints(
  organizationId: string,
  userId: string,
) {
  if (!organizationId || !userId) return [];

  const membership = await db.organizationMembership.findFirst({
    where: {
      organizationId,
      userId,
      status: "ACTIVE",
    },
    select: {
      departmentId: true,
    },
  });

  return db.meetingActionPoint.findMany({
    where: {
      organizationId,
      OR: [
        { assignedToUserId: userId },
        ...(membership?.departmentId
          ? [{ assignedToDepartmentId: membership.departmentId }]
          : []),
      ],
    },
    orderBy: [{ dueDate: "asc" }],
    select: {
      id: true,
      actionPoint: true,
      dueDate: true,
      status: true,
      remarks: true,
      meeting: {
        select: {
          id: true,
          title: true,
          startsAt: true,
        },
      },
      assignedToUser: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      assignedToDepartment: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
    },
  });
}

export type MyMeetingActionPointItem = Awaited<
  ReturnType<typeof getMyMeetingActionPoints>
>[number];
