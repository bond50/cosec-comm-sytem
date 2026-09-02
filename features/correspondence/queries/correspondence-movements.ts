import "server-only";

import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export const correspondenceMovementSelect = {
  id: true,
  organizationId: true,
  correspondenceId: true,
  status: true,
  note: true,
  movedAt: true,
  createdAt: true,
  fromDepartment: {
    select: {
      id: true,
      name: true,
      code: true,
    },
  },
  fromUser: {
    select: {
      id: true,
      name: true,
      email: true,
      designation: true,
    },
  },
  toDepartment: {
    select: {
      id: true,
      name: true,
      code: true,
    },
  },
  toUser: {
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
} satisfies Prisma.CorrespondenceMovementSelect;

export type CorrespondenceMovementItem =
  Prisma.CorrespondenceMovementGetPayload<{
    select: typeof correspondenceMovementSelect;
  }>;

export async function getCorrespondenceMovements(
  correspondenceId: string,
  organizationId: string,
): Promise<CorrespondenceMovementItem[]> {
  if (!correspondenceId || !organizationId) return [];

  return db.correspondenceMovement.findMany({
    where: {
      correspondenceId,
      organizationId,
    },
    orderBy: [{ movedAt: "asc" }, { createdAt: "asc" }],
    select: correspondenceMovementSelect,
  });
}
