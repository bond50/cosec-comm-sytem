# COSEC Communication System

A fullstack county communication, correspondence, and accountability system built with Next.js App Router.

## Overview

COSEC is designed for the Office of the County Secretary and Head of Public Service.

The system tracks:

- correspondence intake and review
- dispatch and movement history
- responsibility and accountability across departments
- supporting documents and attachments
- organization-scoped administration for members and departments

The county operating model is central-office-led:

- `Office of the County Secretary and Head of Public Service` is the central control office.
- Registry receives and registers correspondence from the central office.
- The Reviewing Officer / County Secretary path reviews, dispatches, verifies, and closes.
- Line departments act mainly as execution units after dispatch.
- Every active member belongs to a department and may hold one or more admin-assigned roles.

This is not a simple CRUD application. The core model is workflow movement:

`Receive -> Register -> Review -> Dispatch -> Action -> Feedback -> Close`

## Stack

- Next.js App Router
- Prisma ORM
- PostgreSQL
- Auth.js
- Server Actions
- Zod
- shadcn/ui
- Tailwind CSS
- lucide-react

## Current Status

Implemented:

- [x] Auth foundation
  - unified email-first access flow
  - credentials login
  - Google sign-in
  - email verification
  - password reset
  - MFA challenge flow
  - protected dashboard
- [x] Organizations and multi-tenancy
  - organization creation and onboarding
  - active organization context in session
  - active organization switching
- [x] Authenticated app shell
  - shared header
  - shared sidebar
  - route-aware navigation
- [x] Users and departments
  - member listing and management
  - department creation and editing
  - department member assignment
  - department head assignment
- [x] Correspondence core
  - register correspondence
  - correspondence list with filters and exports
  - correspondence detail workspace
  - review and assignment actions
  - sender office suggestions
- [x] Dispatch and movement tracking
  - dispatch creation
  - acknowledgement
  - feedback receipt
  - chronological movement timeline
- [x] Documents
  - document category management
  - standalone document registry
  - physical, digital, and hybrid record tracking
  - current holder and current location tracking
  - archive flow
  - direct document attachment upload
  - linked correspondence support
  - searchable archived records
- [x] Dashboard KPI foundation
  - overdue and urgent metrics
  - SLA compliance
  - department performance
  - trends over time
  - pending dispatches
  - pending action points
- [x] County seed/reset foundation
  - county-accurate central office
  - execution departments
  - UAT role accounts
  - document categories and sender-office suggestions

- [x] Dashboard/reporting UAT against realistic multi-month data
  - re-validated KPIs, SLA compliance, department performance, trends, and
    workflow-stage/priority/meeting-status breakdowns against ~90
    correspondence records, 18 documents, and 9 meetings spanning six months
  - CSV/Excel exports spot-checked against on-screen figures

In progress:

- [ ] Production-like role UAT (actual office users repeating role-by-role
      testing)
- [ ] Meeting resolutions capture (currently a placeholder on meeting detail)

## Multi-Tenancy

The system supports multiple organizations.

Rules:

- all core business data is scoped by `organization_id`
- protected queries and mutations resolve the active organization
- dashboard behavior follows the active organization membership role

## Core Modules

### Members and Departments

Foundation administration for:

- organization members
- roles and statuses
- departments
- department leadership

### Correspondence

Tracks:

- reference number
- type
- subject and description
- sender and sender office
- delivery path
- review instructions
- assignment
- due dates and SLA state
- workflow status

### Dispatch and Movement

Tracks:

- dispatch records
- acknowledgements
- feedback receipt
- full movement history

### Documents

Tracks:

- document categories
- standalone registry records
- system-generated document reference numbers
- physical, digital, and hybrid document medium
- current holder
- current location
- linked correspondence records
- archive state
- attachments

### Meetings

Tracks:

- meeting creation
- meeting listing
- meeting detail
- optional linkage back to relevant correspondence
- action points assigned to a user, department, or both
- mandatory action-point deadlines
- action point status updates

## Status Systems

### Correspondence

`New -> Under Review -> Dispatched -> In Progress -> Awaiting Feedback -> Completed -> Cancelled -> Closed`

### Documents

`Received -> Draft -> Under Review -> Dispatched -> Pending Action -> Responded -> Archived`

## Forms and Mutations

Default pattern:

- `<form action={formAction}>`
- `useActionState`
- `useFormStatus`
- Zod validation on the server

Every mutation follows:

1. Parse `FormData`
2. Validate with Zod
3. Check auth and permissions
4. Execute Prisma query
5. Return structured response

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

## Database

Use migrations only.

```bash
pnpm prisma migrate dev --name <change>
```

Do not use `prisma db push`.

## Getting Started

```bash
pnpm install
```

Create `.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/cosec_db"
CRON_SECRET="replace-with-a-long-random-secret"
```

Then run:

```bash
pnpm prisma migrate dev
pnpm dev
```

For a county-accurate fresh UAT start:

```bash
pnpm run db:reset:uat
```

To seed only after migrations are already applied:

```bash
pnpm run db:seed:county
```

Seeded UAT accounts use `ChangeMe123!` and are placed into the county operating model:

- `admin@vihiga.go.ke` - central-office organization admin
- `registry@vihiga.go.ke` - central-office registry officer
- `county.secretary@vihiga.go.ke` - Reviewing Officer + Management authority path
- `health.officer@vihiga.go.ke` - execution department user
- `transport.officer@vihiga.go.ke` - execution department user
- `finance.officer@vihiga.go.ke` - execution department user

## Scheduled Jobs

Notification reminders can now run as a protected internal cron endpoint.

Route:

`POST /api/internal/jobs/notifications`

Authentication:

- send `Authorization: Bearer <CRON_SECRET>`
- or send `x-cron-secret: <CRON_SECRET>`

What it does:

- generates in-app reminder notifications for:
  - correspondence due tomorrow
  - overdue correspondence
  - dispatches awaiting acknowledgement
  - correspondence awaiting central verification
  - meeting action points due tomorrow
  - overdue meeting action points

Recommended scheduler:

- run once every morning in production
- run manually during UAT whenever you want to force reminder generation

GitHub Actions option:

- workflow file: `.github/workflows/notification-reminders.yml`
- required repository secrets:
  - `APP_URL`
  - `CRON_SECRET`
- default schedule:
  - `0 4 * * *` UTC
  - this is `07:00` in Nairobi (`Africa/Nairobi`)

Example:

```bash
curl -X POST http://localhost:3000/api/internal/jobs/notifications \
  -H "Authorization: Bearer $CRON_SECRET"
```

## Verification Order

For every completed slice:

1. `pnpm run pretty`
2. `pnpm exec tsc --noEmit`
3. `pnpm run lint:ts`

## Build Order

1. Auth
2. Organizations
3. Authenticated App Shell Foundation
4. Users and Departments
5. Correspondence
6. Dispatch / Movement Tracking
7. Documents
8. Meetings
9. Dashboard Widgets / Analytics

## Principle

This system is about communication movement and accountability, not CRUD.

## License

Private / Internal Use
