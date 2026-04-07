# Role Permissions Matrix

This project now uses one operational access source:

- `OrganizationMembership.role`

`User` is only the authenticated identity record.

For the County Government of Vihiga deployment, dashboard permissions, navigation,
and server-side authorization all follow the active organization membership role.

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

### `REVIEWING_OFFICER`

- Review and instruction role.
- Reviews correspondence and sets operational direction.

### `DEPARTMENT_USER`

- Execution role inside a department.
- Works on dispatched items and returns progress or feedback.

### `MANAGEMENT`

- Oversight role.
- Needs visibility into people, structure, and correspondence progress, but does not run CRUD governance.

### `USER`

- Minimal authenticated member role.
- Intended for limited future workload participation, not governance visibility.

## Foundation Permissions

| Permission           | Roles                                                                                                        |
| -------------------- | ------------------------------------------------------------------------------------------------------------ |
| `dashboard.view`     | `SUPER_ADMIN`, `ORG_ADMIN`, `REGISTRY_OFFICER`, `REVIEWING_OFFICER`, `DEPARTMENT_USER`, `MANAGEMENT`, `USER` |
| `access.view`        | `SUPER_ADMIN`, `ORG_ADMIN`, `MANAGEMENT`                                                                     |
| `members.view`       | `SUPER_ADMIN`, `ORG_ADMIN`, `MANAGEMENT`                                                                     |
| `members.manage`     | `SUPER_ADMIN`, `ORG_ADMIN`                                                                                   |
| `departments.view`   | `SUPER_ADMIN`, `ORG_ADMIN`, `REGISTRY_OFFICER`, `REVIEWING_OFFICER`, `DEPARTMENT_USER`, `MANAGEMENT`         |
| `departments.manage` | `SUPER_ADMIN`, `ORG_ADMIN`                                                                                   |

## Current Page Access

| Route                                           | Allowed roles                                                                                        |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `/dashboard`                                    | all active roles                                                                                     |
| `/dashboard/access`                             | `SUPER_ADMIN`, `ORG_ADMIN`, `MANAGEMENT`                                                             |
| `/dashboard/members`                            | `SUPER_ADMIN`, `ORG_ADMIN`, `MANAGEMENT`                                                             |
| `/dashboard/members/add`                        | `SUPER_ADMIN`, `ORG_ADMIN`                                                                           |
| `/dashboard/members/[userId]`                   | `SUPER_ADMIN`, `ORG_ADMIN`, `MANAGEMENT`                                                             |
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

| Permission                | Roles                                                                                    |
| ------------------------- | ---------------------------------------------------------------------------------------- |
| `correspondence.register` | `SUPER_ADMIN`, `ORG_ADMIN`, `REGISTRY_OFFICER`                                           |
| `correspondence.review`   | `SUPER_ADMIN`, `ORG_ADMIN`, `REVIEWING_OFFICER`, `MANAGEMENT`                            |
| `correspondence.dispatch` | `SUPER_ADMIN`, `ORG_ADMIN`, `REGISTRY_OFFICER`, `REVIEWING_OFFICER`                      |
| `correspondence.work`     | `SUPER_ADMIN`, `ORG_ADMIN`, `REVIEWING_OFFICER`, `DEPARTMENT_USER`, `MANAGEMENT`, `USER` |
| `correspondence.close`    | `SUPER_ADMIN`, `ORG_ADMIN`, `REVIEWING_OFFICER`, `MANAGEMENT`                            |

## Operating Rule

- use membership status instead of hard deletes for people
- use department status instead of hard deletes for units
- treat `SUPER_ADMIN` as exceptional, not day-to-day
- treat `ORG_ADMIN` as the real county administrator role
