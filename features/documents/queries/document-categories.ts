import "server-only";

import { db } from "@/lib/db";

export const documentCategorySelect = {
  id: true,
  name: true,
  description: true,
  _count: {
    select: {
      documents: true,
    },
  },
} as const;

export type DocumentCategoryItem = Awaited<
  ReturnType<typeof getDocumentCategories>
>[number];

export async function getDocumentCategories(organizationId: string) {
  if (!organizationId) return [];

  return db.documentCategory.findMany({
    where: {
      organizationId,
    },
    orderBy: [{ name: "asc" }],
    select: documentCategorySelect,
  });
}
