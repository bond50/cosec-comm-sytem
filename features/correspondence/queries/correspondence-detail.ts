import "server-only";

import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { withCorrespondenceSla } from "@/features/correspondence/queries/correspondence-sla";

export const correspondenceDetailSelect = {
  id: true,
  organizationId: true,
  referenceNumber: true,
  type: true,
  subject: true,
  description: true,
  senderName: true,
  senderOffice: true,
  sourceType: true,
  sourceDepartment: {
    select: {
      id: true,
      name: true,
      code: true,
    },
  },
  deliveredBy: true,
  deliveryMethod: true,
  deliveryMethodOther: true,
  receivedAt: true,
  reviewedAt: true,
  instructions: true,
  priority: true,
  confidentiality: true,
  status: true,
  dueDate: true,
  closedAt: true,
  createdAt: true,
  updatedAt: true,
  receivedByUser: {
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
  assignedToDepartment: {
    select: {
      id: true,
      name: true,
      code: true,
      status: true,
      headUser: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  },
  assignedToUser: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  assignedByUser: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  _count: {
    select: {
      attachments: true,
      documents: true,
      dispatches: true,
      movements: true,
      auditLogs: true,
    },
  },
} satisfies Prisma.CorrespondenceSelect;

export type CorrespondenceDetail = Prisma.CorrespondenceGetPayload<{
  select: typeof correspondenceDetailSelect;
}>;

export type CorrespondenceDetailWithSla = CorrespondenceDetail & {
  isOverdue: boolean;
  daysRemaining: number | null;
};

export async function getCorrespondenceDetail(
  correspondenceId: string,
  organizationId: string,
): Promise<CorrespondenceDetailWithSla | null> {
  if (!correspondenceId || !organizationId) return null;

  const item = await db.correspondence.findFirst({
    where: {
      id: correspondenceId,
      organizationId,
    },
    select: correspondenceDetailSelect,
  });

  if (!item) return null;

  return withCorrespondenceSla(item);
}
