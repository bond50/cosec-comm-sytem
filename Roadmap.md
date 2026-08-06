# Roadmap.md

This roadmap breaks the COSEC Communication System into small, controlled implementation phases.

It is based on:

- [AGENTS.md](D:/active_projects/cosec-comm-system/AGENTS.md)
- [README.md](D:/active_projects/cosec-comm-system/README.md)
- the current codebase state

The goal is to avoid:

- skipping required domain pieces
- mixing too many concerns in one task
- moving to later modules before the foundations are ready

## 1. Current State

### 1.1 Done

- [x] Next.js App Router foundation is in place.
- [x] Prisma schema exists and initial migration has been generated.
- [x] Auth.js is configured centrally in [auth.ts](D:/active_projects/cosec-comm-system/auth.ts).
- [x] Prisma singleton is configured in [lib/db.ts](D:/active_projects/cosec-comm-system/lib/db.ts).
- [x] Unified auth entry flow exists on:
  - `/`
  - `/auth/login`
  - `/auth/register`
- [x] Email verification flow works through:
  - `/auth/new-verification`
  - `/auth/activate` compatibility route
- [x] Password reset flow exists.
- [x] Google sign-in exists.
- [x] Turnstile is enforced for the access flow.
- [x] MFA challenge flow exists.
- [x] Protected post-login landing page exists at `/dashboard`.
- [x] Session now includes active organization context when a membership exists.
- [x] Active organization switching now exists for users with more than one active membership.
- [x] Organization creation and onboarding flow exists.
- [x] Organization membership query foundation exists.
- [x] Authenticated app shell foundation exists:
  - header
  - sidebar
  - route navigation for current implemented business pages
- [x] Members listing exists.
- [x] Direct add-member flow exists.
- [x] Department creation, listing, member assignment, and head assignment foundations exist.
- [x] Department detail, member-assignment, and head-assignment pages exist.
- [x] Phase 4 caveats have been manually verified and closed for the current foundation scope:
  - member onboarding tested through the real app flow
  - member management and department assignment routes tested through the real app flow
  - active organization switching tested through the header workspace switcher
  - role-aware navigation and page guards checked across ORG_ADMIN, MANAGEMENT, REGISTRY_OFFICER, REVIEWING_OFFICER, and DEPARTMENT_USER
- [x] Correspondence schema has been audited against AGENTS, the county BRD, the current Excel tracker, and the current Prisma models.
- [x] No pre-phase-1 correspondence migration is required; the remaining work is queries, actions, validation, and UI.
- [x] Phase-1 correspondence rules are now fixed in code terms for intake, required fields, permissions, reference numbers, and status transitions.
- [x] Correspondence query foundation now exists for list, detail, movement history, filters, and SLA helpers.
- [x] Correspondence shared validation and action helpers now exist for create, update, review, and assign flows.
- [x] The first correspondence mutation now exists: register correspondence with validation, permission checks, audit entry, and first movement entry.
- [x] `/dashboard/correspondences/register` now exists as a real authenticated route with shell navigation and county intake form.
- [x] `/dashboard/correspondences` now exists as a real datatable-backed correspondence workspace with search, sort, filters, and exports.
- [x] `/dashboard/correspondences/[id]` now exists as a real detail workspace with header summary, intake registration, review, routing, deadline tracking, movement, attachments, and accountability sections.
- [x] Correspondence detail now supports explicit close/cancel finalization with closure notes, audit logging, and movement-history entries.
- [x] `/dashboard` now includes real reporting widgets backed by organization-scoped metrics for overdue items, urgent items, SLA compliance, department performance, trends over time, pending dispatches, and pending action points.
- [x] Correspondence sender-office suggestions now exist as an organization-scoped lookup and free-text combobox on the register form.
- [x] Reporting/export refinement now includes printable correspondence detail, filtered register exports, monthly/SLA summary exports, and department performance exports.
- [x] Membership role model now supports admin-assigned multi-role memberships, with effective permissions evaluated from the assigned role set.
- [x] Department structure model now treats `Office of the County Secretary and Head of Public Service` as the central control office, classifies all other departments as execution units, and requires department assignment in new/updated membership flows.
- [x] Correspondence detail and action wording now explicitly follow the central-office-led workflow:
  - receive
  - register
  - review
  - dispatch
  - execute
  - feedback
  - verify
  - close
- [x] Correspondence closure now requires feedback to return before a record can be closed, which matches the confirmed county workflow.
- [x] Review, routing, dispatch, verification, and closure authority are now tightened to the County Secretary authority path (`Reviewing Officer` / `Management`) instead of the generic admin path.
- [x] Registry dispatch behavior now follows the assigned role set: registry-only users register by default, and dispatch becomes available only when admin also assigns central-office dispatch authority.
- [x] Correspondence reference numbers now follow the county format pattern (`VCG/OCS/YYYY/MM/NNNNNN`) instead of the earlier generic reference style.
- [x] Organization setup and department administration now explain the central-office-first county structure directly in the UI.
- [x] Correspondence field rules now match the returned questionnaire for mandatory dispatch due date, acknowledgement before feedback, required feedback note, repeated review/feedback updates, feedback-before-close, and justified reopen.
- [x] Correspondence status and action wording now uses office workflow language: intake, review instructions, routing decision, receiving office, dispatch, receipt confirmation, feedback return, verification, and closure.
- [x] Document registry assumptions now match the returned requirements: physical/digital/hybrid records, current holder, current location, archive state, linked correspondence, and searchable archived records.
- [x] Meeting/action-point assumptions now match the returned requirements: action points must be assigned to a user, department, or both; action-point deadlines are mandatory; meetings can link back to relevant correspondence.
- [x] Seed/reset setup now uses a county-accurate UAT foundation instead of generic demo assumptions: one Vihiga County organization, one central control office, execution departments, multi-role County Secretary authority, registry-only officer, department users, document categories, and sender-office suggestions.
- [x] README/Roadmap/business-facing docs now describe the final county operating model rather than the earlier generic department model.
- [x] Dashboard/reporting UAT closed against realistic multi-month data: generated ~90 correspondence records, 18 documents, and 9 meetings spanning six months, then re-verified KPIs, SLA compliance, department performance, trends, and workflow-stage/priority/meeting-status breakdowns, plus CSV/Excel exports, all against real numbers in the running app.
- [x] Fixed a stale bcrypt password hash in `prisma/county-foundation-seed.sql` (all seeded UAT accounts shared one hash that did not actually match the documented `ChangeMe123!` password, blocking login for every seeded demo account).
- [x] Dashboard UI noise pass: cut restated explanatory paragraphs across dashboard widgets, the correspondence register/detail workflow, and member/document/meeting forms; converted the workflow-stage, priority-mix, and meeting-status widgets from progress-bar lists into compact donut charts with a validated categorical/status palette.

### 1.2 Not Done Yet

- [x] Correspondence module
- [x] Dispatch and movement tracking module
- [x] Documents module
- [x] Meetings module
- [x] Real dashboard widgets/analytics module
- [x] County UAT seed/reset foundation
- [x] README/Roadmap/business-doc alignment

### 1.3 Important Clarification

`/dashboard` now sits inside the authenticated shell foundation, and existing business pages are reachable through real navigation.

The remaining gate before Correspondence is no longer shell construction or phase-4 cleanup. It is disciplined phase-1-only correspondence delivery.

That matches AGENTS intent:

- auth must end at a protected destination
- authenticated shell comes before Correspondence
- the final dashboard widgets/analytics module still comes later

## 2. Working Rules

Every phase below must follow these rules from AGENTS:

- Server Components for data fetching
- Server Actions for mutations
- Zod validation on the server
- structured action responses
- Prisma migrations only
- organization-aware data model and queries
- small reusable components
- no unrelated refactors

## 3. Delivery Strategy

Use small vertical slices.

Each slice should:

1. inspect the target files first and verify whether the slice is new, partially done, or already implemented
2. confirm the slice still matches the current repo state before editing
3. add or update schema only if required
4. add migration
5. add queries
6. add server actions
7. add pages/components
8. verify with:
   - `pnpm run pretty`
   - `pnpm exec tsc --noEmit`
   - `pnpm run lint:ts`
   - manual flow test

Avoid re-reporting an already implemented slice as fresh work.
Do not use temporary rule violations as a bridge to the intended solution.
Keep `page.tsx` files thin on the first implementation pass.
When authenticated pages exist, add and maintain real navigation as slices land so testing can happen through the app shell.
If the user explicitly requests a combined shell/foundation pass, adjacent slices within the same phase may be completed together.

Avoid multi-phase tasks in one go.

## 4. Phase 1: Auth

### 4.1 Status

Core auth foundation is complete enough to move forward.

### 4.2 What Is Already Covered

- [x] registration
- [x] email verification
- [x] credential login
- [x] Google login
- [x] password reset
- [x] Turnstile gate
- [x] MFA challenge flow
- [x] protected post-login route
- [x] active organization context on session when membership exists

### 4.3 Auth-Adjacent Work Deferred To Later Phases

- create first organization after signup
- invite/add users into organizations
- role and permission enforcement based on membership rather than only user role

These are not basic auth tasks anymore. They belong to organizations and users/departments.

## 5. Phase 2: Organizations (Multi-Tenancy)

This is the immediate next phase.

### 5.1 Goal

Make the system actually multi-tenant in behavior, not only in schema.

### 5.2 Deliverables

- users can belong to organizations
- first organization can be created and assigned
- session can resolve active organization reliably
- app can block users with no active organization
- data access helpers can require organization context

### 5.3 Small Task Slices

#### Slice 2.1: Organization Query Foundation

Create:

- organization query helpers
- membership query helpers
- active organization resolver

Suggested files:

- `features/application/queries/organizations.ts`
- `features/application/queries/memberships.ts`
- `features/auth/utils/current-organization.ts`

Acceptance:

- can fetch active membership by user id
- can fetch organization by slug/id
- no raw organization lookup duplication across components

#### Slice 2.2: Organization Bootstrap Decision

Decide the first-organization onboarding rule.

Recommended default:

- if first user has no active membership, they should create an organization
- first creator becomes `ORG_ADMIN`

Acceptance:

- rule is written in code and reflected in UI state

#### Slice 2.3: Create Organization Flow

Build:

- organization creation schema
- server action
- onboarding page

Suggested route:

- `/dashboard/organization/setup`

Required fields:

- name
- slug
- type

Action requirements:

1. parse `FormData`
2. validate with Zod
3. require authenticated user
4. create organization
5. create active membership with `ORG_ADMIN`
6. return structured result

Acceptance:

- signed-in user with no org can create one
- membership record is created
- redirect returns to dashboard

#### Slice 2.4: Guard No-Organization State

Update protected routing/landing behavior.

Needed behavior:

- signed-in user with no active organization should be guided to org setup
- signed-in user with active organization should continue normally

Acceptance:

- no-org user cannot get stuck on meaningless dashboard state
- active-org user sees organization-aware dashboard state

#### Slice 2.5: Session Shape Finalization For Organizations

Decide and standardize session fields:

- `session.organization.id`
- `session.organization.name`
- `session.organization.slug`
- `session.organization.role`

Potential optional additions:

- `session.organization.type`

Acceptance:

- all downstream code can rely on a stable organization object

#### Slice 2.6: Organization-Scoped Helpers

Add reusable auth helpers like:

- `requireCurrentUser()`
- `requireCurrentOrganization()`
- `requireOrganizationContext()`

Acceptance:

- new modules can require auth + org context without rewriting guards

## 6. Phase 3: Authenticated App Shell Foundation

This phase now comes before continuing deeper feature work.

### 6.1 Goal

Provide the shared authenticated shell needed to test existing and future business pages through real navigation.

### 6.2 Deliverables

- top header
- left sidebar
- content frame
- navigation entries for implemented routes
- shell reuse across authenticated business pages

### 6.3 Small Task Slices

#### Slice 3.1: Header Foundation

Build:

- top header bar
- current page title area
- user/account area placeholder

Acceptance:

- authenticated pages share one consistent header

#### Slice 3.2: Sidebar Foundation

Build:

- left sidebar
- active route state
- project-based navigation sections

Acceptance:

- implemented business routes are reachable from the sidebar

#### Slice 3.3: Content Frame Integration

Build:

- shared authenticated shell wrapper
- content container and page spacing

Acceptance:

- existing dashboard, members, and department pages render inside one shell

#### Slice 3.4: Navigation Maintenance Rule

Rule:

- when a new authenticated route is added later, update navigation in the same phase if the route is user-facing

Acceptance:

- implemented routes do not become stranded pages

## 7. Phase 4: Users & Departments

This phase foundation is now closed enough to begin Correspondence phase 1.

### 7.1 Goal

Support organization members, role structure, and departments.

### 7.2 Deliverables

- list organization members
- add or provision users into organization
- create departments
- assign department heads
- assign members to departments
- close remaining membership-management caveats before Correspondence

### 7.3 Completed Foundations

- [x] member listing
- [x] direct add-member flow
- [x] department creation
- [x] department listing
- [x] department head assignment foundation
- [x] department member assignment foundation
- [x] department detail pages
- [x] member onboarding, member management, department assignment, and role-aware navigation have been manually tested in the running app
- [x] active organization switching has been manually tested in the running app

### 7.4 Closure Notes

- [x] Direct add-member remains the active onboarding strategy for this phase.
- [x] Invite/provisioning stays deferred until a later explicit slice.
- [x] Users/departments no longer have a blocking caveat before Correspondence.

## 8. Phase 5: Correspondence (Core Module)

This is the most important business module.

Phase 3 and Phase 4 foundations are now closed enough to begin this phase.

### 8.1 Goal

Represent real correspondence intake, review, routing, dispatch, feedback, verification, and closure tracking.

### 8.2 Deliverables

- create correspondence
- list correspondence
- view single correspondence
- assign responsibility
- update workflow status

Status:

- [x] Implemented and hardened for organization scoping, authorization, validation, and accountability flows.

### 8.3 Small Task Slices

#### Slice 5.1: Intake Form

Build:

- schema review against AGENTS and current Prisma schema
- create correspondence action
- protected intake page

Acceptance:

- create flow stores all required business fields
- `organization_id` is always attached

Required fields from AGENTS:

- reference number
- type
- subject
- description
- sender name
- sender office
- delivered by
- delivery method
- received at
- reviewed at
- received by user id
- reviewed by user id
- instructions
- priority
- confidentiality
- status
- due date
- assigned to user
- assigned to department
- assigned by user

#### Slice 5.2: Correspondence Listing

Build:

- server query for current organization
- filters by status, priority, type

Acceptance:

- only current organization data appears

#### Slice 5.3: Correspondence Details

Build:

- detail page
- header summary
- movement history placeholder section
- document/attachment placeholder section

Acceptance:

- single record fully viewable

Status:

- [x] Implemented

#### Slice 5.4: Assignment and Review Actions

Build:

- assign to department
- assign to user
- review update
- due date update

Acceptance:

- all mutations use server actions
- auditability fields remain intact

Status:

- [x] Implemented

## 9. Phase 6: Dispatch / Movement Tracking

### 9.1 Goal

Track full movement history, not just current state.

### 9.2 Deliverables

- dispatch record creation
- acknowledgement
- feedback receipt
- movement timeline

Status:

- [x] Implemented and included in the live correspondence detail workflow.

### 9.3 Small Task Slices

#### Slice 6.1: Dispatch Action

Required fields:

- dispatched to department
- dispatched to user
- dispatch date

Acceptance:

- dispatch creates dispatch record tied to org and correspondence

Status:

- [x] Implemented

#### Slice 6.2: Acknowledgement Action

Required fields:

- acknowledged at
- acknowledged by user

Acceptance:

- acknowledgement updates dispatch and timeline

Status:

- [x] Implemented

#### Slice 6.3: Feedback Receipt Action

Required fields:

- feedback received at

Acceptance:

- feedback state is traceable in UI

Status:

- [x] Implemented

#### Slice 6.4: Movement Timeline

Build:

- full correspondence movement query
- chronological timeline component

Acceptance:

- correspondence history is reconstructable

Status:

- [x] Implemented

## 10. Phase 7: Documents

### 10.1 Goal

Manage supporting documents and attachments in an organization-scoped way.

### 10.2 Small Task Slices

- [x] document category management
- [x] create document record
- [x] attach to correspondence
- [x] file upload handling
- [x] archive flow
- [x] physical, digital, and hybrid tracking
- [x] current holder and current location tracking
- [x] searchable archived records
- [x] system-generated document reference numbers using the county document format (`VCG/OCS/DOC/YYYY/MM/NNNNNN`)
- [x] document detail editing for active records, while archived records remain read-only

Acceptance:

- every document and attachment stays organization-scoped

Notes:

- [x] Correspondence detail already supports attachment upload and linked-document display.
- [x] Standalone documents module now exists with registry listing, category management, standalone document creation, archive flow, direct document attachment upload, and searchable active/archived records.

## 11. Phase 8: Meetings

### 11.1 Goal

Track meetings and action points related to organizational work.

### 11.2 Small Task Slices

- [x] create meeting
- [x] list meetings
- [x] meeting detail
- [x] meeting edit/update with agenda, discussion summary, and resolutions
- [x] meeting status workflow now supports Scheduled, Held, Action points issued, Postponed, Cancelled, and Closed; closing requires resolutions or action points
- [x] meeting attachment upload for minutes, attendance sheets, signed resolutions, and scanned notes
- [x] meeting decisions field and print-friendly meeting summary are now available on meeting detail
- [x] action point history now records exact field-level changes for status, assigned user, assigned department, due date, and remarks
- [x] `My action points` ownership view now shows user/department action points, due dates, overdue state, and CSV/Excel/PDF export
- [x] linked meetings and action points now appear from correspondence detail when a meeting is tied to correspondence
- [x] in-app notification foundation now exists with organization-scoped notifications, dashboard bell, mark-as-read, meeting scheduled notifications, and action point assignment/update notifications
- [x] action point creation
- [x] action point assignment
- [x] action point status updates

Acceptance:

- meeting action points are scoped by organization
- assignees are valid users/departments from current organization
- action points require a user, department, or both
- action points require a deadline
- meetings can link back to relevant correspondence where the meeting came from correspondence work

Status:

- [x] Meetings foundation now includes `/dashboard/meetings`, `/dashboard/meetings/[id]`, meeting creation, action point creation, and action point assignment/status updates.
- [x] Meeting assumption pass completed for assignment, mandatory deadlines, and correspondence linkage.

## 12. Phase 9: Dashboard Widgets / Analytics Module

This is the real dashboard module, not the current auth landing page.

### 12.1 Goal

Provide the office reporting views explicitly requested in the requirements: overdue, urgent, SLA compliance, department performance, trends, pending dispatches, and pending action points.

### 12.2 Visual Direction

The authenticated shell should already exist from Phase 3.

This phase focuses on dashboard content inside that shell.

The final dashboard shell and dashboard content must use `extra/dashboard.png` as the visual reference source of truth.

Implement the shell to match that screenshot as closely as practical before building KPI cards, tables, and charts.

That means:

- left navigation sidebar
- top header bar
- clean card grid
- white surfaces
- soft gray borders
- compact admin spacing
- enterprise dashboard rhythm

The content must be ours, but the style direction should stay very close to that reference.

### 12.3 Build Order

Build the dashboard content in this order:

1. first summary cards
2. first tables/lists
3. charts and secondary widgets

Do not jump straight into charts before the shell and content frame are stable.

### 12.4 Small Task Slices

#### Slice 9.1: KPI Cards

- KPI cards

Acceptance:

- cards use real domain metrics only

Status:

- [x] Implemented

#### Slice 9.2: Core Lists

- [x] overdue items
- [x] urgent items
- [x] SLA compliance
- [x] department performance
- [x] trends over time
- [x] pending dispatches
- [x] pending action points

Acceptance:

- lists come from real server queries
- each list is scoped by active organization

#### Slice 9.3: Quick Links

- [x] quick links

Acceptance:

- links point to real implemented modules only

#### Slice 9.4: Charts And Secondary Widgets

Build charts only after the real numbers exist.

Acceptance:

- no fake chart data once the real dashboard phase is active
- visuals stay aligned with the reference shell

Status:

- [x] Implemented

## 13. Cross-Cutting Work

These should be handled gradually, not postponed forever.

### 13.1 Organization Scoping Audit

Before each major module is considered done:

- verify all queries are scoped by `organization_id`
- verify all create actions attach `organization_id`
- verify URLs cannot expose other org data

### 13.2 Authorization Audit

For every protected feature:

- verify session exists
- verify organization context exists
- verify membership/role is sufficient

### 13.3 Error Handling Audit

For every form:

- validation errors return field-level messages
- previous values are preserved on failure
- no raw thrown UI errors

### 13.4 TypeScript and Build Discipline

After each slice:

- run `pnpm run pretty`
- run `pnpm exec tsc --noEmit`
- run `pnpm run lint:ts`
- manually test the real flow

## 14. Suggested Immediate Next Tasks

Do these one by one:

1. begin the meetings module now that documents have a clear scoped foundation
2. expand dashboard analytics beyond KPI cards only after the underlying lists and charts are backed by real data

Current status:

1. [x] continue with documents as a separate module after correspondence stabilization
2. [x] begin the meetings module now that documents have a clear scoped foundation
3. [x] expand dashboard analytics beyond KPI cards only after the underlying lists and charts are backed by real data

Do not collapse documents into correspondence uploads, and do not jump into charts before the remaining dashboard list slices exist.

Immediate next phase according to AGENTS development order:

1. All mandatory phases through dashboard analytics are implemented for the current roadmap scope
2. Current refinement work includes explicit correspondence close/cancel handling after the core module delivery
3. Current refinement work also includes practical office exports for correspondence registers, monthly/SLA summaries, department performance, and printable detail views
4. Dashboard/reporting UAT is now closed against realistic multi-month data (see 1.1); remaining pre-launch items are production-like role UAT with real office users and the meeting resolutions capture enhancement
5. Next work should be a new explicitly scoped enhancement, reporting pass, or deployment-readiness pass

## 15. Definition Of “Ready To Start Correspondence”

Do not begin the core correspondence module until all of these are true:

- login works
- verification works
- MFA works
- `/dashboard` is protected
- user can create or obtain an organization
- session has active organization context
- organization setup route works
- helper exists to require current organization
- authenticated app shell exists with header + sidebar
- existing user-facing authenticated routes are reachable through navigation
- users/departments caveats are closed

## 16. Definition Of “Done” For Each Phase

A phase is only done when:

- schema is correct
- migration exists
- server actions follow AGENTS pattern
- data fetching is server-side
- organization scoping is enforced
- `pnpm run pretty` passes
- TypeScript passes
- lint passes
- the real user flow has been manually tested
