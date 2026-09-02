import "server-only";

import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export const correspondenceDispatchSelect = {
  id: true,
  organizationId: true,
  correspondenceId: true,
  dispatchDate: true,
  note: true,
  status: true,
  acknowledgedAt: true,
  feedbackReceivedAt: true,
  feedbackNote: true,
  dispatchedToDepartmentId: true,
  dispatchedToUserId: true,
  dispatchedToDepartment: {
    select: {
      id: true,
      name: true,
      code: true,
    },
  },
  dispatchedToUser: {
    select: {
      id: true,
      name: true,
      email: true,
      designation: true,
    },
  },
  acknowledgedByUser: {
    select: {
      id: true,
      name: true,
      email: true,
      designation: true,
    },
  },
  createdByUser: {
    select: {
      id: true,
      name: true,
      email: true,
      designation: true,
    },
  },
} satisfies Prisma.CorrespondenceDispatchSelect;

export type CorrespondenceDispatchItem =
  Prisma.CorrespondenceDispatchGetPayload<{
    select: typeof correspondenceDispatchSelect;
  }>;

export async function getCorrespondenceDispatches(
  correspondenceId: string,
  organizationId: string,
): Promise<CorrespondenceDispatchItem[]> {
  if (!correspondenceId || !organizationId) return [];

  return db.correspondenceDispatch.findMany({
    where: {
      correspondenceId,
      organizationId,
    },
    orderBy: [{ dispatchDate: "desc" }, { createdAt: "desc" }],
    select: correspondenceDispatchSelect,
  });
}
