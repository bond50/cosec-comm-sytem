import "server-only";

import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export const correspondenceAuditSelect = {
  id: true,
  action: true,
  message: true,
  createdAt: true,
  actorUser: {
    select: {
      id: true,
      name: true,
      email: true,
      designation: true,
    },
  },
} satisfies Prisma.AuditLogSelect;

export type CorrespondenceAuditItem = Prisma.AuditLogGetPayload<{
  select: typeof correspondenceAuditSelect;
}>;

export async function getCorrespondenceAuditLogs(
  correspondenceId: string,
  organizationId: string,
): Promise<CorrespondenceAuditItem[]> {
  if (!correspondenceId || !organizationId) return [];

  return db.auditLog.findMany({
    where: {
      organizationId,
      correspondenceId,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 12,
    select: correspondenceAuditSelect,
  });
}
