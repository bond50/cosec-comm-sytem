import "server-only";

import { Prisma, type UserRole } from "@prisma/client";
import { db } from "@/lib/db";
import {
  expandWorkspaceSearchTerms,
  getWorkspaceSearchStatusTokens,
  looksLikeReferenceQuery,
  normalizeWorkspaceSearchKey,
  normalizeWorkspaceSearchText,
  parseSearchCommand,
  parseSearchIntent,
  scoreWorkspaceSearchText,
} from "@/features/application/lib/workspace-search";
import {
  ROLE_DEFINITIONS,
  getRoleLabels,
} from "@/features/auth/utils/role-access";
import {
  hasCorrespondenceWorkspaceAccess,
  hasDocumentWorkspaceAccess,
  hasFoundationPermission,
  hasMeetingWorkspaceAccess,
} from "@/features/auth/utils/role-access";

type WorkspaceSearchArgs = {
  organizationId: string;
  query: string;
  roles: UserRole[] | null;
  userId?: string | null;
};

export type WorkspaceQuickAction = {
  id: string;
  title: string;
  description: string;
  href: string;
  whyMatched?: string[];
};

export type WorkspaceBestMatch = {
  id: string;
  kind:
    | "quick-action"
    | "correspondence"
    | "document"
    | "meeting"
    | "member"
    | "department"
    | "entity"
    | "action-point";
  title: string;
  subtitle: string;
  href: string;
  score: number;
  whyMatched: string[];
};

export type WorkspaceLinkedWorkflowHit = {
  id: string;
  correspondence: {
    id: string;
    referenceNumber: string;
    subject: string;
    href: string;
  };
  meeting: {
    id: string;
    title: string;
    venue: string | null;
    href: string;
  };
};

export type WorkspaceCorrespondenceHit = {
  id: string;
  referenceNumber: string;
  subject: string;
  status: string;
  priority: string;
  senderOffice: string | null;
  receivedAt: Date;
  dueDate: Date | null;
  assignedToDepartment: {
    id: string;
    name: string;
    code: string | null;
  } | null;
  assignedToUser: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
  meetings: Array<{
    id: string;
    title: string;
    venue: string | null;
  }>;
  score: number;
  whyMatched: string[];
};

export type WorkspaceDocumentHit = {
  id: string;
  title: string;
  referenceNumber: string | null;
  status: string;
  currentLocation: string | null;
  isArchived: boolean;
  correspondence: {
    id: string;
    referenceNumber: string;
    subject: string;
  } | null;
  score: number;
  whyMatched: string[];
};

export type WorkspaceMeetingHit = {
  id: string;
  title: string;
  venue: string | null;
  startsAt: Date;
  status: string;
  correspondence: {
    id: string;
    referenceNumber: string;
    subject: string;
  } | null;
  score: number;
  whyMatched: string[];
};

export type WorkspaceActionPointHit = {
  id: string;
  actionPoint: string;
  dueDate: Date | null;
  status: string;
  remarks: string | null;
  meeting: {
    id: string;
    title: string;
  };
  assignedToDepartment: {
    id: string;
    name: string;
    code: string | null;
  } | null;
  assignedToUser: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
  score: number;
  whyMatched: string[];
};

export type WorkspaceMemberHit = {
  userId: string;
  status: string;
  roles: UserRole[];
  user: {
    name: string | null;
    email: string | null;
  };
  department: {
    id: string;
    name: string;
    code: string | null;
    kind: string;
  } | null;
  score: number;
  whyMatched: string[];
};

export type WorkspaceDepartmentHit = {
  id: string;
  name: string;
  code: string | null;
  kind: string;
  status: string;
  score: number;
  whyMatched: string[];
};

export type WorkspaceSearchResults = {
  query: string;
  normalizedQuery: string;
  isIntentQuery: boolean;
  quickActions: WorkspaceQuickAction[];
  bestMatches: WorkspaceBestMatch[];
  linkedWorkflow: WorkspaceLinkedWorkflowHit[];
  correspondences: WorkspaceCorrespondenceHit[];
  documents: WorkspaceDocumentHit[];
  meetings: WorkspaceMeetingHit[];
  actionPoints: WorkspaceActionPointHit[];
  members: WorkspaceMemberHit[];
  departments: WorkspaceDepartmentHit[];
};

function normalizeQuery(query: string) {
  return normalizeWorkspaceSearchText(query);
}

function containsInsensitive(term: string) {
  return {
    contains: term,
    mode: Prisma.QueryMode.insensitive,
  };
}

function meetingRuntimeSupportsDecisions() {
  const runtimeModels = (
    db as typeof db & {
      _runtimeDataModel?: {
        models?: Record<string, { fields?: { name?: string }[] }>;
      };
    }
  )._runtimeDataModel?.models;

  return Boolean(
    runtimeModels?.Meeting?.fields?.some((field) => field.name === "decisions"),
  );
}

function getMatchedRoles(query: string) {
  const normalizedQuery = normalizeWorkspaceSearchKey(query);

  if (!normalizedQuery) return [];

  return ROLE_DEFINITIONS.filter((definition) => {
    const normalizedRole = definition.role.toLowerCase().replaceAll("_", " ");
    const normalizedLabel = definition.label.toLowerCase();

    return (
      normalizedRole.includes(normalizedQuery) ||
      normalizedLabel.includes(normalizedQuery)
    );
  }).map((definition) => definition.role);
}

function dedupeQuickActions(actions: WorkspaceQuickAction[]) {
  const seen = new Set<string>();
  return actions.filter((action) => {
    if (seen.has(action.id)) return false;
    seen.add(action.id);
    return true;
  });
}

function getStaticWorkspaceQuickActions(
  query: string,
  roles: UserRole[] | null,
): WorkspaceQuickAction[] {
  const normalizedQuery = normalizeWorkspaceSearchKey(query);
  const intent = parseSearchIntent(query);

  const actions = [
    {
      id: "members-add",
      title: "Add member",
      description: "Create a member account or attach an existing user.",
      href: "/dashboard/members?create=1",
      keywords: ["add member", "create member", "new member", "member", "user"],
      allowed: hasFoundationPermission(roles, "members.manage"),
    },
    {
      id: "departments-create",
      title: "Create entity",
      description:
        "Open the entity register and add a department or municipality.",
      href: "/dashboard/departments",
      keywords: [
        "create entity",
        "add entity",
        "new entity",
        "create department",
        "add department",
        "new department",
        "department",
        "entity",
        "municipality",
      ],
      allowed: hasFoundationPermission(roles, "departments.manage"),
    },
    {
      id: "correspondence-register",
      title: "Register correspondence",
      description: "Open the intake form for a new correspondence record.",
      href: "/dashboard/correspondences/register",
      keywords: [
        "register correspondence",
        "add correspondence",
        "new correspondence",
        "create correspondence",
        "correspondence",
      ],
      allowed: hasFoundationPermission(roles, "correspondence.register"),
    },
    {
      id: "documents-create",
      title: "Create document",
      description: "Open the document registry create form.",
      href: "/dashboard/documents",
      keywords: ["create document", "add document", "new document", "document"],
      allowed: hasFoundationPermission(roles, "documents.manage"),
    },
    {
      id: "documents-category",
      title: "Create document category",
      description: "Open the document category form in the registry workspace.",
      href: "/dashboard/documents",
      keywords: [
        "create category",
        "add category",
        "document category",
        "category",
      ],
      allowed: hasFoundationPermission(roles, "documents.manage"),
    },
    {
      id: "meetings-create",
      title: "Create meeting",
      description: "Open the meeting workspace and schedule a new meeting.",
      href: "/dashboard/meetings",
      keywords: ["create meeting", "add meeting", "new meeting", "meeting"],
      allowed: hasFoundationPermission(roles, "meetings.manage"),
    },
    {
      id: "meetings-action-points",
      title: "Open my action points",
      description: "Go to the meeting action point register for assigned work.",
      href: "/dashboard/meetings/action-points",
      keywords: ["action point", "my action points", "tasks", "meeting tasks"],
      allowed: hasMeetingWorkspaceAccess(roles),
    },
    {
      id: "access-roles",
      title: "Open roles and access",
      description: "Review role matrix and workspace permissions.",
      href: "/dashboard/access",
      keywords: ["roles", "access", "permissions", "role matrix"],
      allowed: hasFoundationPermission(roles, "access.view"),
    },
    {
      id: "shortcut-pending-dispatches",
      title: "Pending dispatches",
      description:
        "Review correspondence already routed and awaiting dispatch follow-through.",
      href: "/dashboard/correspondences",
      keywords: ["pending dispatches", "dispatches", "dispatch queue"],
      allowed: hasCorrespondenceWorkspaceAccess(roles),
    },
    {
      id: "shortcut-documents-archived",
      title: "Archived documents",
      description: "Open the document registry and review archived records.",
      href: "/dashboard/documents",
      keywords: ["documents archived", "archived documents", "archive"],
      allowed: hasDocumentWorkspaceAccess(roles),
    },
    {
      id: "shortcut-members-inactive",
      title: "Inactive members",
      description: "Open the members workspace and review inactive accounts.",
      href: "/dashboard/members",
      keywords: ["members inactive", "inactive members"],
      allowed: hasFoundationPermission(roles, "members.view"),
    },
  ];

  return actions
    .filter((action) => action.allowed)
    .filter((action) => {
      const directMatch = action.keywords.some(
        (keyword) =>
          keyword.includes(normalizedQuery) ||
          normalizedQuery.includes(keyword),
      );

      const intentMatch =
        intent &&
        action.keywords.some((keyword) =>
          keyword.startsWith(intent === "register" ? "register" : intent),
        );

      return directMatch || Boolean(intentMatch);
    })
    .map(({ id, title, description, href }) => ({
      id,
      title,
      description,
      href,
      whyMatched: [
        intent
          ? `Matches ${intent} command intent`
          : "Matches quick workspace action",
      ],
    }));
}

function buildContainsFilters<T>(
  terms: string[],
  builder: (term: string) => T,
): T[] {
  return terms.filter((term) => term.length >= 2).map((term) => builder(term));
}

function scoreRoleMatch(query: string, roles: UserRole[]) {
  return scoreWorkspaceSearchText(query, [
    ...roles.map((role) => role.replaceAll("_", " ")),
    ...getRoleLabels(roles),
  ]);
}

function scoreExactReferenceBoost(
  query: string,
  referenceNumber?: string | null,
) {
  if (!referenceNumber) return 0;
  if (!looksLikeReferenceQuery(query)) return 0;

  const normalizedQuery = normalizeWorkspaceSearchKey(query);
  const normalizedReference = normalizeWorkspaceSearchKey(referenceNumber);

  if (normalizedReference === normalizedQuery) return 200;
  if (normalizedReference.startsWith(normalizedQuery)) return 120;
  return 0;
}

function sortByScore<T extends { score: number }>(items: T[]) {
  return items.sort((left, right) => right.score - left.score);
}

function matchesSearchTerms(
  searchTerms: string[],
  value: string | null | undefined,
) {
  if (!value) return false;
  const normalizedValue = normalizeWorkspaceSearchKey(value);
  return searchTerms.some((term) => normalizedValue.includes(term));
}

function dedupeReasons(reasons: string[]) {
  return Array.from(new Set(reasons)).slice(0, 3);
}

export async function getWorkspaceSearchResults({
  organizationId,
  query,
  roles,
  userId,
}: WorkspaceSearchArgs): Promise<WorkspaceSearchResults> {
  const normalizedQuery = normalizeQuery(query);
  const normalizedKey = normalizeWorkspaceSearchKey(normalizedQuery);
  const matchedRoles = getMatchedRoles(normalizedQuery);
  const statusTokens = getWorkspaceSearchStatusTokens(normalizedQuery);
  const searchTerms = expandWorkspaceSearchTerms(normalizedQuery);
  const quickActions = getStaticWorkspaceQuickActions(normalizedQuery, roles);
  const command = parseSearchCommand(normalizedQuery);

  if (!organizationId || normalizedKey.length === 0) {
    return {
      query: normalizedQuery,
      normalizedQuery: normalizedKey,
      isIntentQuery: Boolean(parseSearchIntent(normalizedQuery)),
      quickActions,
      bestMatches: [],
      linkedWorkflow: [],
      correspondences: [],
      documents: [],
      meetings: [],
      actionPoints: [],
      members: [],
      departments: [],
    };
  }

  const canViewCorrespondence = hasCorrespondenceWorkspaceAccess(roles);
  const canViewDocuments = hasDocumentWorkspaceAccess(roles);
  const canViewMeetings = hasMeetingWorkspaceAccess(roles);
  const canViewMembers = hasFoundationPermission(roles, "members.view");
  const canViewDepartments = hasFoundationPermission(roles, "departments.view");

  const membership = userId
    ? await db.organizationMembership.findFirst({
        where: {
          organizationId,
          userId,
          status: "ACTIVE",
        },
        select: {
          departmentId: true,
        },
      })
    : null;

  const meetingSearchOrFilters: Prisma.MeetingWhereInput[] = [
    ...buildContainsFilters(searchTerms, (term) => ({
      title: containsInsensitive(term),
    })),
    ...buildContainsFilters(searchTerms, (term) => ({
      description: containsInsensitive(term),
    })),
    ...buildContainsFilters(searchTerms, (term) => ({
      agenda: containsInsensitive(term),
    })),
    ...buildContainsFilters(searchTerms, (term) => ({
      venue: containsInsensitive(term),
    })),
    ...buildContainsFilters(searchTerms, (term) => ({
      discussionSummary: containsInsensitive(term),
    })),
    ...buildContainsFilters(searchTerms, (term) => ({
      resolutions: containsInsensitive(term),
    })),
    {
      actionPoints: {
        some: {
          OR: [
            ...buildContainsFilters(searchTerms, (term) => ({
              actionPoint: containsInsensitive(term),
            })),
            ...buildContainsFilters(searchTerms, (term) => ({
              remarks: containsInsensitive(term),
            })),
            ...buildContainsFilters(searchTerms, (term) => ({
              assignedToDepartment: {
                name: containsInsensitive(term),
              },
            })),
            ...buildContainsFilters(searchTerms, (term) => ({
              assignedToUser: {
                name: containsInsensitive(term),
              },
            })),
          ],
        },
      },
    },
  ];

  if (meetingRuntimeSupportsDecisions()) {
    meetingSearchOrFilters.push(
      ...buildContainsFilters(searchTerms, (term) => ({
        decisions: containsInsensitive(term),
      })),
    );
  }

  const now = new Date();

  const [
    correspondencesRaw,
    documentsRaw,
    meetingsRaw,
    actionPointsRaw,
    membersRaw,
    departmentsRaw,
  ]: [
    Omit<WorkspaceCorrespondenceHit, "score">[],
    Omit<WorkspaceDocumentHit, "score">[],
    Omit<WorkspaceMeetingHit, "score">[],
    Omit<WorkspaceActionPointHit, "score">[],
    Omit<WorkspaceMemberHit, "score">[],
    Omit<WorkspaceDepartmentHit, "score">[],
  ] = await Promise.all([
    canViewCorrespondence
      ? (db.correspondence.findMany({
          where: {
            organizationId,
            ...(statusTokens.overdueOnly
              ? {
                  dueDate: { lt: now },
                  status: {
                    notIn: ["CANCELLED", "CLOSED", "COMPLETED"],
                  },
                }
              : {}),
            OR: [
              ...buildContainsFilters(searchTerms, (term) => ({
                referenceNumber: containsInsensitive(term),
              })),
              ...buildContainsFilters(searchTerms, (term) => ({
                subject: containsInsensitive(term),
              })),
              ...buildContainsFilters(searchTerms, (term) => ({
                senderName: containsInsensitive(term),
              })),
              ...buildContainsFilters(searchTerms, (term) => ({
                senderOffice: containsInsensitive(term),
              })),
              ...buildContainsFilters(searchTerms, (term) => ({
                description: containsInsensitive(term),
              })),
              ...buildContainsFilters(searchTerms, (term) => ({
                deliveredBy: containsInsensitive(term),
              })),
              ...buildContainsFilters(searchTerms, (term) => ({
                assignedToDepartment: {
                  name: containsInsensitive(term),
                },
              })),
              ...buildContainsFilters(searchTerms, (term) => ({
                assignedToUser: {
                  name: containsInsensitive(term),
                },
              })),
              ...(statusTokens.correspondenceStatuses.length > 0
                ? statusTokens.correspondenceStatuses.map((status) => ({
                    status,
                  }))
                : []),
              ...(statusTokens.correspondencePriorities.length > 0
                ? statusTokens.correspondencePriorities.map((priority) => ({
                    priority,
                  }))
                : []),
            ],
          },
          orderBy: [{ receivedAt: "desc" }],
          take: 20,
          select: {
            id: true,
            referenceNumber: true,
            subject: true,
            status: true,
            priority: true,
            senderOffice: true,
            receivedAt: true,
            dueDate: true,
            assignedToDepartment: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
            assignedToUser: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            meetings: {
              orderBy: [{ startsAt: "desc" }],
              take: 1,
              select: {
                id: true,
                title: true,
                venue: true,
              },
            },
          },
        }) as Promise<Omit<WorkspaceCorrespondenceHit, "score">[]>)
      : Promise.resolve([] as Omit<WorkspaceCorrespondenceHit, "score">[]),
    canViewDocuments
      ? (db.document.findMany({
          where: {
            organizationId,
            ...(statusTokens.includeArchivedDocuments === true
              ? { isArchived: true }
              : {}),
            OR: [
              ...buildContainsFilters(searchTerms, (term) => ({
                referenceNumber: containsInsensitive(term),
              })),
              ...buildContainsFilters(searchTerms, (term) => ({
                title: containsInsensitive(term),
              })),
              ...buildContainsFilters(searchTerms, (term) => ({
                originOffice: containsInsensitive(term),
              })),
              ...buildContainsFilters(searchTerms, (term) => ({
                currentLocation: containsInsensitive(term),
              })),
              ...buildContainsFilters(searchTerms, (term) => ({
                description: containsInsensitive(term),
              })),
              ...buildContainsFilters(searchTerms, (term) => ({
                broughtBy: containsInsensitive(term),
              })),
              ...buildContainsFilters(searchTerms, (term) => ({
                category: {
                  name: containsInsensitive(term),
                },
              })),
              ...(statusTokens.documentStatuses.length > 0
                ? statusTokens.documentStatuses.map((status) => ({
                    status,
                  }))
                : []),
            ],
          },
          orderBy: [{ createdAt: "desc" }],
          take: 20,
          select: {
            id: true,
            title: true,
            referenceNumber: true,
            status: true,
            currentLocation: true,
            isArchived: true,
            correspondence: {
              select: {
                id: true,
                referenceNumber: true,
                subject: true,
              },
            },
          },
        }) as Promise<Omit<WorkspaceDocumentHit, "score">[]>)
      : Promise.resolve([] as Omit<WorkspaceDocumentHit, "score">[]),
    canViewMeetings
      ? (db.meeting.findMany({
          where: {
            organizationId,
            ...(statusTokens.meetingStatuses.length > 0
              ? { status: { in: statusTokens.meetingStatuses } }
              : {}),
            OR: meetingSearchOrFilters,
          },
          orderBy: [{ startsAt: "desc" }],
          take: 20,
          select: {
            id: true,
            title: true,
            venue: true,
            startsAt: true,
            status: true,
            correspondence: {
              select: {
                id: true,
                referenceNumber: true,
                subject: true,
              },
            },
          },
        }) as Promise<Omit<WorkspaceMeetingHit, "score">[]>)
      : Promise.resolve([] as Omit<WorkspaceMeetingHit, "score">[]),
    canViewMeetings && userId
      ? (db.meetingActionPoint.findMany({
          where: {
            organizationId,
            ...(statusTokens.overdueOnly
              ? {
                  dueDate: { lt: now },
                  status: {
                    notIn: ["COMPLETED", "CANCELLED"],
                  },
                }
              : {}),
            ...(statusTokens.myActionPointsOnly
              ? {
                  OR: [
                    { assignedToUserId: userId },
                    ...(membership?.departmentId
                      ? [{ assignedToDepartmentId: membership.departmentId }]
                      : []),
                  ],
                }
              : {}),
            AND: [
              {
                OR: [
                  ...buildContainsFilters(searchTerms, (term) => ({
                    actionPoint: containsInsensitive(term),
                  })),
                  ...buildContainsFilters(searchTerms, (term) => ({
                    remarks: containsInsensitive(term),
                  })),
                  ...buildContainsFilters(searchTerms, (term) => ({
                    assignedToDepartment: {
                      name: containsInsensitive(term),
                    },
                  })),
                  ...buildContainsFilters(searchTerms, (term) => ({
                    assignedToUser: {
                      name: containsInsensitive(term),
                    },
                  })),
                  ...(statusTokens.actionPointStatuses.length > 0
                    ? statusTokens.actionPointStatuses.map((status) => ({
                        status,
                      }))
                    : []),
                ],
              },
            ],
          },
          orderBy: [{ dueDate: "asc" }],
          take: 12,
          select: {
            id: true,
            actionPoint: true,
            dueDate: true,
            status: true,
            remarks: true,
            meeting: {
              select: {
                id: true,
                title: true,
              },
            },
            assignedToDepartment: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
            assignedToUser: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        }) as Promise<Omit<WorkspaceActionPointHit, "score">[]>)
      : Promise.resolve([] as Omit<WorkspaceActionPointHit, "score">[]),
    canViewMembers
      ? (db.organizationMembership.findMany({
          where: {
            organizationId,
            ...(statusTokens.memberStatuses.length > 0
              ? { status: { in: statusTokens.memberStatuses } }
              : {}),
            OR: [
              ...buildContainsFilters(searchTerms, (term) => ({
                user: {
                  name: containsInsensitive(term),
                },
              })),
              ...buildContainsFilters(searchTerms, (term) => ({
                user: {
                  email: containsInsensitive(term),
                },
              })),
              ...buildContainsFilters(searchTerms, (term) => ({
                department: {
                  name: containsInsensitive(term),
                },
              })),
              ...buildContainsFilters(searchTerms, (term) => ({
                department: {
                  code: containsInsensitive(term),
                },
              })),
              ...[...matchedRoles, ...statusTokens.roleFilters].map((role) => ({
                roles: { has: role },
              })),
            ],
          },
          orderBy: [{ createdAt: "desc" }],
          take: 20,
          select: {
            userId: true,
            status: true,
            roles: true,
            user: {
              select: {
                name: true,
                email: true,
              },
            },
            department: {
              select: {
                id: true,
                name: true,
                code: true,
                kind: true,
              },
            },
          },
        }) as Promise<Omit<WorkspaceMemberHit, "score">[]>)
      : Promise.resolve([] as Omit<WorkspaceMemberHit, "score">[]),
    canViewDepartments
      ? (db.department.findMany({
          where: {
            organizationId,
            ...(statusTokens.departmentKinds.length > 0
              ? { kind: { in: statusTokens.departmentKinds } }
              : {}),
            OR: [
              ...buildContainsFilters(searchTerms, (term) => ({
                name: containsInsensitive(term),
              })),
              ...buildContainsFilters(searchTerms, (term) => ({
                code: containsInsensitive(term),
              })),
              ...buildContainsFilters(searchTerms, (term) => ({
                description: containsInsensitive(term),
              })),
              ...buildContainsFilters(searchTerms, (term) => ({
                headUser: {
                  name: containsInsensitive(term),
                },
              })),
            ],
          },
          orderBy: [{ name: "asc" }],
          take: 20,
          select: {
            id: true,
            name: true,
            code: true,
            kind: true,
            status: true,
          },
        }) as Promise<Omit<WorkspaceDepartmentHit, "score">[]>)
      : Promise.resolve([] as Omit<WorkspaceDepartmentHit, "score">[]),
  ]);

  const correspondences = sortByScore<WorkspaceCorrespondenceHit>(
    correspondencesRaw
      .map((item) => ({
        ...item,
        whyMatched: dedupeReasons([
          ...(scoreExactReferenceBoost(normalizedQuery, item.referenceNumber) >
          0
            ? ["Exact or strong reference number match"]
            : []),
          ...(matchesSearchTerms(searchTerms, item.subject)
            ? ["Subject matched search terms"]
            : []),
          ...(matchesSearchTerms(searchTerms, item.senderOffice)
            ? ["Sender office matched search terms"]
            : []),
          ...(matchesSearchTerms(searchTerms, item.assignedToDepartment?.name)
            ? ["Assigned entity matched search terms"]
            : []),
          ...(matchesSearchTerms(searchTerms, item.assignedToUser?.name) ||
          matchesSearchTerms(searchTerms, item.assignedToUser?.email)
            ? ["Assigned user matched search terms"]
            : []),
          ...(statusTokens.correspondenceStatuses.includes(item.status as never)
            ? [
                `Status matched ${item.status.replaceAll("_", " ").toLowerCase()}`,
              ]
            : []),
          ...(statusTokens.correspondencePriorities.includes(
            item.priority as never,
          )
            ? [
                `Priority matched ${item.priority.replaceAll("_", " ").toLowerCase()}`,
              ]
            : []),
          ...(statusTokens.overdueOnly && item.dueDate && item.dueDate < now
            ? ["Item is overdue"]
            : []),
        ]),
        score:
          scoreExactReferenceBoost(normalizedQuery, item.referenceNumber) +
          scoreWorkspaceSearchText(normalizedQuery, [
            item.referenceNumber,
            item.subject,
            item.senderOffice,
            item.assignedToDepartment?.name,
            item.assignedToDepartment?.code,
            item.assignedToUser?.name,
            item.assignedToUser?.email,
            item.priority.replaceAll("_", " "),
            item.status.replaceAll("_", " "),
          ]),
      }))
      .filter(
        (item) =>
          item.score > 0 ||
          statusTokens.correspondenceStatuses.length > 0 ||
          statusTokens.correspondencePriorities.length > 0 ||
          statusTokens.overdueOnly,
      ),
  ).slice(0, 8);

  const documents = sortByScore<WorkspaceDocumentHit>(
    documentsRaw
      .map((item) => ({
        ...item,
        whyMatched: dedupeReasons([
          ...(scoreExactReferenceBoost(normalizedQuery, item.referenceNumber) >
          0
            ? ["Exact or strong reference number match"]
            : []),
          ...(matchesSearchTerms(searchTerms, item.title)
            ? ["Document title matched search terms"]
            : []),
          ...(matchesSearchTerms(searchTerms, item.currentLocation)
            ? ["Current location matched search terms"]
            : []),
          ...(item.correspondence &&
          (matchesSearchTerms(
            searchTerms,
            item.correspondence.referenceNumber,
          ) ||
            matchesSearchTerms(searchTerms, item.correspondence.subject))
            ? ["Linked correspondence matched search terms"]
            : []),
          ...(statusTokens.includeArchivedDocuments === true && item.isArchived
            ? ["Archive state matched search filter"]
            : []),
        ]),
        score:
          scoreExactReferenceBoost(normalizedQuery, item.referenceNumber) +
          scoreWorkspaceSearchText(normalizedQuery, [
            item.referenceNumber,
            item.title,
            item.currentLocation,
            item.status.replaceAll("_", " "),
            item.correspondence?.referenceNumber,
            item.correspondence?.subject,
            item.isArchived ? "archived" : "active",
          ]),
      }))
      .filter(
        (item) =>
          item.score > 0 ||
          statusTokens.documentStatuses.length > 0 ||
          statusTokens.includeArchivedDocuments === true,
      ),
  ).slice(0, 8);

  const meetings = sortByScore<WorkspaceMeetingHit>(
    meetingsRaw
      .map((item) => ({
        ...item,
        whyMatched: dedupeReasons([
          ...(matchesSearchTerms(searchTerms, item.title)
            ? ["Meeting title matched search terms"]
            : []),
          ...(matchesSearchTerms(searchTerms, item.venue)
            ? ["Venue matched search terms"]
            : []),
          ...(item.correspondence &&
          (matchesSearchTerms(
            searchTerms,
            item.correspondence.referenceNumber,
          ) ||
            matchesSearchTerms(searchTerms, item.correspondence.subject))
            ? ["Linked correspondence matched search terms"]
            : []),
          ...(statusTokens.meetingStatuses.includes(item.status as never)
            ? [
                `Status matched ${item.status.replaceAll("_", " ").toLowerCase()}`,
              ]
            : []),
        ]),
        score:
          scoreWorkspaceSearchText(normalizedQuery, [
            item.title,
            item.venue,
            item.status.replaceAll("_", " "),
            item.correspondence?.referenceNumber,
            item.correspondence?.subject,
          ]) + (item.correspondence ? 8 : 0),
      }))
      .filter(
        (item) => item.score > 0 || statusTokens.meetingStatuses.length > 0,
      ),
  ).slice(0, 8);

  const actionPoints = sortByScore<WorkspaceActionPointHit>(
    actionPointsRaw
      .map((item) => ({
        ...item,
        whyMatched: dedupeReasons([
          ...(matchesSearchTerms(searchTerms, item.actionPoint)
            ? ["Action point text matched search terms"]
            : []),
          ...(matchesSearchTerms(searchTerms, item.remarks)
            ? ["Remarks matched search terms"]
            : []),
          ...(matchesSearchTerms(searchTerms, item.meeting.title)
            ? ["Meeting title matched search terms"]
            : []),
          ...(matchesSearchTerms(
            searchTerms,
            item.assignedToDepartment?.name,
          ) || matchesSearchTerms(searchTerms, item.assignedToDepartment?.code)
            ? ["Assigned entity matched search terms"]
            : []),
          ...(matchesSearchTerms(searchTerms, item.assignedToUser?.name) ||
          matchesSearchTerms(searchTerms, item.assignedToUser?.email)
            ? ["Assigned user matched search terms"]
            : []),
          ...(statusTokens.myActionPointsOnly
            ? ["Filtered to your assigned action points"]
            : []),
          ...(statusTokens.overdueOnly && item.dueDate && item.dueDate < now
            ? ["Action point is overdue"]
            : []),
        ]),
        score:
          scoreWorkspaceSearchText(normalizedQuery, [
            item.actionPoint,
            item.remarks,
            item.meeting.title,
            item.assignedToDepartment?.name,
            item.assignedToDepartment?.code,
            item.assignedToUser?.name,
            item.assignedToUser?.email,
            item.status.replaceAll("_", " "),
          ]) + (statusTokens.myActionPointsOnly ? 40 : 0),
      }))
      .filter(
        (item) =>
          item.score > 0 ||
          statusTokens.actionPointStatuses.length > 0 ||
          statusTokens.myActionPointsOnly ||
          statusTokens.overdueOnly,
      ),
  ).slice(0, 8);

  const members = sortByScore<WorkspaceMemberHit>(
    membersRaw
      .map((item) => ({
        ...item,
        whyMatched: dedupeReasons([
          ...(matchesSearchTerms(searchTerms, item.user.name)
            ? ["Member name matched search terms"]
            : []),
          ...(matchesSearchTerms(searchTerms, item.user.email)
            ? ["Member email matched search terms"]
            : []),
          ...(matchesSearchTerms(searchTerms, item.department?.name) ||
          matchesSearchTerms(searchTerms, item.department?.code)
            ? ["Entity matched search terms"]
            : []),
          ...(matchedRoles.some((role) => item.roles.includes(role))
            ? ["Role matched search terms"]
            : []),
          ...(statusTokens.memberStatuses.includes(item.status as never)
            ? [`Status matched ${item.status.toLowerCase()}`]
            : []),
        ]),
        score:
          scoreWorkspaceSearchText(normalizedQuery, [
            item.user.name,
            item.user.email,
            item.department?.name,
            item.department?.code,
            item.status,
          ]) + scoreRoleMatch(normalizedQuery, item.roles),
      }))
      .filter(
        (item) =>
          item.score > 0 ||
          matchedRoles.length > 0 ||
          statusTokens.roleFilters.length > 0 ||
          statusTokens.memberStatuses.length > 0,
      ),
  ).slice(0, 8);

  const departments = sortByScore<WorkspaceDepartmentHit>(
    departmentsRaw
      .map((item) => ({
        ...item,
        whyMatched: dedupeReasons([
          ...(matchesSearchTerms(searchTerms, item.name)
            ? ["Entity name matched search terms"]
            : []),
          ...(matchesSearchTerms(searchTerms, item.code)
            ? ["Entity code matched search terms"]
            : []),
          ...(statusTokens.departmentKinds.includes(item.kind as never)
            ? [`Kind matched ${item.kind.replaceAll("_", " ").toLowerCase()}`]
            : []),
        ]),
        score: scoreWorkspaceSearchText(normalizedQuery, [
          item.name,
          item.code,
          item.kind.replaceAll("_", " "),
          item.status,
        ]),
      }))
      .filter(
        (item) => item.score > 0 || statusTokens.departmentKinds.length > 0,
      ),
  ).slice(0, 8);

  const linkedWorkflowMap = new Map<string, WorkspaceLinkedWorkflowHit>();

  for (const item of correspondences) {
    const linkedMeeting = item.meetings[0];
    if (!linkedMeeting) continue;

    linkedWorkflowMap.set(`correspondence:${item.id}:${linkedMeeting.id}`, {
      id: `correspondence:${item.id}:${linkedMeeting.id}`,
      correspondence: {
        id: item.id,
        referenceNumber: item.referenceNumber,
        subject: item.subject,
        href: `/dashboard/correspondences/${item.id}`,
      },
      meeting: {
        id: linkedMeeting.id,
        title: linkedMeeting.title,
        venue: linkedMeeting.venue,
        href: `/dashboard/meetings/${linkedMeeting.id}`,
      },
    });
  }

  for (const item of meetings) {
    if (!item.correspondence) continue;

    linkedWorkflowMap.set(`meeting:${item.id}:${item.correspondence.id}`, {
      id: `meeting:${item.id}:${item.correspondence.id}`,
      correspondence: {
        id: item.correspondence.id,
        referenceNumber: item.correspondence.referenceNumber,
        subject: item.correspondence.subject,
        href: `/dashboard/correspondences/${item.correspondence.id}`,
      },
      meeting: {
        id: item.id,
        title: item.title,
        venue: item.venue,
        href: `/dashboard/meetings/${item.id}`,
      },
    });
  }

  const linkedWorkflow = Array.from(linkedWorkflowMap.values()).slice(0, 6);

  const dynamicActions: WorkspaceQuickAction[] = [];

  if (
    command.action === "open" &&
    (command.entity === "department" || command.entity === "entity") &&
    departments[0]
  ) {
    dynamicActions.push({
      id: `open-department-${departments[0].id}`,
      title: `Open ${departments[0].name}`,
      description: "Jump straight to the matched entity record.",
      href: `/dashboard/departments/${departments[0].id}`,
    });
  }

  if (
    command.action === "open" &&
    command.entity === "meeting" &&
    meetings[0]
  ) {
    dynamicActions.push({
      id: `open-meeting-${meetings[0].id}`,
      title: `Open ${meetings[0].title}`,
      description: "Jump straight to the matched meeting.",
      href: `/dashboard/meetings/${meetings[0].id}`,
    });
  }

  if (
    command.action === "open" &&
    command.entity === "correspondence" &&
    correspondences[0]
  ) {
    dynamicActions.push({
      id: `open-correspondence-${correspondences[0].id}`,
      title: `Open ${correspondences[0].referenceNumber}`,
      description: "Jump straight to the matched correspondence file.",
      href: `/dashboard/correspondences/${correspondences[0].id}`,
    });
  }

  if (
    command.action === "open" &&
    command.entity === "document" &&
    documents[0]
  ) {
    dynamicActions.push({
      id: `open-document-${documents[0].id}`,
      title: `Open ${documents[0].referenceNumber || documents[0].title}`,
      description: "Jump straight to the matched document record.",
      href: `/dashboard/documents/${documents[0].id}`,
    });
  }

  if (command.action === "open" && command.entity === "member" && members[0]) {
    dynamicActions.push({
      id: `open-member-${members[0].userId}`,
      title: `Open ${members[0].user.name || members[0].user.email || "member"}`,
      description: "Jump straight to the matched member record.",
      href: `/dashboard/members/${members[0].userId}`,
    });
  }

  const allQuickActions = dedupeQuickActions([
    ...dynamicActions,
    ...quickActions,
  ]);

  const bestMatches = sortByScore<WorkspaceBestMatch>([
    ...allQuickActions.map((action, index) => ({
      id: action.id,
      kind: "quick-action" as const,
      title: action.title,
      subtitle: action.description,
      href: action.href,
      score: (parseSearchIntent(normalizedQuery) ? 1000 : 200) - index,
      whyMatched: action.whyMatched ?? ["Matches quick workspace action"],
    })),
    ...correspondences.map((item) => ({
      id: item.id,
      kind: "correspondence" as const,
      title: item.referenceNumber,
      subtitle: item.subject,
      href: `/dashboard/correspondences/${item.id}`,
      score: item.score,
      whyMatched: item.whyMatched,
    })),
    ...documents.map((item) => ({
      id: item.id,
      kind: "document" as const,
      title: item.referenceNumber || item.title,
      subtitle: item.title,
      href: `/dashboard/documents/${item.id}`,
      score: item.score,
      whyMatched: item.whyMatched,
    })),
    ...meetings.map((item) => ({
      id: item.id,
      kind: "meeting" as const,
      title: item.title,
      subtitle: item.venue || "Meeting record",
      href: `/dashboard/meetings/${item.id}`,
      score: item.score,
      whyMatched: item.whyMatched,
    })),
    ...actionPoints.map((item) => ({
      id: item.id,
      kind: "action-point" as const,
      title: item.actionPoint,
      subtitle: item.meeting.title,
      href: `/dashboard/meetings/${item.meeting.id}`,
      score: item.score,
      whyMatched: item.whyMatched,
    })),
    ...members.map((item) => ({
      id: item.userId,
      kind: "member" as const,
      title: item.user.name || item.user.email || "Unnamed member",
      subtitle: item.department?.name || "No department assigned",
      href: `/dashboard/members/${item.userId}`,
      score: item.score,
      whyMatched: item.whyMatched,
    })),
    ...departments.map((item) => ({
      id: item.id,
      kind: "department" as const,
      title: item.name,
      subtitle: item.code || item.kind.replaceAll("_", " "),
      href: `/dashboard/departments/${item.id}`,
      score: item.score,
      whyMatched: item.whyMatched,
    })),
  ]).slice(0, 10);

  return {
    query: normalizedQuery,
    normalizedQuery: normalizedKey,
    isIntentQuery: Boolean(parseSearchIntent(normalizedQuery)),
    quickActions: allQuickActions,
    bestMatches,
    linkedWorkflow,
    correspondences,
    documents,
    meetings,
    actionPoints,
    members,
    departments,
  };
}
