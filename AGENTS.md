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

`organization_id`

ALL queries MUST be scoped by organization_id.

---

# 4. Core Data Model (STRICT)

Correspondence MUST include:

- reference_number (unique, human-readable)
- type (Incoming | Outgoing)
- subject
- description
- sender_name
- sender_office
- delivered_by
- delivery_method
- received_at
- reviewed_at
- received_by_user_id
- reviewed_by_user_id
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

```ts
type ActionState<T = unknown> = {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string[] | undefined>;
  values?: Record<string, any>;
  data?: T;
};
```

Rules:

- NEVER throw raw errors
- ALWAYS return fieldErrors if validation fails
- ALWAYS return previous values on error

---

# 10. Forms (STRICT PATTERN)

Default:

- `<form action={formAction}>`
- useActionState
- useFormStatus

Optional:

- useOptimistic
- useTransition

DO NOT default to react-hook-form.

---

# 11. Component Structure Rules

Codex MUST:

- keep components small and focused
- extract repeated form validation into reusable helpers under feature `lib/`
- extract repeated form error mapping into reusable helpers under feature `lib/`
- extract repeated UI states such as submit buttons, status blocks, and field groups into shared components
- prefer importing helper functions instead of defining large inline helper functions inside components

Codex MUST NOT:

- leave large validation functions inside TSX components when they can be reused
- duplicate the same submit/validation/error logic across auth or form components

---

# 12. Data Fetching Rules

- Server Components ONLY
- Avoid duplicate queries
- Prefer central data access via lib/db

---

# 13. Auth Rules

- Use Auth.js centrally
- ALWAYS check session:
  - in pages
  - in server actions

---

# 14. Prisma Rules (CRITICAL)

Codex MUST:

- NEVER use prisma db push
- ALWAYS use migrations

Workflow:

1. Update schema.prisma
2. Run:
   `pnpm prisma migrate dev --name <change>`
3. Commit migrations

Use single client in:
`lib/db.ts`

---

# 15. Documentation Rule

Priority:

AGENTS.md > BRD > README

Codex MUST:

- follow AGENTS.md strictly
- use BRD for domain understanding
- NOT invent fields outside AGENTS.md

---

# 16. Error Handling

- NEVER crash UI
- ALWAYS return structured errors
- ALWAYS show field-level errors

---

# 17. Performance Rules

- Avoid unnecessary re-renders
- Prefer server components
- Use useTransition for non-blocking updates

---

# 18. Verification Order (MANDATORY)

When verifying work, use this command order:

1. `pnpm run pretty`
2. `pnpm exec tsc --noEmit`
3. `pnpm run lint:ts`

Codex MUST run them in that order unless the user explicitly requests otherwise or a task is blocked before that point.

---

# 19. Execution Discipline (MANDATORY)

Codex MUST:

- inspect relevant files first before editing
- verify whether the target files already exist and whether the requested slice is already implemented or only partially unfinished
- produce a short file-by-file plan before editing
- work one milestone only by default
- if the user explicitly requests a combined related foundation pass, Codex may complete adjacent slices together as long as they stay within the same phase and the scope remains coherent
- finish the current phase foundations and remove known caveats before moving to the next major phase
- keep Roadmap usage explicit by checking each slice against the current repo state, not only against the prompt text
- keep `page.tsx` files thin on the first pass by limiting them to auth/guard logic, required data fetching, and composition
- use the verification order already defined in AGENTS.md

Codex MUST NOT:

- install packages unless explicitly requested or required to add approved shadcn/ui registry components for the current slice
- create folders unless explicitly requested
- re-announce a slice as newly completed when inspection shows it was already implemented
- allow temporary rule violations as a workaround, even if there is an intent to clean them up later
- continue to later milestones if validation fails

If a patch fails:

- re-read only the affected files
- explain the failure briefly
- retry with a narrower patch

---

# 20. Dashboard UI Direction (STRICT)

The final authenticated dashboard/business area MUST visually follow `extra/dashboard.png` as the shell visual source of truth.

This rule applies to the dashboard/business area only.

It does NOT apply to the auth entry pages.

Target direction:

- TailAdmin-like admin shell from `extra/dashboard.png`
- left sidebar
- top header
- white card surfaces
- soft gray borders
- subtle shadows
- rounded cards
- compact enterprise spacing
- clean admin look

Codex MUST:

- preserve the `extra/dashboard.png` layout language as closely as practical
- adapt content to this project instead of inventing a different style
- keep county/government content inside that dashboard style
- build the authenticated app shell in this order:
  1. header
  2. sidebar
  3. content frame
- keep navigation updated as authenticated routes are implemented so existing work can be tested through real app navigation
- treat header + sidebar + navigation as foundational app shell work, not as the final dashboard module itself
- leave dashboard widgets, KPI cards, tables, and charts for the final dashboard phase

Codex MUST NOT:

- redesign the dashboard into a different visual system
- switch to a marketing-site style once dashboard work starts
- introduce random colors, decorative gradients, or unrelated visual experiments in the dashboard area

---

# 21. Codex Behavior Rules (STRICT)

Codex MUST:

- NOT hallucinate files/modules
- NOT assume missing structure
- NOT delete working code
- NOT refactor unrelated parts
- ONLY modify requested scope

If unsure:

- keep changes minimal

---

# 22. Development Order (MANDATORY)

1. Auth
2. Organizations (multi-tenancy)
3. Authenticated App Shell Foundation (header, sidebar, navigation)
4. Users & Departments
5. Correspondence (CORE)
6. Dispatch / Movement Tracking
7. Documents
8. Meetings
9. Dashboard Widgets / Analytics (LAST)

---

# 23. Guiding Principle

This system is about:

communication movement + accountability

NOT CRUD.

---

# 24. Final Rule

Prefer:

- simple
- predictable
- consistent

Avoid:

- clever but complex solutions
