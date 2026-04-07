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

- Next.js App Router foundation is in place.
- Prisma schema exists and initial migration has been generated.
- Auth.js is configured centrally in [auth.ts](D:/active_projects/cosec-comm-system/auth.ts).
- Prisma singleton is configured in [lib/db.ts](D:/active_projects/cosec-comm-system/lib/db.ts).
- Unified auth entry flow exists on:
  - `/`
  - `/auth/login`
  - `/auth/register`
- Email verification flow works through:
  - `/auth/new-verification`
  - `/auth/activate` compatibility route
- Password reset flow exists.
- Google sign-in exists.
- Turnstile is enforced for the access flow.
- MFA challenge flow exists.
- Protected post-login landing page exists at `/dashboard`.
- Session now includes active organization context when a membership exists.
- Organization creation and onboarding flow exists.
- Organization membership query foundation exists.
- Members listing exists.
- Direct add-member flow exists.
- Department creation, listing, member assignment, and head assignment foundations exist.
- Department detail, member-assignment, and head-assignment pages exist.

### 1.2 Not Done Yet

- Active organization selection/switching
- Authenticated app shell foundation:
  - header
  - sidebar
  - route navigation that stays current as features land
- Member onboarding completion:
  - clear direct-add workflow hardening
  - invite/provisioning strategy decision
  - membership management polish
- Final closure of users/departments phase caveats
- Correspondence module
- Dispatch and movement tracking module
- Documents module
- Meetings module
- Real dashboard widgets/analytics module

### 1.3 Important Clarification

`/dashboard` currently exists as a protected landing route, but the authenticated app shell is not yet complete.

The authenticated shell foundation must be built before continuing into Correspondence so implemented business pages can be tested through real navigation.

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

- registration
- email verification
- credential login
- Google login
- password reset
- Turnstile gate
- MFA challenge flow
- protected post-login route
- active organization context on session when membership exists

### 4.3 Auth-Adjacent Work Deferred To Later Phases

- create first organization after signup
- invite/add users into organizations
- switch active organization
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

This phase is partially implemented already, but it is not fully closed yet.

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

- member listing
- direct add-member flow
- department creation
- department listing
- department head assignment foundation
- department member assignment foundation
- department detail pages

### 7.4 Remaining Slices To Close Caveats

#### Slice 4.1: Member Onboarding Completion

Build:

- direct add-member hardening and manual test pass
- clear handling for duplicate, inactive, or invalid selections
- confirm role assignment flow is stable

Acceptance:

- direct add flow is considered stable and manually tested

#### Slice 4.2: Invite / Provisioning Decision

Decide and document the member onboarding strategy:

- keep direct-add only for now, or
- add invite/provisioning later as an explicit next slice

Acceptance:

- no ambiguity remains about how new organization members are introduced

#### Slice 4.3: Membership Management Polish

Build:

- any missing read-only visibility needed for roles, statuses, and department assignments

Acceptance:

- users/departments phase has no blocking caveat before Correspondence

## 8. Phase 5: Correspondence (Core Module)

This is the most important business module.

Do not begin this phase until Phase 3 and Phase 4 caveats are fully closed.

### 8.1 Goal

Represent real correspondence intake, review, assignment, and status tracking.

### 8.2 Deliverables

- create correspondence
- list correspondence
- view single correspondence
- assign responsibility
- update workflow status

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

#### Slice 5.4: Assignment and Review Actions

Build:

- assign to department
- assign to user
- review update
- due date update

Acceptance:

- all mutations use server actions
- auditability fields remain intact

## 9. Phase 6: Dispatch / Movement Tracking

### 9.1 Goal

Track full movement history, not just current state.

### 9.2 Deliverables

- dispatch record creation
- acknowledgement
- feedback receipt
- movement timeline

### 9.3 Small Task Slices

#### Slice 6.1: Dispatch Action

Required fields:

- dispatched to department
- dispatched to user
- dispatch date

Acceptance:

- dispatch creates dispatch record tied to org and correspondence

#### Slice 6.2: Acknowledgement Action

Required fields:

- acknowledged at
- acknowledged by user

Acceptance:

- acknowledgement updates dispatch and timeline

#### Slice 6.3: Feedback Receipt Action

Required fields:

- feedback received at

Acceptance:

- feedback state is traceable in UI

#### Slice 6.4: Movement Timeline

Build:

- full correspondence movement query
- chronological timeline component

Acceptance:

- correspondence history is reconstructable

## 10. Phase 7: Documents

### 10.1 Goal

Manage supporting documents and attachments in an organization-scoped way.

### 10.2 Small Task Slices

- document category management
- create document record
- attach to correspondence
- file upload handling
- archive flow

Acceptance:

- every document and attachment stays organization-scoped

## 11. Phase 8: Meetings

### 11.1 Goal

Track meetings and action points related to organizational work.

### 11.2 Small Task Slices

- create meeting
- list meetings
- meeting detail
- action point creation
- action point assignment
- action point status updates

Acceptance:

- meeting action points are scoped by organization
- assignees are valid users/departments from current organization

## 12. Phase 9: Dashboard Widgets / Analytics Module

This is the real dashboard module, not the current auth landing page.

### 12.1 Goal

Provide summary, workload visibility, and overdue insight.

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

#### Slice 9.2: Core Lists

- recent correspondence
- overdue items
- pending dispatches
- pending action points

Acceptance:

- lists come from real server queries
- each list is scoped by active organization

#### Slice 9.3: Quick Links

- quick links

Acceptance:

- links point to real implemented modules only

#### Slice 9.4: Charts And Secondary Widgets

Build charts only after the real numbers exist.

Acceptance:

- no fake chart data once the real dashboard phase is active
- visuals stay aligned with the reference shell

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

1. build authenticated header
2. build authenticated sidebar
3. wrap existing authenticated pages in the shell
4. keep navigation updated for the existing members and departments routes
5. close users/departments caveats
6. only then begin correspondence intake

Do not jump into Correspondence until those six are done.

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
