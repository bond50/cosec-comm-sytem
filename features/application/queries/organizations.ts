import "server-only";

import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export const organizationSummarySelect = {
  id: true,
  name: true,
  slug: true,
  type: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.OrganizationSelect;

export type OrganizationSummary = Prisma.OrganizationGetPayload<{
  select: typeof organizationSummarySelect;
}>;

export async function getOrganizationById(
  id: string,
): Promise<OrganizationSummary | null> {
  if (!id) return null;

  return db.organization.findUnique({
    where: { id },
    select: organizationSummarySelect,
  });
}

export async function getOrganizationBySlug(
  slug: string,
): Promise<OrganizationSummary | null> {
  if (!slug) return null;

  return db.organization.findUnique({
    where: { slug },
    select: organizationSummarySelect,
  });
}
