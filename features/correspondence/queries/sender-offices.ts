import "server-only";

import { db } from "@/lib/db";

export type SenderOfficeSuggestion = {
  id: string;
  name: string;
  usageCount: number;
  lastUsedAt: Date;
};

export function normalizeSenderOfficeName(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

export async function getSenderOfficeSuggestions(
  organizationId: string,
): Promise<SenderOfficeSuggestion[]> {
  if (!organizationId) return [];

  const senderOfficeDirectory = (
    db as typeof db & {
      correspondenceSenderOffice?: {
        findMany: (args: unknown) => Promise<SenderOfficeSuggestion[]>;
      };
    }
  ).correspondenceSenderOffice;

  if (!senderOfficeDirectory) {
    return [];
  }

  return senderOfficeDirectory.findMany({
    where: {
      organizationId,
    },
    orderBy: [{ usageCount: "desc" }, { lastUsedAt: "desc" }, { name: "asc" }],
    take: 12,
    select: {
      id: true,
      name: true,
      usageCount: true,
      lastUsedAt: true,
    },
  });
}
