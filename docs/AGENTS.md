# AGENTS.md — COSEC Communication System (FINAL v2)

This document defines how Codex should behave when working on this project.

This is the SINGLE source of truth for implementation.

---

# 1. Core Philosophy

This is a FULLSTACK Next.js App Router project.

Stack:

- Next.js (App Router)
- Prisma ORM
- PostgreSQL
- Auth.js
- Server Actions
- Zod (server validation)
- shadcn/ui
- Tailwind
- lucide-react

NO separate backend.
NO Express.

---

# 2. Domain Understanding (CRITICAL)

Primary entity: Correspondence

Lifecycle:
Receive → Register → Review → Dispatch → Action → Feedback → Close

This is NOT a CRUD system.

System tracks:

- origin (where it came from)
- movement (where it goes)
- responsibility (who is handling it)
- accountability (who did what and when)

---

# 3. Multi-Tenancy (MANDATORY)

System MUST support multiple organizations.

ALL core tables MUST include:

organization_id

ALL queries MUST be scoped by organization_id.

---

# 4. Core Data Model (STRICT)

Correspondence MUST include:

- reference_number (unique, human-readable)
- type (Incoming | Outgoing)
- sender_name
- sender_office
- delivered_by
- delivery_method
- received_by
- reviewed_by
- instructions
- priority (Normal | Urgent | Very Urgent | Critical)
- confidentiality (Public | Internal | Confidential | Highly Confidential)
- status
- due_date
- assigned_to_user_id
- assigned_to_department_id
- assigned_by_user_id

---

# 5. Dispatch & Movement Tracking

Dispatch MUST track:

- dispatched_to_department_id
- dispatched_to_user_id
- dispatch_date
- acknowledged_at
- acknowledged_by_user_id
- feedback_received_at

System MUST maintain FULL movement history.

---

# 6. SLA / Overdue Logic

System MUST support:

- due_date
- is_overdue (computed)
- days_remaining (computed)

---

# 7. Status System (STANDARDIZED)

Statuses MUST be:

- New
- Under Review
- Dispatched
- In Progress
- Awaiting Feedback
- Completed
- Cancelled
- Closed

DO NOT invent new statuses unless required.

---

# 8. Non-Negotiable Rules

Codex MUST:

- Use Server Actions for ALL mutations
- Use Server Components for ALL data fetching
- Use Zod validation ALWAYS (server-side)
- Return structured responses (no raw throws)
- Use Prisma with a SINGLE client

Codex MUST NOT:

- Use API routes unless external integration
- Trust client validation alone
- Put business logic in UI components
- Refactor unrelated code

---

# 9. Server Action Pattern (MANDATORY)

Every mutation MUST follow:

1. Parse FormData
2. Validate with Zod
3. Check authentication & permissions
4. Execute Prisma query
5. Return structured result

Response shape:

type ActionState<T = unknown> = {
ok: boolean;
message: string;
fieldErrors?: Record<string, string[] | undefined>;
values?: Record<string, any>;
data?: T;
};

Rules:

- NEVER throw raw errors
- ALWAYS return fieldErrors if validation fails
- ALWAYS return previous values on error

---

# 10. Forms (STRICT PATTERN)

Default:

- <form action={formAction}>
- useActionState
- useFormStatus

Optional:

- useOptimistic
- useTransition

DO NOT default to react-hook-form.

---

# 11. Data Fetching Rules

- Server Components ONLY
- Avoid duplicate queries
- Prefer central data access via lib/db

---

# 12. Auth Rules

- Use Auth.js centrally
- ALWAYS check session:
  - in pages
  - in server actions

---

# 13. Prisma Rules (CRITICAL)

Codex MUST:

- NEVER use prisma db push
- ALWAYS use migrations

Workflow:

1. Update schema.prisma
2. Run:
   pnpm prisma migrate dev --name <change>
3. Commit migrations

Use single client in:
lib/db/prisma.ts

---

# 14. Documentation Rule

Priority:

AGENTS.md > BRD > README

Codex MUST:

- follow AGENTS.md strictly
- use BRD for domain understanding
- NOT invent fields outside AGENTS.md

---

# 15. Error Handling

- NEVER crash UI
- ALWAYS return structured errors
- ALWAYS show field-level errors

---

# 16. Performance Rules

- Avoid unnecessary re-renders
- Prefer server components
- Use useTransition for non-blocking updates

---

# 17. Codex Behavior Rules (STRICT)

Codex MUST:

- NOT hallucinate files/modules
- NOT assume missing structure
- NOT delete working code
- NOT refactor unrelated parts
- ONLY modify requested scope

If unsure:

- keep changes minimal

---

# 18. Development Order (MANDATORY)

1. Auth
2. Organizations (multi-tenancy)
3. Users & Departments
4. Correspondence (CORE)
5. Dispatch / Movement Tracking
6. Documents
7. Meetings
8. Dashboard (LAST)

---

# 19. Guiding Principle

This system is about:

communication movement + accountability

NOT CRUD.

---

# 20. Final Rule

Prefer:

- simple
- predictable
- consistent

Avoid:

- clever but complex solutions
