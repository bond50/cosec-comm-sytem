import type {
  ActionPointStatus,
  CorrespondencePriority,
  CorrespondenceStatus,
  DepartmentKind,
  DispatchStatus,
  DocumentStatus,
  MeetingStatus,
  UserRole,
} from "@prisma/client";

type SearchAlias = {
  phrase: string;
  expansions: string[];
};

type SearchIntent = "add" | "create" | "new" | "register" | "open" | null;

type SearchStatusTokens = {
  correspondenceStatuses: CorrespondenceStatus[];
  correspondencePriorities: CorrespondencePriority[];
  documentStatuses: DocumentStatus[];
  meetingStatuses: MeetingStatus[];
  actionPointStatuses: ActionPointStatus[];
  dispatchStatuses: DispatchStatus[];
  memberStatuses: ("ACTIVE" | "INACTIVE" | "INVITED" | "SUSPENDED")[];
  departmentKinds: DepartmentKind[];
  roleFilters: UserRole[];
  includeArchivedDocuments: boolean | null;
  overdueOnly: boolean;
  myActionPointsOnly: boolean;
  pendingDispatchesOnly: boolean;
};

type SearchCommand = {
  action: SearchIntent;
  entity:
    | "member"
    | "department"
    | "entity"
    | "correspondence"
    | "document"
    | "meeting"
    | "action-point"
    | null;
  target: string | null;
};

const SEARCH_ALIASES: SearchAlias[] = [
  {
    phrase: "registry",
    expansions: [
      "registry officer",
      "central office",
      "ocs hps",
      "ocs-hps",
      "office of the county secretary and head of public service",
    ],
  },
  {
    phrase: "cs",
    expansions: [
      "county secretary",
      "reviewing officer",
      "management",
      "central office",
      "office of the county secretary and head of public service",
    ],
  },
  {
    phrase: "county secretary",
    expansions: [
      "cs",
      "reviewing officer",
      "management",
      "central office",
      "office of the county secretary and head of public service",
    ],
  },
  {
    phrase: "transport",
    expansions: [
      "transport and infrastructure",
      "trn",
      "road",
      "roads",
      "road repair",
    ],
  },
  {
    phrase: "roads",
    expansions: [
      "road",
      "road repair",
      "transport",
      "transport and infrastructure",
      "trn",
    ],
  },
  {
    phrase: "finance",
    expansions: ["finance and economic planning", "fin", "budget", "treasury"],
  },
  {
    phrase: "hr",
    expansions: ["human resource", "personnel", "members", "staff"],
  },
  {
    phrase: "entity",
    expansions: ["department", "municipality", "office", "execution unit"],
  },
  {
    phrase: "municipality",
    expansions: ["entity", "department", "execution unit"],
  },
];

const STATUS_PHRASES = [
  "awaiting feedback",
  "under review",
  "in progress",
  "very urgent",
  "highly confidential",
  "pending dispatches",
  "my action points",
] as const;

export function normalizeWorkspaceSearchText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function normalizeWorkspaceSearchKey(value: string) {
  return normalizeWorkspaceSearchText(value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}/\s-]+/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenizeQuery(value: string) {
  return normalizeWorkspaceSearchKey(value).split(/\s+/).filter(Boolean);
}

export function parseSearchIntent(query: string): SearchIntent {
  const normalized = normalizeWorkspaceSearchKey(query);

  if (
    normalized.startsWith("add ") ||
    normalized === "add" ||
    normalized === "member"
  ) {
    return "add";
  }

  if (normalized.startsWith("create ") || normalized === "create") {
    return "create";
  }

  if (normalized.startsWith("new ") || normalized === "new") {
    return "new";
  }

  if (normalized.startsWith("register ") || normalized === "register") {
    return "register";
  }

  if (normalized.startsWith("open ") || normalized === "open") {
    return "open";
  }

  return null;
}

export function parseSearchCommand(query: string): SearchCommand {
  const normalized = normalizeWorkspaceSearchKey(query);
  const action = parseSearchIntent(normalized);

  if (!action) {
    return { action: null, entity: null, target: null };
  }

  const entityPatterns = [
    { entity: "member" as const, pattern: /\bmember(s)?\b/ },
    { entity: "department" as const, pattern: /\bdepartment(s)?\b/ },
    { entity: "entity" as const, pattern: /\bentit(y|ies)\b/ },
    { entity: "correspondence" as const, pattern: /\bcorrespondence\b/ },
    { entity: "document" as const, pattern: /\bdocument(s)?\b/ },
    { entity: "meeting" as const, pattern: /\bmeeting(s)?\b/ },
    { entity: "action-point" as const, pattern: /\baction point(s)?\b/ },
  ];

  const matchedEntity = entityPatterns.find(({ pattern }) =>
    pattern.test(normalized),
  );

  if (!matchedEntity) {
    return { action, entity: null, target: null };
  }

  const target = normalized
    .replace(new RegExp(`^${action}\\s+`), "")
    .replace(matchedEntity.pattern, "")
    .trim();

  return {
    action,
    entity: matchedEntity.entity,
    target: target || null,
  };
}

export function expandWorkspaceSearchTerms(query: string) {
  const normalized = normalizeWorkspaceSearchKey(query);
  const terms = new Set<string>([normalized]);

  tokenizeQuery(normalized).forEach((token) => terms.add(token));

  STATUS_PHRASES.forEach((phrase) => {
    if (normalized.includes(phrase)) {
      terms.add(phrase);
    }
  });

  SEARCH_ALIASES.forEach((alias) => {
    if (
      normalized === alias.phrase ||
      normalized.includes(alias.phrase) ||
      alias.expansions.some((value) => normalized.includes(value))
    ) {
      terms.add(alias.phrase);
      alias.expansions.forEach((value) => terms.add(value));
      tokenizeQuery(alias.expansions.join(" ")).forEach((token) =>
        terms.add(token),
      );
    }
  });

  return Array.from(terms).filter(Boolean);
}

export function getWorkspaceSearchHighlightTerms(query: string) {
  return expandWorkspaceSearchTerms(query)
    .map((term) => normalizeWorkspaceSearchKey(term))
    .filter((term) => term.length >= 2)
    .sort((left, right) => right.length - left.length);
}

export function getWorkspaceSearchStatusTokens(
  query: string,
): SearchStatusTokens {
  const normalized = normalizeWorkspaceSearchKey(query);
  const tokens = tokenizeQuery(normalized);

  const result: SearchStatusTokens = {
    correspondenceStatuses: [],
    correspondencePriorities: [],
    documentStatuses: [],
    meetingStatuses: [],
    actionPointStatuses: [],
    dispatchStatuses: [],
    memberStatuses: [],
    departmentKinds: [],
    roleFilters: [],
    includeArchivedDocuments: null,
    overdueOnly: false,
    myActionPointsOnly: false,
    pendingDispatchesOnly: false,
  };

  if (
    tokens.includes("urgent") ||
    normalized.includes("very urgent") ||
    tokens.includes("critical")
  ) {
    result.correspondencePriorities.push("URGENT", "VERY_URGENT", "CRITICAL");
  }

  if (normalized.includes("awaiting feedback")) {
    result.correspondenceStatuses.push("AWAITING_FEEDBACK");
  }

  if (normalized.includes("under review")) {
    result.correspondenceStatuses.push("UNDER_REVIEW");
  }

  if (normalized.includes("in progress")) {
    result.correspondenceStatuses.push("IN_PROGRESS");
    result.actionPointStatuses.push("IN_PROGRESS");
    result.dispatchStatuses.push("IN_PROGRESS");
  }

  if (tokens.includes("closed")) {
    result.correspondenceStatuses.push("CLOSED");
    result.documentStatuses.push("ARCHIVED");
    result.meetingStatuses.push("CLOSED", "COMPLETED");
  }

  if (tokens.includes("overdue")) {
    result.overdueOnly = true;
    result.dispatchStatuses.push("OVERDUE");
    result.actionPointStatuses.push("OVERDUE");
  }

  if (normalized.includes("pending dispatches")) {
    result.pendingDispatchesOnly = true;
    result.correspondenceStatuses.push("DISPATCHED");
    result.dispatchStatuses.push("SENT");
  }

  if (normalized.includes("documents archived")) {
    result.includeArchivedDocuments = true;
    result.documentStatuses.push("ARCHIVED");
  }

  if (normalized.includes("members inactive")) {
    result.memberStatuses.push("INACTIVE");
  }

  if (normalized.includes("my action points")) {
    result.myActionPointsOnly = true;
  }

  if (normalized.includes("registry officer") || normalized === "registry") {
    result.roleFilters.push("REGISTRY_OFFICER");
    result.departmentKinds.push("CENTRAL_OFFICE");
  }

  if (
    normalized.includes("management") ||
    normalized.includes("county secretary") ||
    normalized === "cs"
  ) {
    result.roleFilters.push("MANAGEMENT", "REVIEWING_OFFICER");
    result.departmentKinds.push("CENTRAL_OFFICE");
  }

  if (normalized.includes("department user")) {
    result.roleFilters.push("DEPARTMENT_USER");
    result.departmentKinds.push("EXECUTION");
  }

  return {
    ...result,
    correspondenceStatuses: Array.from(new Set(result.correspondenceStatuses)),
    correspondencePriorities: Array.from(
      new Set(result.correspondencePriorities),
    ),
    documentStatuses: Array.from(new Set(result.documentStatuses)),
    meetingStatuses: Array.from(new Set(result.meetingStatuses)),
    actionPointStatuses: Array.from(new Set(result.actionPointStatuses)),
    dispatchStatuses: Array.from(new Set(result.dispatchStatuses)),
    memberStatuses: Array.from(new Set(result.memberStatuses)),
    departmentKinds: Array.from(new Set(result.departmentKinds)),
    roleFilters: Array.from(new Set(result.roleFilters)),
  };
}

export function looksLikeReferenceQuery(query: string) {
  const normalized = normalizeWorkspaceSearchText(query);
  return (
    normalized.includes("/") ||
    /^[a-z]{2,6}[-/][a-z0-9-]+/i.test(normalized) ||
    /^[a-z]{2,10}\/[a-z]{2,10}\//i.test(normalized)
  );
}

export function scoreWorkspaceSearchText(
  query: string,
  candidates: Array<string | null | undefined>,
  boosts?: {
    exact?: number;
    startsWith?: number;
    contains?: number;
    alias?: number;
    reference?: number;
  },
) {
  const normalizedQuery = normalizeWorkspaceSearchKey(query);
  const expandedTerms = expandWorkspaceSearchTerms(query);
  const settings = {
    exact: boosts?.exact ?? 120,
    startsWith: boosts?.startsWith ?? 80,
    contains: boosts?.contains ?? 40,
    alias: boosts?.alias ?? 16,
    reference: boosts?.reference ?? 60,
  };

  let score = 0;

  for (const value of candidates) {
    if (!value) continue;

    const normalizedCandidate = normalizeWorkspaceSearchKey(value);
    if (!normalizedCandidate) continue;

    if (normalizedCandidate === normalizedQuery) {
      score = Math.max(score, settings.exact);
    } else if (normalizedCandidate.startsWith(normalizedQuery)) {
      score = Math.max(score, settings.startsWith);
    } else if (normalizedCandidate.includes(normalizedQuery)) {
      score = Math.max(score, settings.contains);
    }

    for (const term of expandedTerms) {
      if (term === normalizedQuery) continue;
      if (normalizedCandidate === term) {
        score = Math.max(score, settings.contains + settings.alias);
      } else if (normalizedCandidate.includes(term)) {
        score = Math.max(score, settings.alias);
      }
    }

    if (looksLikeReferenceQuery(query) && normalizedCandidate.includes("/")) {
      if (normalizedCandidate === normalizedQuery) {
        score += settings.reference;
      } else if (normalizedCandidate.startsWith(normalizedQuery)) {
        score += Math.round(settings.reference / 2);
      }
    }
  }

  return score;
}
