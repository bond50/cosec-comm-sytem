import "server-only";

import {
  type CorrespondenceConfidentiality,
  type CorrespondencePriority,
  type CorrespondenceStatus,
  type CorrespondenceType,
  type Prisma,
} from "@prisma/client";
import { db } from "@/lib/db";
import { withCorrespondenceSla } from "@/features/correspondence/queries/correspondence-sla";

export type CorrespondenceDateRange = {
  from?: Date | string | null;
  to?: Date | string | null;
};

export type CorrespondenceAssigneeFilter = {
  departmentId?: string | null;
  userId?: string | null;
};

export type CorrespondenceListFilters = {
  search?: string | null;
  type?: CorrespondenceType | null;
  status?: CorrespondenceStatus | null;
  priority?: CorrespondencePriority | null;
  confidentiality?: CorrespondenceConfidentiality | null;
  assignee?: CorrespondenceAssigneeFilter | null;
  receivedAt?: CorrespondenceDateRange | null;
  dueDate?: CorrespondenceDateRange | null;
};

export const correspondenceListSelect = {
  id: true,
  organizationId: true,
  referenceNumber: true,
  type: true,
  subject: true,
  senderName: true,
  senderOffice: true,
  deliveryMethod: true,
  receivedAt: true,
  priority: true,
  confidentiality: true,
  status: true,
  dueDate: true,
  assignedToDepartmentId: true,
  assignedToUserId: true,
  assignedToDepartment: {
    select: {
      id: true,
      name: true,
      code: true,
    },
  },
  assignedToUser: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  reviewedByUser: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  receivedByUser: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CorrespondenceSelect;

export type CorrespondenceListItem = Prisma.CorrespondenceGetPayload<{
  select: typeof correspondenceListSelect;
}>;

export type CorrespondenceListItemWithSla = CorrespondenceListItem & {
  isOverdue: boolean;
  daysRemaining: number | null;
};

function normalizeTextInput(value: string | null | undefined): string | null {
  const normalized = value?.trim();

  return normalized ? normalized : null;
}

function normalizeDateInput(
  value: Date | string | null | undefined,
): Date | null {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function buildCorrespondenceAssigneeWhere(
  assignee?: CorrespondenceAssigneeFilter | null,
): Prisma.CorrespondenceWhereInput {
  if (!assignee) return {};

  const departmentId = assignee.departmentId?.trim();
  const userId = assignee.userId?.trim();

  return {
    ...(departmentId ? { assignedToDepartmentId: departmentId } : {}),
    ...(userId ? { assignedToUserId: userId } : {}),
  };
}

export function buildCorrespondenceDateRangeWhere(
  field: "receivedAt" | "dueDate",
  range?: CorrespondenceDateRange | null,
): Prisma.CorrespondenceWhereInput {
  if (!range) return {};

  const from = normalizeDateInput(range.from);
  const to = normalizeDateInput(range.to);

  if (!from && !to) return {};

  return {
    [field]: {
      ...(from ? { gte: from } : {}),
      ...(to ? { lte: to } : {}),
    },
  } satisfies Prisma.CorrespondenceWhereInput;
}

export function buildCorrespondenceListWhere(
  organizationId: string,
  filters: CorrespondenceListFilters = {},
): Prisma.CorrespondenceWhereInput {
  const search = normalizeTextInput(filters.search);
  const assigneeWhere = buildCorrespondenceAssigneeWhere(filters.assignee);
  const receivedAtWhere = buildCorrespondenceDateRangeWhere(
    "receivedAt",
    filters.receivedAt,
  );
  const dueDateWhere = buildCorrespondenceDateRangeWhere(
    "dueDate",
    filters.dueDate,
  );

  return {
    organizationId,
    ...(filters.type ? { type: filters.type } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.priority ? { priority: filters.priority } : {}),
    ...(filters.confidentiality
      ? { confidentiality: filters.confidentiality }
      : {}),
    ...assigneeWhere,
    ...receivedAtWhere,
    ...dueDateWhere,
    ...(search
      ? {
          OR: [
            { referenceNumber: { contains: search, mode: "insensitive" } },
            { subject: { contains: search, mode: "insensitive" } },
            { senderName: { contains: search, mode: "insensitive" } },
            { senderOffice: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };
}

export async function getCorrespondenceList(
  organizationId: string,
  filters: CorrespondenceListFilters = {},
): Promise<CorrespondenceListItemWithSla[]> {
  if (!organizationId) return [];

  const items = await db.correspondence.findMany({
    where: buildCorrespondenceListWhere(organizationId, filters),
    orderBy: [{ receivedAt: "desc" }, { createdAt: "desc" }],
    select: correspondenceListSelect,
  });

  return items.map((item) => withCorrespondenceSla(item));
}
