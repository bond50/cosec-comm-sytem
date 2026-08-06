"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireCurrentOrganization } from "@/features/auth/utils/current-organization";
import { getCurrentUser } from "@/features/auth/utils/current-user";
import {
  MissingOrganizationError,
  UnauthorizedError,
} from "@/features/auth/utils/auth-errors";
import {
  normalizeWorkspaceSearchKey,
  normalizeWorkspaceSearchText,
} from "@/features/application/lib/workspace-search";
import type { CorrespondenceActionState } from "@/features/correspondence/lib/correspondence-action-state";

const recordWorkspaceSearchSchema = z.object({
  query: z.string().trim().min(1).max(200),
});

const saveWorkspaceSearchSchema = z.object({
  query: z.string().trim().min(1).max(200),
  isSaved: z.enum(["true", "false"]).transform((value) => value === "true"),
});

type WorkspaceSearchHistoryValues = {
  query: string;
  isSaved?: string;
};

export type WorkspaceSearchHistoryActionState =
  CorrespondenceActionState<WorkspaceSearchHistoryValues>;

function getWorkspaceSearchDelegate() {
  return (
    db as typeof db & {
      workspaceSearch?: {
        upsert: (args: {
          where: {
            organizationId_userId_normalizedQuery: {
              organizationId: string;
              userId: string;
              normalizedQuery: string;
            };
          };
          update: Record<string, unknown>;
          create: Record<string, unknown>;
        }) => Promise<unknown>;
      };
    }
  ).workspaceSearch;
}

export async function recordWorkspaceSearchAction(
  _previousState: WorkspaceSearchHistoryActionState,
  formData: FormData,
): Promise<WorkspaceSearchHistoryActionState> {
  const values = {
    query: formData.get("query")?.toString() ?? "",
  };

  const parsed = recordWorkspaceSearchSchema.safeParse(values);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Search query is required.",
      fieldErrors: {
        query: parsed.error.flatten().fieldErrors.query,
      },
      values,
    };
  }

  const user = await getCurrentUser();
  if (!user) {
    return {
      ok: false,
      message: "You must be signed in to record search history.",
      values,
    };
  }

  let organizationId: string;

  try {
    const organization = await requireCurrentOrganization();
    organizationId = organization.id;
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return {
        ok: false,
        message: "You must be signed in to record search history.",
        values,
      };
    }

    if (error instanceof MissingOrganizationError) {
      return {
        ok: false,
        message:
          "An active organization is required before recording searches.",
        values,
      };
    }

    return {
      ok: false,
      message: "We could not verify the active organization right now.",
      values,
    };
  }

  const query = normalizeWorkspaceSearchText(parsed.data.query);
  const normalizedQuery = normalizeWorkspaceSearchKey(query);
  const workspaceSearch = getWorkspaceSearchDelegate();

  if (!workspaceSearch) {
    return {
      ok: false,
      message: "Workspace search history is not available right now.",
      values,
    };
  }

  await workspaceSearch.upsert({
    where: {
      organizationId_userId_normalizedQuery: {
        organizationId,
        userId: user.id,
        normalizedQuery,
      },
    },
    update: {
      query,
      searchCount: {
        increment: 1,
      },
      lastSearchedAt: new Date(),
    },
    create: {
      organizationId,
      userId: user.id,
      query,
      normalizedQuery,
    },
  });

  revalidatePath("/dashboard");

  return {
    ok: true,
    message: "Search recorded.",
    values: {
      query,
    },
  };
}

export async function saveWorkspaceSearchAction(
  _previousState: WorkspaceSearchHistoryActionState,
  formData: FormData,
): Promise<WorkspaceSearchHistoryActionState> {
  const values = {
    query: formData.get("query")?.toString() ?? "",
    isSaved: formData.get("isSaved")?.toString() ?? "false",
  };

  const parsed = saveWorkspaceSearchSchema.safeParse(values);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Invalid saved search request.",
      fieldErrors: {
        query: parsed.error.flatten().fieldErrors.query,
        isSaved: parsed.error.flatten().fieldErrors.isSaved,
      },
      values,
    };
  }

  const user = await getCurrentUser();
  if (!user) {
    return {
      ok: false,
      message: "You must be signed in to manage saved searches.",
      values,
    };
  }

  let organizationId: string;

  try {
    const organization = await requireCurrentOrganization();
    organizationId = organization.id;
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return {
        ok: false,
        message: "You must be signed in to manage saved searches.",
        values,
      };
    }

    if (error instanceof MissingOrganizationError) {
      return {
        ok: false,
        message: "An active organization is required before saving searches.",
        values,
      };
    }

    return {
      ok: false,
      message: "We could not verify the active organization right now.",
      values,
    };
  }

  const query = normalizeWorkspaceSearchText(parsed.data.query);
  const normalizedQuery = normalizeWorkspaceSearchKey(query);
  const workspaceSearch = getWorkspaceSearchDelegate();

  if (!workspaceSearch) {
    return {
      ok: false,
      message: "Workspace search history is not available right now.",
      values,
    };
  }

  await workspaceSearch.upsert({
    where: {
      organizationId_userId_normalizedQuery: {
        organizationId,
        userId: user.id,
        normalizedQuery,
      },
    },
    update: {
      query,
      isSaved: parsed.data.isSaved,
      lastSearchedAt: new Date(),
    },
    create: {
      organizationId,
      userId: user.id,
      query,
      normalizedQuery,
      isSaved: parsed.data.isSaved,
    },
  });

  revalidatePath("/dashboard");

  return {
    ok: true,
    message: parsed.data.isSaved
      ? "Search saved."
      : "Search removed from saved.",
    values: {
      query,
      isSaved: String(parsed.data.isSaved),
    },
  };
}
