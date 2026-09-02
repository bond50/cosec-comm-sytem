import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  ClipboardList,
  FolderOpen,
  Search,
  Sparkles,
  Users,
  Workflow,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardSearchClientControls } from "@/app/dashboard/dashboard-search-client-controls";
import { DashboardSearchHighlight } from "@/app/dashboard/dashboard-search-highlight";
import { getPrimaryRoleLabel } from "@/features/auth/utils/role-access";
import { formatUserLabel } from "@/features/application/lib/user-label";
import type { WorkspaceSearchResults } from "@/features/application/queries/workspace-search";
import {
  getWorkspaceSearchHighlightTerms,
  looksLikeReferenceQuery,
  parseSearchIntent,
} from "@/features/application/lib/workspace-search";

type DashboardSearchResultsProps = {
  query: string;
  results: WorkspaceSearchResults;
  isSaved: boolean;
  scope: string;
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

const SEARCH_SCOPE_LABELS = {
  all: "All",
  "quick-actions": "Quick actions",
  "best-matches": "Best matches",
  "linked-workflow": "Linked workflow",
  correspondence: "Correspondence",
  documents: "Documents",
  meetings: "Meetings",
  "action-points": "Action points",
  members: "Members",
  departments: "Entities",
} as const;

type SearchScope = keyof typeof SEARCH_SCOPE_LABELS;

function normalizeSearchScope(value: string): SearchScope {
  return value in SEARCH_SCOPE_LABELS ? (value as SearchScope) : "all";
}

function makeScopeItem(key: SearchScope, count: number) {
  return {
    key,
    label: SEARCH_SCOPE_LABELS[key],
    count,
  };
}

function formatDateTime(value: Date | null | undefined) {
  if (!value) return "Not set";

  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function SearchSection({
  title,
  description,
  icon,
  count,
  children,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="border-b border-slate-100 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
              {icon}
            </div>
            <div>
              <CardTitle className="text-base text-slate-900">
                {title}
              </CardTitle>
              <p className="mt-1 text-sm text-slate-500">{description}</p>
            </div>
          </div>
          <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">
            {count}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-4">{children}</CardContent>
    </Card>
  );
}

function EmptyState({ query }: { query: string }) {
  return (
    <Card className="border-dashed border-slate-300 bg-white shadow-sm">
      <CardContent className="flex flex-col items-center justify-center px-6 py-14 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-100 text-slate-500">
          <Search className="h-6 w-6" />
        </div>
        <h2 className="mt-5 text-lg font-semibold text-slate-900">
          No workspace matches
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
          Nothing in correspondence, documents, meetings, action points,
          members, or entities matched
          <span className="font-medium text-slate-700"> {query}</span>.
        </p>
      </CardContent>
    </Card>
  );
}

function WhyMatched({ reasons }: { reasons?: string[] }) {
  if (!reasons || reasons.length === 0) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {reasons.slice(0, 3).map((reason) => (
        <span
          key={reason}
          className="rounded-full bg-slate-100 px-2.5 py-1 text-[0.68rem] font-medium text-slate-600"
        >
          {reason}
        </span>
      ))}
    </div>
  );
}

export function DashboardSearchResults({
  query,
  results,
  isSaved,
  scope,
  searchHistory,
}: DashboardSearchResultsProps) {
  const activeScope = normalizeSearchScope(scope);
  const highlightTerms = getWorkspaceSearchHighlightTerms(query);
  const searchUsage =
    searchHistory.saved.find(
      (item) => item.normalizedQuery === results.normalizedQuery,
    ) ??
    searchHistory.recent.find(
      (item) => item.normalizedQuery === results.normalizedQuery,
    ) ??
    searchHistory.frequent.find(
      (item) => item.normalizedQuery === results.normalizedQuery,
    );
  const searchIntent = parseSearchIntent(query);
  const isReferenceQuery = looksLikeReferenceQuery(query);
  const totalResults =
    results.bestMatches.length +
    results.linkedWorkflow.length +
    results.correspondences.length +
    results.documents.length +
    results.meetings.length +
    results.actionPoints.length +
    results.members.length +
    results.departments.length;

  const resultHrefs = [
    ...results.bestMatches.map((item) => item.href),
    ...results.linkedWorkflow.flatMap((item) => [
      item.correspondence.href,
      item.meeting.href,
    ]),
    ...results.quickActions.map((item) => item.href),
    ...results.correspondences.map(
      (item) => `/dashboard/correspondences/${item.id}`,
    ),
    ...results.documents.map((item) => `/dashboard/documents/${item.id}`),
    ...results.meetings.map((item) => `/dashboard/meetings/${item.id}`),
    ...results.actionPoints.map(
      (item) => `/dashboard/meetings/${item.meeting.id}`,
    ),
    ...results.members.map((item) => `/dashboard/members/${item.userId}`),
    ...results.departments.map((item) => `/dashboard/departments/${item.id}`),
  ];
  const scopeItems = [
    makeScopeItem("all", totalResults),
    makeScopeItem("quick-actions", results.quickActions.length),
    makeScopeItem("best-matches", results.bestMatches.length),
    makeScopeItem("linked-workflow", results.linkedWorkflow.length),
    makeScopeItem("correspondence", results.correspondences.length),
    makeScopeItem("documents", results.documents.length),
    makeScopeItem("meetings", results.meetings.length),
    makeScopeItem("action-points", results.actionPoints.length),
    makeScopeItem("members", results.members.length),
    makeScopeItem("departments", results.departments.length),
  ].filter((item) => item.count > 0 || item.key === "all");

  const showSection = (section: SearchScope) =>
    activeScope === "all" || activeScope === section;
  const activeScopeCount =
    scopeItems.find((item) => item.key === activeScope)?.count ?? 0;

  return (
    <div className="space-y-6">
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="flex flex-col gap-4 px-6 py-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Workspace search
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-950">
              Results for &quot;{query}&quot;
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Search runs across the current organization only. Use Arrow keys,
              Enter, and Esc for keyboard navigation.
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              {searchIntent ? (
                <span className="rounded-full bg-[#e6f1f8] px-3 py-1 font-medium text-[#1868a6]">
                  Intent: {searchIntent}
                </span>
              ) : null}
              {isReferenceQuery ? (
                <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
                  Reference-aware ranking
                </span>
              ) : null}
              {highlightTerms.length > 0 ? (
                <span className="rounded-full bg-amber-50 px-3 py-1 font-medium text-amber-800">
                  Highlighting {Math.min(highlightTerms.length, 4)} term
                  {highlightTerms.length === 1 ? "" : "s"}
                </span>
              ) : null}
              {searchUsage ? (
                <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
                  Used {searchUsage.searchCount} time
                  {searchUsage.searchCount === 1 ? "" : "s"}
                </span>
              ) : null}
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              {totalResults} ranked match{totalResults === 1 ? "" : "es"}
            </div>
            <DashboardSearchClientControls
              query={query}
              initiallySaved={isSaved}
              resultHrefs={resultHrefs}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardContent className="px-6 py-4">
          <div className="flex flex-wrap gap-2">
            {scopeItems.map((item) => (
              <Link
                key={item.key}
                href={
                  item.key === "all"
                    ? `/dashboard?q=${encodeURIComponent(query)}`
                    : `/dashboard?q=${encodeURIComponent(query)}&scope=${item.key}`
                }
                className={
                  activeScope === item.key
                    ? "inline-flex items-center gap-2 rounded-full border border-[#1868a6] bg-[#e6f1f8] px-3 py-1.5 text-xs font-semibold text-[#1868a6] hover:no-underline"
                    : "inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:no-underline"
                }
              >
                <span>{item.label}</span>
                <span className="rounded-full bg-white/80 px-2 py-0.5 text-[0.68rem]">
                  {item.count}
                </span>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {searchHistory.frequent.length > 0 ? (
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="px-6 py-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Search analytics
                </p>
                <h2 className="mt-2 text-lg font-semibold text-slate-950">
                  Frequent searches in this workspace
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Repeated searches help validate shortcuts, aliases, and common
                  office workflows.
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                {searchHistory.frequent.slice(0, 3).map((item) => (
                  <Link
                    key={`frequent-${item.id}`}
                    href={`/dashboard?q=${encodeURIComponent(item.query)}`}
                    data-search-result="true"
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm transition hover:bg-slate-100 hover:no-underline"
                  >
                    <p className="font-semibold text-slate-900">
                      <DashboardSearchHighlight
                        text={item.query}
                        query={query}
                      />
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {item.searchCount} search
                      {item.searchCount === 1 ? "" : "es"}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {totalResults === 0 ? <EmptyState query={query} /> : null}

      {totalResults > 0 && activeScope !== "all" && activeScopeCount === 0 ? (
        <Card className="border-dashed border-slate-300 bg-white shadow-sm">
          <CardContent className="px-6 py-10 text-center">
            <p className="text-sm font-semibold text-slate-900">
              No results in {SEARCH_SCOPE_LABELS[activeScope]}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              The query matched other sections, but not this one. Switch back to
              All or choose another section filter.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {showSection("quick-actions") && results.quickActions.length > 0 ? (
        <SearchSection
          title="Quick actions"
          description="Command-style shortcuts prioritized when the query looks like an intent."
          icon={<ArrowRight className="h-4.5 w-4.5" />}
          count={results.quickActions.length}
        >
          {results.quickActions.map((action) => (
            <Link
              key={action.id}
              href={action.href}
              data-search-result="true"
              className="block rounded-2xl border border-slate-200 px-4 py-3 transition hover:border-slate-300 hover:bg-slate-50 hover:no-underline focus:outline-none focus:ring-2 focus:ring-[#1868a6]/35"
            >
              <p className="text-sm font-semibold text-slate-900">
                <DashboardSearchHighlight text={action.title} query={query} />
              </p>
              <p className="mt-1 text-sm text-slate-500">
                <DashboardSearchHighlight
                  text={action.description}
                  query={query}
                />
              </p>
              <WhyMatched reasons={action.whyMatched} />
            </Link>
          ))}
        </SearchSection>
      ) : null}

      {showSection("best-matches") && results.bestMatches.length > 0 ? (
        <SearchSection
          title="Best matches"
          description="Exact references and high-confidence matches are ranked above looser partial matches."
          icon={<Sparkles className="h-4.5 w-4.5" />}
          count={results.bestMatches.length}
        >
          {results.bestMatches.map((item) => (
            <Link
              key={`${item.kind}-${item.id}`}
              href={item.href}
              data-search-result="true"
              className="block rounded-2xl border border-slate-200 px-4 py-3 transition hover:border-slate-300 hover:bg-slate-50 hover:no-underline focus:outline-none focus:ring-2 focus:ring-[#1868a6]/35"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">
                    <DashboardSearchHighlight text={item.title} query={query} />
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    <DashboardSearchHighlight
                      text={item.subtitle}
                      query={query}
                    />
                  </p>
                  <WhyMatched reasons={item.whyMatched} />
                </div>
                <div className="text-xs uppercase tracking-[0.14em] text-slate-400">
                  {item.kind.replaceAll("-", " ")}
                </div>
              </div>
            </Link>
          ))}
        </SearchSection>
      ) : null}

      {showSection("linked-workflow") && results.linkedWorkflow.length > 0 ? (
        <SearchSection
          title="Linked workflow"
          description="Cross-linked correspondence and meetings found in the same accountability chain."
          icon={<Workflow className="h-4.5 w-4.5" />}
          count={results.linkedWorkflow.length}
        >
          {results.linkedWorkflow.map((item) => (
            <div
              key={item.id}
              className="grid gap-3 rounded-2xl border border-slate-200 px-4 py-4 md:grid-cols-2"
            >
              <Link
                href={item.correspondence.href}
                data-search-result="true"
                className="rounded-2xl bg-slate-50 px-4 py-3 transition hover:bg-slate-100 hover:no-underline focus:outline-none focus:ring-2 focus:ring-[#1868a6]/35"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Correspondence
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {item.correspondence.referenceNumber}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  <DashboardSearchHighlight
                    text={item.correspondence.subject}
                    query={query}
                  />
                </p>
                <WhyMatched
                  reasons={
                    results.correspondences.find(
                      (entry) => entry.id === item.correspondence.id,
                    )?.whyMatched
                  }
                />
              </Link>
              <Link
                href={item.meeting.href}
                data-search-result="true"
                className="rounded-2xl bg-slate-50 px-4 py-3 transition hover:bg-slate-100 hover:no-underline focus:outline-none focus:ring-2 focus:ring-[#1868a6]/35"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Meeting
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {item.meeting.title}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  <DashboardSearchHighlight
                    text={item.meeting.venue || "Venue not set"}
                    query={query}
                  />
                </p>
                <WhyMatched
                  reasons={
                    results.meetings.find(
                      (entry) => entry.id === item.meeting.id,
                    )?.whyMatched
                  }
                />
              </Link>
            </div>
          ))}
        </SearchSection>
      ) : null}

      {showSection("correspondence") && results.correspondences.length > 0 ? (
        <SearchSection
          title="Correspondence"
          description="Matched by reference number, subject, sender, office, workflow status, or priority."
          icon={<ClipboardList className="h-4.5 w-4.5" />}
          count={results.correspondences.length}
        >
          {results.correspondences.map((item) => (
            <Link
              key={item.id}
              href={`/dashboard/correspondences/${item.id}`}
              data-search-result="true"
              className="block rounded-2xl border border-slate-200 px-4 py-3 transition hover:border-slate-300 hover:bg-slate-50 hover:no-underline focus:outline-none focus:ring-2 focus:ring-[#1868a6]/35"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">
                    <DashboardSearchHighlight
                      text={item.referenceNumber}
                      query={query}
                    />
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    <DashboardSearchHighlight
                      text={item.subject}
                      query={query}
                    />
                  </p>
                </div>
                <div className="text-xs uppercase tracking-[0.14em] text-slate-400">
                  {item.status.replaceAll("_", " ")}
                </div>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                <DashboardSearchHighlight
                  text={item.senderOffice || "No sender office"}
                  query={query}
                />{" "}
                · {item.priority.replaceAll("_", " ")} ·{" "}
                {formatDateTime(item.receivedAt)}
              </p>
              <WhyMatched reasons={item.whyMatched} />
            </Link>
          ))}
        </SearchSection>
      ) : null}

      {showSection("documents") && results.documents.length > 0 ? (
        <SearchSection
          title="Documents"
          description="Matched by reference, title, location, linked correspondence, or archive state."
          icon={<FolderOpen className="h-4.5 w-4.5" />}
          count={results.documents.length}
        >
          {results.documents.map((item) => (
            <Link
              key={item.id}
              href={`/dashboard/documents/${item.id}`}
              data-search-result="true"
              className="block rounded-2xl border border-slate-200 px-4 py-3 transition hover:border-slate-300 hover:bg-slate-50 hover:no-underline focus:outline-none focus:ring-2 focus:ring-[#1868a6]/35"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">
                    <DashboardSearchHighlight
                      text={item.referenceNumber || item.title}
                      query={query}
                    />
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    <DashboardSearchHighlight text={item.title} query={query} />
                  </p>
                </div>
                <div className="text-xs uppercase tracking-[0.14em] text-slate-400">
                  {item.isArchived
                    ? "Archived"
                    : item.status.replaceAll("_", " ")}
                </div>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                <DashboardSearchHighlight
                  text={item.currentLocation || "No current location"}
                  query={query}
                />
                {item.correspondence
                  ? ` · ${item.correspondence.referenceNumber}`
                  : ""}
              </p>
              <WhyMatched reasons={item.whyMatched} />
            </Link>
          ))}
        </SearchSection>
      ) : null}

      {showSection("meetings") && results.meetings.length > 0 ? (
        <SearchSection
          title="Meetings"
          description="Matched by meeting title, agenda, venue, and linked correspondence."
          icon={<CalendarDays className="h-4.5 w-4.5" />}
          count={results.meetings.length}
        >
          {results.meetings.map((item) => (
            <Link
              key={item.id}
              href={`/dashboard/meetings/${item.id}`}
              data-search-result="true"
              className="block rounded-2xl border border-slate-200 px-4 py-3 transition hover:border-slate-300 hover:bg-slate-50 hover:no-underline focus:outline-none focus:ring-2 focus:ring-[#1868a6]/35"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">
                    <DashboardSearchHighlight text={item.title} query={query} />
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    <DashboardSearchHighlight
                      text={item.venue || "Venue not set"}
                      query={query}
                    />
                  </p>
                </div>
                <div className="text-xs uppercase tracking-[0.14em] text-slate-400">
                  {item.status.replaceAll("_", " ")}
                </div>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                {formatDateTime(item.startsAt)}
                {item.correspondence
                  ? ` · ${item.correspondence.referenceNumber}`
                  : ""}
              </p>
              <WhyMatched reasons={item.whyMatched} />
            </Link>
          ))}
        </SearchSection>
      ) : null}

      {showSection("action-points") && results.actionPoints.length > 0 ? (
        <SearchSection
          title="Action points"
          description="Matched by task text, assignee, due date state, or current meeting context."
          icon={<Workflow className="h-4.5 w-4.5" />}
          count={results.actionPoints.length}
        >
          {results.actionPoints.map((item) => (
            <Link
              key={item.id}
              href={`/dashboard/meetings/${item.meeting.id}`}
              data-search-result="true"
              className="block rounded-2xl border border-slate-200 px-4 py-3 transition hover:border-slate-300 hover:bg-slate-50 hover:no-underline focus:outline-none focus:ring-2 focus:ring-[#1868a6]/35"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">
                    <DashboardSearchHighlight
                      text={item.actionPoint}
                      query={query}
                    />
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    <DashboardSearchHighlight
                      text={item.meeting.title}
                      query={query}
                    />
                  </p>
                </div>
                <div className="text-xs uppercase tracking-[0.14em] text-slate-400">
                  {item.status.replaceAll("_", " ")}
                </div>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Due {formatDateTime(item.dueDate)} ·{" "}
                {item.assignedToDepartment?.code ||
                  item.assignedToDepartment?.name ||
                  "No department"}{" "}
                · {formatUserLabel(item.assignedToUser, "No named user")}
              </p>
              <WhyMatched reasons={item.whyMatched} />
            </Link>
          ))}
        </SearchSection>
      ) : null}

      {showSection("members") && results.members.length > 0 ? (
        <SearchSection
          title="Members"
          description="Matched by name, email, role label, membership status, or assigned department."
          icon={<Users className="h-4.5 w-4.5" />}
          count={results.members.length}
        >
          {results.members.map((item) => (
            <Link
              key={item.userId}
              href={`/dashboard/members/${item.userId}`}
              data-search-result="true"
              className="block rounded-2xl border border-slate-200 px-4 py-3 transition hover:border-slate-300 hover:bg-slate-50 hover:no-underline focus:outline-none focus:ring-2 focus:ring-[#1868a6]/35"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">
                    <DashboardSearchHighlight
                      text={formatUserLabel(item.user, "Unnamed member")}
                      query={query}
                    />
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    <DashboardSearchHighlight
                      text={item.user.email || "No email"}
                      query={query}
                    />
                  </p>
                </div>
                <div className="text-xs uppercase tracking-[0.14em] text-slate-400">
                  {item.status}
                </div>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                {getPrimaryRoleLabel(item.roles)} ·{" "}
                {item.department
                  ? item.department.code
                    ? `${item.department.name} (${item.department.code})`
                    : item.department.name
                  : "No department assigned"}
              </p>
              <WhyMatched reasons={item.whyMatched} />
            </Link>
          ))}
        </SearchSection>
      ) : null}

      {showSection("departments") && results.departments.length > 0 ? (
        <SearchSection
          title="Entities"
          description="Matched by entity name, code, description, or central-office role language."
          icon={<Workflow className="h-4.5 w-4.5" />}
          count={results.departments.length}
        >
          {results.departments.map((item) => (
            <Link
              key={item.id}
              href={`/dashboard/departments/${item.id}`}
              data-search-result="true"
              className="block rounded-2xl border border-slate-200 px-4 py-3 transition hover:border-slate-300 hover:bg-slate-50 hover:no-underline focus:outline-none focus:ring-2 focus:ring-[#1868a6]/35"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">
                    <DashboardSearchHighlight text={item.name} query={query} />
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    <DashboardSearchHighlight
                      text={item.code || "No code"}
                      query={query}
                    />
                  </p>
                </div>
                <div className="text-xs uppercase tracking-[0.14em] text-slate-400">
                  {item.status}
                </div>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                {item.kind.replaceAll("_", " ")}
              </p>
              <WhyMatched reasons={item.whyMatched} />
            </Link>
          ))}
        </SearchSection>
      ) : null}
    </div>
  );
}
