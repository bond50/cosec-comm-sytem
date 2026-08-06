"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Bell,
  Clock3,
  LoaderCircle,
  Search,
  Star,
  X,
} from "lucide-react";
import type { UserRole } from "@prisma/client";
import type { NotificationItem } from "@/features/notifications/queries/notifications";
import {
  recordWorkspaceSearchAction,
  saveWorkspaceSearchAction,
} from "@/features/application/lib/workspace-search-history-actions";
import {
  getWorkspaceSearchHighlightTerms,
  parseSearchIntent,
} from "@/features/application/lib/workspace-search";
import { DashboardSearchHighlight } from "@/app/dashboard/dashboard-search-highlight";
import {
  hasCorrespondenceWorkspaceAccess,
  hasDocumentWorkspaceAccess,
  hasFoundationPermission,
  hasMeetingWorkspaceAccess,
} from "@/features/auth/utils/role-access";

type DashboardCommandPaletteProps = {
  open: boolean;
  onClose: () => void;
  currentQuery: string;
  roles: UserRole[] | null;
  notifications: NotificationItem[];
  searchHistory: {
    saved: {
      id: string;
      query: string;
      normalizedQuery: string;
      isSaved: boolean;
      searchCount: number;
      lastSearchedAt: Date;
    }[];
    recent: {
      id: string;
      query: string;
      normalizedQuery: string;
      isSaved: boolean;
      searchCount: number;
      lastSearchedAt: Date;
    }[];
    frequent: {
      id: string;
      query: string;
      normalizedQuery: string;
      isSaved: boolean;
      searchCount: number;
      lastSearchedAt: Date;
    }[];
    stats: {
      savedCount: number;
      recentCount: number;
      frequentCount: number;
    };
  };
};

type PaletteItem =
  | {
      id: string;
      title: string;
      subtitle: string;
      href: string;
      kind: "action";
    }
  | {
      id: string;
      title: string;
      subtitle: string;
      query: string;
      kind: "saved" | "recent" | "frequent" | "suggested";
    };

function extractReferenceCandidate(value: string) {
  const match = value.match(/[A-Z]{2,}(?:\/[A-Z0-9-]+){2,}/);
  return match?.[0] ?? null;
}

function getNotificationSuggestionQuery(notification: NotificationItem) {
  const referenceCandidate = extractReferenceCandidate(
    `${notification.title} ${notification.message}`,
  );

  if (referenceCandidate) {
    return referenceCandidate;
  }

  switch (notification.type) {
    case "CORRESPONDENCE_AWAITING_REVIEW":
    case "CORRESPONDENCE_REVIEW_RECORDED":
    case "CORRESPONDENCE_REOPENED":
      return "under review";
    case "CORRESPONDENCE_ROUTING_RECORDED":
      return "pending dispatches";
    case "CORRESPONDENCE_DISPATCH_ACKNOWLEDGED":
      return "in progress";
    case "CORRESPONDENCE_FEEDBACK_RETURNED":
      return "awaiting feedback";
    case "CORRESPONDENCE_CLOSED":
    case "CORRESPONDENCE_CANCELLED":
      return "closed";
    default:
      return notification.title;
  }
}

function getPaletteActions(roles: UserRole[] | null) {
  return [
    hasFoundationPermission(roles, "members.manage")
      ? {
          id: "add-member",
          title: "Add member",
          subtitle: "Create a member account or attach an existing user.",
          href: "/dashboard/members?create=1",
          kind: "action" as const,
        }
      : null,
    hasFoundationPermission(roles, "departments.manage")
      ? {
          id: "create-department",
          title: "Create entity",
          subtitle:
            "Open the entity register and add a department or municipality.",
          href: "/dashboard/departments?create=1",
          kind: "action" as const,
        }
      : null,
    hasCorrespondenceWorkspaceAccess(roles)
      ? {
          id: "register-correspondence",
          title: "Register correspondence",
          subtitle: "Open the county correspondence intake form.",
          href: "/dashboard/correspondences/register",
          kind: "action" as const,
        }
      : null,
    hasDocumentWorkspaceAccess(roles)
      ? {
          id: "open-documents",
          title: "Open documents",
          subtitle: "Go to the document registry.",
          href: "/dashboard/documents",
          kind: "action" as const,
        }
      : null,
    hasMeetingWorkspaceAccess(roles)
      ? {
          id: "my-action-points",
          title: "My action points",
          subtitle: "Open assigned meeting action points.",
          href: "/dashboard/meetings/action-points",
          kind: "action" as const,
        }
      : null,
  ].filter(
    (item): item is Extract<PaletteItem, { kind: "action" }> => item !== null,
  );
}

export function DashboardCommandPalette({
  open,
  onClose,
  currentQuery,
  roles,
  notifications,
  searchHistory,
}: DashboardCommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState(currentQuery);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isPending, startTransition] = useTransition();

  const items = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const intent = parseSearchIntent(query);
    const staticActions = getPaletteActions(roles).filter((item) => {
      if (!normalized) return true;
      return (
        item.title.toLowerCase().includes(normalized) ||
        item.subtitle.toLowerCase().includes(normalized) ||
        (intent && item.title.toLowerCase().includes(intent))
      );
    });

    const saved = searchHistory.saved
      .filter(
        (item) => !normalized || item.query.toLowerCase().includes(normalized),
      )
      .map((item) => ({
        id: `saved-${item.id}`,
        title: item.query,
        subtitle: "Saved search",
        query: item.query,
        kind: "saved" as const,
      }));

    const frequent = searchHistory.frequent
      .filter(
        (item) => !normalized || item.query.toLowerCase().includes(normalized),
      )
      .map((item) => ({
        id: `frequent-${item.id}`,
        title: item.query,
        subtitle: `${item.searchCount} search${item.searchCount === 1 ? "" : "es"}`,
        query: item.query,
        kind: "frequent" as const,
      }));

    const suggested = notifications
      .filter((item) => !item.readAt)
      .map((item) => ({
        id: `suggested-${item.id}`,
        title: getNotificationSuggestionQuery(item),
        subtitle: `Unread notification: ${item.title}`,
        query: getNotificationSuggestionQuery(item),
        kind: "suggested" as const,
      }))
      .filter(
        (item) => !normalized || item.title.toLowerCase().includes(normalized),
      );

    const recent = searchHistory.recent
      .filter(
        (item) => !normalized || item.query.toLowerCase().includes(normalized),
      )
      .map((item) => ({
        id: `recent-${item.id}`,
        title: item.query,
        subtitle: "Recent search",
        query: item.query,
        kind: "recent" as const,
      }));

    return [...staticActions, ...suggested, ...saved, ...frequent, ...recent];
  }, [
    notifications,
    query,
    roles,
    searchHistory.frequent,
    searchHistory.recent,
    searchHistory.saved,
  ]);

  const highlightTerms = useMemo(
    () => getWorkspaceSearchHighlightTerms(query),
    [query],
  );

  const submitSearch = useCallback(
    (nextQuery: string) => {
      const normalizedQuery = nextQuery.trim();
      if (!normalizedQuery) return;

      startTransition(async () => {
        const formData = new FormData();
        formData.set("query", normalizedQuery);
        await recordWorkspaceSearchAction({ ok: false, message: "" }, formData);
        onClose();
        router.push(`/dashboard?q=${encodeURIComponent(normalizedQuery)}`);
      });
    },
    [onClose, router, startTransition],
  );

  function saveCurrentSearch() {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.set("query", normalizedQuery);
      formData.set("isSaved", "true");
      await saveWorkspaceSearchAction({ ok: false, message: "" }, formData);
      router.refresh();
    });
  }

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setSelectedIndex((value) =>
          Math.min(value + 1, Math.max(items.length - 1, 0)),
        );
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setSelectedIndex((value) => Math.max(value - 1, 0));
      }

      if (event.key === "Enter" && items[selectedIndex]) {
        event.preventDefault();
        const item = items[selectedIndex];
        if (item.kind === "action") {
          onClose();
          router.push(item.href);
          return;
        }

        if (
          item.kind === "saved" ||
          item.kind === "recent" ||
          item.kind === "frequent" ||
          item.kind === "suggested"
        ) {
          submitSearch(item.query);
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [items, onClose, router, selectedIndex, open, submitSearch]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/35 px-4 py-8 backdrop-blur-sm">
      <div className="mx-auto w-full max-w-3xl rounded-[28px] border border-slate-200 bg-white shadow-[0_40px_120px_rgba(15,23,42,0.18)]">
        <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">
          <Search className="h-5 w-5 text-slate-400" />
          <form
            className="flex-1"
            onSubmit={(event) => {
              event.preventDefault();
              submitSearch(query);
            }}
          >
            <input
              autoFocus
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search workspace, open a page, or run a command"
              className="w-full border-0 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
            />
          </form>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {isPending ? (
          <div className="flex items-center gap-3 border-b border-slate-200 bg-[#e6f1f8] px-5 py-3 text-sm text-[#1868a6]">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            <span className="font-medium">
              Searching workspace for “{query.trim() || currentQuery}”...
            </span>
          </div>
        ) : null}

        <div className="grid gap-5 px-5 py-5 lg:grid-cols-[minmax(0,1fr)_220px]">
          <div className="space-y-3">
            {items.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-sm text-slate-500">
                No quick actions or saved searches match this input. Press Enter
                to search the workspace.
              </div>
            ) : (
              items.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  className={`flex w-full items-start justify-between rounded-2xl border px-4 py-3 text-left transition ${
                    selectedIndex === index
                      ? "border-[#1868a6] bg-[#e6f1f8]"
                      : "border-slate-200 hover:bg-slate-50"
                  } ${isPending ? "pointer-events-none opacity-60" : ""}`}
                  onMouseEnter={() => setSelectedIndex(index)}
                  onClick={() => {
                    if (item.kind === "action") {
                      onClose();
                      router.push(item.href);
                      return;
                    }

                    if (
                      item.kind === "saved" ||
                      item.kind === "recent" ||
                      item.kind === "frequent" ||
                      item.kind === "suggested"
                    ) {
                      submitSearch(item.query);
                    }
                  }}
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      <DashboardSearchHighlight
                        text={item.title}
                        query={query}
                      />
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      <DashboardSearchHighlight
                        text={item.subtitle}
                        query={query}
                        className="rounded bg-slate-200 px-0.5 text-slate-700"
                      />
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    {item.kind === "saved" ? (
                      <Star className="h-4 w-4" />
                    ) : null}
                    {item.kind === "recent" ? (
                      <Clock3 className="h-4 w-4" />
                    ) : null}
                    {item.kind === "frequent" ? (
                      <Search className="h-4 w-4" />
                    ) : null}
                    {item.kind === "suggested" ? (
                      <Bell className="h-4 w-4" />
                    ) : null}
                    {item.kind === "action" ? (
                      <ArrowRight className="h-4 w-4" />
                    ) : null}
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <div>
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Search analytics
              </p>
              <p className="mt-2 text-sm text-slate-600">
                Saved {searchHistory.stats.savedCount} · Recent{" "}
                {searchHistory.stats.recentCount} · Frequent{" "}
                {searchHistory.stats.frequentCount}
              </p>
            </div>

            <div className="space-y-2 text-sm text-slate-600">
              <p>
                <span className="font-medium text-slate-900">
                  Highlighting:
                </span>{" "}
                {highlightTerms.length > 0
                  ? highlightTerms.slice(0, 4).join(", ")
                  : "type to highlight matched terms"}
              </p>
              <p>
                <span className="font-medium text-slate-900">Commands:</span>{" "}
                add member, create entity, register correspondence
              </p>
              <p>
                <span className="font-medium text-slate-900">Open:</span> open
                transport entity, open road repair meeting
              </p>
              <p>
                <span className="font-medium text-slate-900">Filters:</span>{" "}
                urgent, overdue, awaiting feedback, members inactive
              </p>
              <p>
                <span className="font-medium text-slate-900">Keyboard:</span>{" "}
                Arrow keys, Enter, Esc
              </p>
            </div>

            {query.trim().length > 0 ? (
              <button
                type="button"
                disabled={isPending}
                className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-[#1868a6] px-4 text-sm font-medium text-white transition hover:bg-[#3447d4] disabled:cursor-not-allowed disabled:opacity-60"
                onClick={() => submitSearch(query)}
              >
                {isPending ? "Searching..." : "Search workspace"}
              </button>
            ) : null}

            {query.trim().length > 0 ? (
              <button
                type="button"
                disabled={isPending}
                onClick={() => saveCurrentSearch()}
                className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Save this search
              </button>
            ) : null}

            <Link
              href={
                query.trim()
                  ? `/dashboard?q=${encodeURIComponent(query.trim())}`
                  : "/dashboard"
              }
              className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:no-underline"
              onClick={onClose}
            >
              Open full results page
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
