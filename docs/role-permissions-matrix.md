# Role Permissions Matrix

This project now uses one operational access source:

- `OrganizationMembership.roles`

`User` is only the authenticated identity record.

For the County Government of Vihiga deployment, dashboard permissions, navigation,
and server-side authorization all follow the active organization membership role
set.

The membership record still keeps a primary `role` value for compatibility and
display, but effective authorization is evaluated from the assigned `roles`
array.

## Final County Role Policy

### `SUPER_ADMIN`

- Emergency county system administrator.
- Reserved for recovery, support, or exceptional intervention.

### `ORG_ADMIN`

- Primary county administrator.
- Owns members, departments, and routing structure.

### `REGISTRY_OFFICER`

- Front-office intake role.
- Registers incoming correspondence and supports dispatch preparation.
- Does not own the final dispatch decision by default.
- If the business wants registry users to dispatch, admin should assign an
  additional central-office authority role in the same membership role set.

### `REVIEWING_OFFICER`

- Central office review and instruction role.
- Reviews correspondence and sets operational direction.
- In the clarified county model, this is the effective County Secretary /
  management authority for routing and closure decisions.

### `DEPARTMENT_USER`

- Execution role inside a department.
- Works on dispatched items and returns progress or feedback.

### `MANAGEMENT`

- Oversight label for the County Secretary authority path.
- In the clarified county model, this overlaps with `REVIEWING_OFFICER` as the
  same effective office holder rather than a separate day-to-day actor by
  default.

### `USER`

- Minimal authenticated member role.
- Intended for limited future workload participation, not governance visibility.

## Foundation Permissions

| Permission           | Roles                                                                                                        |
| -------------------- | ------------------------------------------------------------------------------------------------------------ |
| `dashboard.view`     | `SUPER_ADMIN`, `ORG_ADMIN`, `REGISTRY_OFFICER`, `REVIEWING_OFFICER`, `DEPARTMENT_USER`, `MANAGEMENT`, `USER` |
| `access.view`        | `SUPER_ADMIN`, `ORG_ADMIN`, `REVIEWING_OFFICER`, `MANAGEMENT`                                                |
| `members.view`       | `SUPER_ADMIN`, `ORG_ADMIN`, `REVIEWING_OFFICER`, `MANAGEMENT`                                                |
| `members.manage`     | `SUPER_ADMIN`, `ORG_ADMIN`                                                                                   |
| `departments.view`   | `SUPER_ADMIN`, `ORG_ADMIN`, `REGISTRY_OFFICER`, `REVIEWING_OFFICER`, `DEPARTMENT_USER`, `MANAGEMENT`         |
| `departments.manage` | `SUPER_ADMIN`, `ORG_ADMIN`                                                                                   |

## Current Page Access

| Route                                           | Allowed roles                                                                                        |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `/dashboard`                                    | all active roles                                                                                     |
| `/dashboard/access`                             | `SUPER_ADMIN`, `ORG_ADMIN`, `REVIEWING_OFFICER`, `MANAGEMENT`                                        |
| `/dashboard/members`                            | `SUPER_ADMIN`, `ORG_ADMIN`, `REVIEWING_OFFICER`, `MANAGEMENT`                                        |
| `/dashboard/members/add`                        | `SUPER_ADMIN`, `ORG_ADMIN`                                                                           |
| `/dashboard/members/[userId]`                   | `SUPER_ADMIN`, `ORG_ADMIN`, `REVIEWING_OFFICER`, `MANAGEMENT`                                        |
| `/dashboard/departments`                        | `SUPER_ADMIN`, `ORG_ADMIN`, `REGISTRY_OFFICER`, `REVIEWING_OFFICER`, `DEPARTMENT_USER`, `MANAGEMENT` |
| `/dashboard/departments/[departmentId]`         | `SUPER_ADMIN`, `ORG_ADMIN`, `REGISTRY_OFFICER`, `REVIEWING_OFFICER`, `DEPARTMENT_USER`, `MANAGEMENT` |
| `/dashboard/departments/[departmentId]/members` | `SUPER_ADMIN`, `ORG_ADMIN`                                                                           |
| `/dashboard/departments/[departmentId]/head`    | `SUPER_ADMIN`, `ORG_ADMIN`                                                                           |

## Current Foundation Actions

| Action                           | Allowed roles                                         |
| -------------------------------- | ----------------------------------------------------- |
| `createOrganizationAction`       | any authenticated user without an active organization |
| `provisionMemberAction`          | `SUPER_ADMIN`, `ORG_ADMIN`                            |
| `addMemberAction`                | `SUPER_ADMIN`, `ORG_ADMIN`                            |
| `updateMemberAccessAction`       | `SUPER_ADMIN`, `ORG_ADMIN`                            |
| `createDepartmentAction`         | `SUPER_ADMIN`, `ORG_ADMIN`                            |
| `updateDepartmentAction`         | `SUPER_ADMIN`, `ORG_ADMIN`                            |
| `assignMemberToDepartmentAction` | `SUPER_ADMIN`, `ORG_ADMIN`                            |
| `assignDepartmentHeadAction`     | `SUPER_ADMIN`, `ORG_ADMIN`                            |

## Correspondence Intent

These permissions are already defined so the next phase can be built against a
stable county policy.

| Permission                | Roles                                                                       |
| ------------------------- | --------------------------------------------------------------------------- |
| `correspondence.register` | `SUPER_ADMIN`, `REGISTRY_OFFICER`                                           |
| `correspondence.review`   | `SUPER_ADMIN`, `REVIEWING_OFFICER`, `MANAGEMENT`                            |
| `correspondence.dispatch` | `SUPER_ADMIN`, `REVIEWING_OFFICER`, `MANAGEMENT`                            |
| `correspondence.work`     | `SUPER_ADMIN`, `REVIEWING_OFFICER`, `DEPARTMENT_USER`, `MANAGEMENT`, `USER` |
| `correspondence.close`    | `SUPER_ADMIN`, `REVIEWING_OFFICER`, `MANAGEMENT`                            |

## Operating Rule

- one user may hold multiple organization roles
- role combinations are assigned by admin
- effective permissions come from the assigned role set, not only the primary
  display role
- `REVIEWING_OFFICER` and `MANAGEMENT` are treated as the same effective
  County Secretary authority path in the clarified county model
- closure authority also covers justified reopen when a closed or cancelled
  item must return to central-office review
- `ORG_ADMIN` remains the structural administration role and is not the default
  operational authority for correspondence review, dispatch, verification, or
  closure
- `REGISTRY_OFFICER` handles intake by default and does not receive final
  dispatch authority unless admin assigns additional central-office roles such
  as `REVIEWING_OFFICER` or `MANAGEMENT`
- use membership status instead of hard deletes for people
- use department status instead of hard deletes for units
- treat `SUPER_ADMIN` as exceptional, not day-to-day
- treat `ORG_ADMIN` as the real county administrator role
