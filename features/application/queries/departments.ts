import "server-only";

import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export const departmentSummarySelect = {
  id: true,
  organizationId: true,
  name: true,
  code: true,
  description: true,
  status: true,
  headUserId: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.DepartmentSelect;

export type DepartmentSummary = Prisma.DepartmentGetPayload<{
  select: typeof departmentSummarySelect;
}>;

export async function getDepartmentsByOrganization(
  organizationId: string,
): Promise<DepartmentSummary[]> {
  if (!organizationId) return [];

  return db.department.findMany({
    where: { organizationId },
    orderBy: [{ name: "asc" }, { createdAt: "asc" }],
    select: departmentSummarySelect,
  });
}

export async function getDepartmentById(
  departmentId: string,
  organizationId: string,
): Promise<DepartmentSummary | null> {
  if (!departmentId || !organizationId) return null;

  return db.department.findFirst({
    where: {
      id: departmentId,
      organizationId,
    },
    select: departmentSummarySelect,
  });
}
