# Correspondence Schema Audit

Date: 2026-04-08

Sources checked:

- [AGENTS.md](D:/active_projects/cosec-comm-system/AGENTS.md)
- [Roadmap.md](D:/active_projects/cosec-comm-system/Roadmap.md)
- [CORRESPONDENCES TRACKING SYSTEM.docx](D:/active_projects/cosec-comm-system/docs/CORRESPONDENCES%20TRACKING%20SYSTEM.docx)
- [Dashboard*-\_Office_of_the_County_Secretary*&_Head_of_Public_Service_-\_FINAL(1).xlsx](<D:/active_projects/cosec-comm-system/docs/Copy%20of%20Dashboard_-_Office_of_the_County_Secretary_%26_Head_of_Public_Service_-_FINAL(1).xlsx>)
- [schema.prisma](D:/active_projects/cosec-comm-system/prisma/schema.prisma)

## Conclusion

The current Prisma schema is ready for Correspondence phase 1.

No schema migration is needed before implementing:

- register correspondence
- list correspondence
- view correspondence detail
- review correspondence
- assign correspondence

The remaining work is in queries, server actions, validation, and UI.

## AGENTS Field Audit

### Correspondence

| AGENTS requirement          | Present in schema | Notes                                                                 |
| --------------------------- | ----------------- | --------------------------------------------------------------------- |
| `organization_id`           | yes               | `Correspondence.organizationId`                                       |
| `reference_number`          | yes               | `referenceNumber`, unique per organization                            |
| `type`                      | yes               | `CorrespondenceType` enum with `INCOMING`, `OUTGOING`                 |
| `subject`                   | yes               | `subject`                                                             |
| `description`               | yes               | nullable in schema, can be enforced in phase-1 validation if required |
| `sender_name`               | yes               | `senderName`                                                          |
| `sender_office`             | yes               | `senderOffice`                                                        |
| `delivered_by`              | yes               | `deliveredBy`                                                         |
| `delivery_method`           | yes               | `DeliveryMethod` enum                                                 |
| `received_at`               | yes               | `receivedAt`                                                          |
| `reviewed_at`               | yes               | `reviewedAt`                                                          |
| `received_by_user_id`       | yes               | `receivedByUserId`                                                    |
| `reviewed_by_user_id`       | yes               | `reviewedByUserId`                                                    |
| `instructions`              | yes               | `instructions`                                                        |
| `priority`                  | yes               | `CorrespondencePriority` enum                                         |
| `confidentiality`           | yes               | `CorrespondenceConfidentiality` enum                                  |
| `status`                    | yes               | `CorrespondenceStatus` enum                                           |
| `due_date`                  | yes               | `dueDate`                                                             |
| `assigned_to_user_id`       | yes               | `assignedToUserId`                                                    |
| `assigned_to_department_id` | yes               | `assignedToDepartmentId`                                              |
| `assigned_by_user_id`       | yes               | `assignedByUserId`                                                    |

### Dispatch

| AGENTS requirement            | Present in schema | Notes                                   |
| ----------------------------- | ----------------- | --------------------------------------- |
| `organization_id`             | yes               | `CorrespondenceDispatch.organizationId` |
| `dispatched_to_department_id` | yes               | `dispatchedToDepartmentId`              |
| `dispatched_to_user_id`       | yes               | `dispatchedToUserId`                    |
| `dispatch_date`               | yes               | `dispatchDate`                          |
| `acknowledged_at`             | yes               | `acknowledgedAt`                        |
| `acknowledged_by_user_id`     | yes               | `acknowledgedByUserId`                  |
| `feedback_received_at`        | yes               | `feedbackReceivedAt`                    |

### Movement History

| AGENTS requirement    | Present in schema | Notes                                                                                                   |
| --------------------- | ----------------- | ------------------------------------------------------------------------------------------------------- |
| full movement history | yes               | `CorrespondenceMovement` model with from/to department and user, status, note, movedAt, createdByUserId |

### SLA / Overdue

| AGENTS requirement | Present in schema | Notes                         |
| ------------------ | ----------------- | ----------------------------- |
| `due_date`         | yes               | stored on correspondence      |
| `is_overdue`       | yes, computed     | should stay query/UI computed |
| `days_remaining`   | yes, computed     | should stay query/UI computed |

### Standardized Statuses

The AGENTS-approved statuses are already present exactly:

- `NEW`
- `UNDER_REVIEW`
- `DISPATCHED`
- `IN_PROGRESS`
- `AWAITING_FEEDBACK`
- `COMPLETED`
- `CANCELLED`
- `CLOSED`

## County BRD and Excel Mapping

### BRD alignment

The BRD requires:

- receipt
- registration
- review
- dispatch
- action
- feedback
- closure

The schema already supports this lifecycle through:

- `Correspondence`
- `CorrespondenceDispatch`
- `CorrespondenceMovement`
- `AuditLog`

The BRD correspondence fields are already covered:

- sender name
- source office
- delivered by
- delivery method
- reviewed by
- instructions
- priority
- confidentiality
- due date
- status

### Excel tracker alignment

The current Excel tracker includes:

- date
- time
- communication type
- subject
- unique identifier
- sender
- recipient
- priority level
- assigned person
- status
- response date
- average response time
- action required

Mapping:

- `date` and `time` map to `receivedAt`
- `communication type` maps to `type` plus `deliveryMethod`
- `unique identifier` maps to `referenceNumber`
- `sender` maps to `senderName` or `senderOffice` depending on intake meaning
- `recipient` maps operationally to `assignedToDepartmentId`, `assignedToUserId`, and dispatch target fields
- `assigned person` maps to `assignedToUserId`
- `response date` maps to feedback/closure timing such as `feedbackReceivedAt` or `closedAt`
- `average response time` should be computed in queries/widgets, not stored
- `action required` maps to `instructions`

No extra Excel-only field justifies a schema change before phase 1.

## Organization Scoping Audit

The correspondence models are organization-scoped:

- `Correspondence.organizationId`
- `CorrespondenceDispatch.organizationId`
- `CorrespondenceMovement.organizationId`

Existing indexes are sufficient for phase 1:

### Correspondence

- unique: `[organizationId, referenceNumber]`
- indexes:
  - `[organizationId, type]`
  - `[organizationId, status]`
  - `[organizationId, priority]`
  - `[organizationId, confidentiality]`
  - `[organizationId, dueDate]`
  - `[organizationId, assignedToDepartmentId]`
  - `[organizationId, assignedToUserId]`
  - `[organizationId, receivedAt]`

### CorrespondenceDispatch

- indexes:
  - `[organizationId, correspondenceId]`
  - `[organizationId, dispatchDate]`
  - `[organizationId, status]`
  - `[organizationId, dispatchedToDepartmentId]`
  - `[organizationId, dispatchedToUserId]`

### CorrespondenceMovement

- indexes:
  - `[organizationId, correspondenceId, movedAt]`
  - `[organizationId, status]`
  - `[organizationId, toDepartmentId]`
  - `[organizationId, toUserId]`

## Small Decisions For Phase 1

These are implementation decisions, not schema changes:

- require `INCOMING` only on create for phase 1
- default `receivedByUserId` to the current user when omitted
- create with `status = NEW`
- keep `description` nullable in Prisma but decide in Zod whether intake requires it
- compute overdue and days remaining in query helpers, not in the database

## Migration Decision

No migration is required at this stage.

The correct next step is:

1. build correspondence query helpers
2. build `createCorrespondenceAction`
3. build `/dashboard/correspondence/register`
