# Correspondence Phase 1 Rules

Date: 2026-04-08

This document translates the county workflow and [AGENTS.md](D:/active_projects/cosec-comm-system/AGENTS.md)
into implementation rules for phase 1.

It is the rule set to use for:

- query helpers
- Zod schemas
- server actions
- register/list/detail pages

It is intentionally narrower than the full lifecycle. Phase 1 covers:

- register
- list
- detail
- review
- assign

It does not yet cover:

- dispatch acknowledgement
- feedback receipt
- closure UI
- outgoing authoring UI

## 1. Intake Rules

### 1.1 Incoming correspondence

Phase 1 create flow supports `INCOMING`.

Behavior:

- `type` must be `INCOMING`
- item is created in the active organization only
- `receivedByUserId` defaults to the current signed-in user when omitted
- `status` is created as `NEW`
- first movement history entry must be created at registration time
- first audit entry must be created at registration time

### 1.2 Outgoing correspondence

The schema supports `OUTGOING`, but phase 1 does not expose an outgoing create flow yet.

Behavior for phase 1:

- `OUTGOING` may exist in the database and in enums
- `OUTGOING` may appear in lists and details later if seeded or imported
- `createCorrespondenceAction` must reject `OUTGOING` for phase 1
- outgoing authoring stays deferred to a later explicit slice

This keeps phase 1 aligned with the county need to replace the current incoming-tracker workflow first.

## 2. Reference Number Strategy

The system must use a human-readable `referenceNumber` unique within the active organization.

Phase 1 rule:

- the intake form accepts a reference number provided by the registry user
- the action validates format and uniqueness inside the active organization
- the action does not generate a hidden opaque identifier for business use
- the database uniqueness rule remains `[organizationId, referenceNumber]`

Recommended phase-1 validation characteristics:

- trim whitespace
- collapse repeated spaces
- uppercase for normalized storage
- reject empty value
- reject duplicates in the same organization

Examples of acceptable county-style references:

- `CGV/CS/REG/001/2026`
- `PSM&ICT/01/28/5/2025`
- `VCS/TRANSPORT/14/2026`

## 3. Required Fields At Register Time

Phase 1 registration requires these fields:

- `referenceNumber`
- `type`
- `subject`
- `senderName`
- `senderOffice`
- `deliveryMethod`
- `receivedAt`

Phase 1 registration optional fields:

- `description`
- `deliveredBy`
- `confidentiality`
- `priority`
- `receivedByUserId`

Fields that exist in schema but are not required during initial registration:

- `reviewedAt`
- `reviewedByUserId`
- `instructions`
- `dueDate`
- `assignedToUserId`
- `assignedToDepartmentId`
- `assignedByUserId`

Default behavior at create time:

- `priority = NORMAL` unless explicitly provided
- `confidentiality = INTERNAL` unless explicitly provided
- `status = NEW`

## 4. Role Permissions

These permissions already exist in [role-access.ts](D:/active_projects/cosec-comm-system/features/auth/utils/role-access.ts)
and are the authoritative phase-1 policy.

### 4.1 Register

Allowed roles:

- `SUPER_ADMIN`
- `ORG_ADMIN`
- `REGISTRY_OFFICER`

Permission:

- `correspondence.register`

### 4.2 Review

Allowed roles:

- `SUPER_ADMIN`
- `ORG_ADMIN`
- `REVIEWING_OFFICER`
- `MANAGEMENT`

Permission:

- `correspondence.review`

### 4.3 Assign

Allowed roles:

- `SUPER_ADMIN`
- `ORG_ADMIN`
- `REGISTRY_OFFICER`
- `REVIEWING_OFFICER`

Permission:

- `correspondence.dispatch`

### 4.4 Close

Allowed roles:

- `SUPER_ADMIN`
- `ORG_ADMIN`
- `REVIEWING_OFFICER`
- `MANAGEMENT`

Permission:

- `correspondence.close`

## 5. Status Transition Rules

Only the AGENTS-approved statuses may be used:

- `NEW`
- `UNDER_REVIEW`
- `DISPATCHED`
- `IN_PROGRESS`
- `AWAITING_FEEDBACK`
- `COMPLETED`
- `CANCELLED`
- `CLOSED`

Phase 1 only needs a subset of transitions actively implemented.

### 5.1 Registration

- create only as `NEW`

Allowed transition:

- `none -> NEW`

### 5.2 Review

Review action rules:

- only review records currently in `NEW` or `UNDER_REVIEW`
- review must capture `instructions`
- first review should set:
  - `reviewedAt`
  - `reviewedByUserId`
- review moves:
  - `NEW -> UNDER_REVIEW`
- later review updates may keep:
  - `UNDER_REVIEW -> UNDER_REVIEW`

### 5.3 Assignment

Assignment action rules:

- assignment should prefer department-first routing
- `assignedToDepartmentId` is required for phase 1 assignment
- `assignedToUserId` is optional
- `assignedByUserId` must always be captured
- assignment may set or update `dueDate`

Allowed transition:

- `UNDER_REVIEW -> DISPATCHED`

### 5.4 Post-assignment states

These statuses remain part of the model, but their full action flows come later:

- `DISPATCHED -> IN_PROGRESS`
- `IN_PROGRESS -> AWAITING_FEEDBACK`
- `AWAITING_FEEDBACK -> COMPLETED`
- `COMPLETED -> CLOSED`
- `* -> CANCELLED` only through an explicit later cancellation flow

Phase 1 list/detail UIs should display these statuses if records already have them.
Phase 1 actions should not invent extra transitions beyond registration, review, and assignment.

## 6. Department And User Routing Rules

For phase 1:

- assignment should always target a valid department in the current organization
- optional user assignment must also belong to the current organization
- if a user is assigned, that user should either:
  - belong to the assigned department, or
  - be an exceptional operational assignment explicitly allowed by the action rules later

The first implementation should keep this simple:

- require current-organization department membership checks
- reject cross-organization departments or users

## 7. Audit And Movement Requirements

Every phase-1 mutation must create accountability history.

### 7.1 On create

Create:

- one audit entry
- one movement entry

Movement meaning:

- item has entered the county workflow

### 7.2 On review

Create:

- one audit entry
- one movement entry recording review/instruction step

### 7.3 On assignment

Create:

- one audit entry
- one movement entry recording routing decision

## 8. Implementation Notes

These rules should be enforced in:

- shared Zod schemas
- server actions
- permission guards
- query/UI computed fields

They should not be enforced only in UI copy or client-side form logic.
