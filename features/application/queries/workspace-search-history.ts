import "server-only";

import { db } from "@/lib/db";

function getWorkspaceSearchDelegate() {
  return (
    db as typeof db & {
      workspaceSearch?: {
        findMany: (args: {
          where: {
            organizationId: string;
            userId: string;
          };
          orderBy: Array<{
            isSaved?: "asc" | "desc";
            lastSearchedAt?: "asc" | "desc";
          }>;
          take: number;
          select: Record<string, boolean>;
        }) => Promise<
          {
            id: string;
            query: string;
            normalizedQuery: string;
            isSaved: boolean;
            searchCount: number;
            lastSearchedAt: Date;
          }[]
        >;
      };
    }
  ).workspaceSearch;
}

export async function getWorkspaceSearchHistory(
  organizationId?: string | null,
  userId?: string | null,
) {
  if (!organizationId || !userId) {
    return {
      saved: [],
      recent: [],
      frequent: [],
      stats: {
        savedCount: 0,
        recentCount: 0,
        frequentCount: 0,
      },
    };
  }

  const workspaceSearch = getWorkspaceSearchDelegate();
  if (!workspaceSearch) {
    return {
      saved: [],
      recent: [],
      frequent: [],
      stats: {
        savedCount: 0,
        recentCount: 0,
        frequentCount: 0,
      },
    };
  }

  const items = await workspaceSearch.findMany({
    where: {
      organizationId,
      userId,
    },
    orderBy: [{ isSaved: "desc" }, { lastSearchedAt: "desc" }],
    take: 16,
    select: {
      id: true,
      query: true,
      normalizedQuery: true,
      isSaved: true,
      searchCount: true,
      lastSearchedAt: true,
    },
  });

  const saved = items.filter((item) => item.isSaved).slice(0, 8);
  const recent = items.filter((item) => !item.isSaved).slice(0, 8);
  const frequent = [...items]
    .sort((left, right) => {
      if (right.searchCount !== left.searchCount) {
        return right.searchCount - left.searchCount;
      }
      return right.lastSearchedAt.getTime() - left.lastSearchedAt.getTime();
    })
    .slice(0, 8);

  return {
    saved,
    recent,
    frequent,
    stats: {
      savedCount: saved.length,
      recentCount: recent.length,
      frequentCount: frequent.length,
    },
  };
}
