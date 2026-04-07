# Correspondence Phase 1 Blueprint

This document defines the first implementation slice for the Correspondence module.

It is intentionally narrow so the team can deliver the core workflow without
mixing in dispatch history, documents, meetings, or analytics too early.

## Phase Goal

Deliver the first real correspondence workflow:

1. register incoming correspondence
2. list correspondence
3. open a single correspondence record
4. review and assign the record
5. capture the first movement/history entries

## Scope In

- incoming correspondence registration
- organization-scoped correspondence list
- correspondence detail page
- review and assignment action
- initial movement history timeline
- SLA helpers for overdue and days remaining

## Scope Out

- outgoing correspondence authoring flow
- dispatch acknowledgement flow
- feedback receipt flow
- attachments/documents UI
- meeting links
- analytics widgets
- bulk actions

## Pages

### `/dashboard/correspondence`

Purpose:

- list all correspondence in the current county workspace

First filters:

- status
- priority
- type
- assigned department

Columns:

- reference number
- type
- subject
- sender office
- priority
- status
- received at
- due date
- assigned department

### `/dashboard/correspondence/register`

Purpose:

- register incoming correspondence

Initial focus:

- accurate intake
- strong validation
- generated or validated human-readable reference number

### `/dashboard/correspondence/[correspondenceId]`

Purpose:

- show the full record
- show assignment/review state
- show movement history

Sections:

- correspondence summary
- intake details
- review and instructions
- assignment
- SLA panel
- movement history timeline

## Actions

### `createCorrespondenceAction`

Responsibilities:

- parse `FormData`
- validate all intake fields
- require authenticated user
- require current organization
- require `correspondence.register`
- create correspondence row
- create first movement/audit entry
- return structured result

### `reviewCorrespondenceAction`

Responsibilities:

- update:
  - `reviewedAt`
  - `reviewedByUserId`
  - `instructions`
  - `status`
- require `correspondence.review`
- create movement/audit entry

### `assignCorrespondenceAction`

Responsibilities:

- update:
  - `assignedToDepartmentId`
  - `assignedToUserId`
  - `assignedByUserId`
  - `dueDate`
  - `status`
- require `correspondence.dispatch`
- create movement entry showing routing decision

## Query Layer

Add:

- `features/correspondence/queries/correspondence-list.ts`
- `features/correspondence/queries/correspondence-detail.ts`
- `features/correspondence/queries/correspondence-movements.ts`

Rules:

- always scope by `organizationId`
- keep listing and detail queries separate
- include department and user relations needed for display

## Initial Business Rules

### Registration

- only `INCOMING` is created in phase 1
- `receivedAt` is required
- `receivedByUserId` defaults to current user if not supplied explicitly
- initial status on create: `NEW`

### Review

- review moves status from `NEW` to `UNDER_REVIEW`
- review requires instructions before dispatch

### Assignment

- assignment should prefer department-first routing
- user assignment is optional on phase 1
- assignment sets status to `DISPATCHED`
- `assignedByUserId` must always be captured

### SLA

- `is_overdue` and `days_remaining` remain computed in queries/UI
- no schema changes are required for those two values in phase 1

## Role Policy For Phase 1

| Capability                            | Roles                                                                                    |
| ------------------------------------- | ---------------------------------------------------------------------------------------- |
| register incoming correspondence      | `SUPER_ADMIN`, `ORG_ADMIN`, `REGISTRY_OFFICER`                                           |
| review correspondence                 | `SUPER_ADMIN`, `ORG_ADMIN`, `REVIEWING_OFFICER`, `MANAGEMENT`                            |
| dispatch/assign correspondence        | `SUPER_ADMIN`, `ORG_ADMIN`, `REGISTRY_OFFICER`, `REVIEWING_OFFICER`                      |
| work on assigned correspondence later | `SUPER_ADMIN`, `ORG_ADMIN`, `REVIEWING_OFFICER`, `DEPARTMENT_USER`, `MANAGEMENT`, `USER` |
| close correspondence later            | `SUPER_ADMIN`, `ORG_ADMIN`, `REVIEWING_OFFICER`, `MANAGEMENT`                            |

## Suggested Build Order

1. correspondence query foundation
2. register page + create action
3. list page
4. detail page
5. review action
6. assignment action
7. movement timeline section

## Ready-To-Build Acceptance

The first correspondence slice is ready to implement when:

- county role policy is fixed
- test users and departments exist
- routing units exist for assignment
- the list/register/detail/review/assign scope is accepted as the exact phase 1 boundary
