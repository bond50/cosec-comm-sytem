# COSEC Communication System

A fullstack **County Secretary Communication & Correspondence Tracking System** built with Next.js App Router.

---

## 🚀 Overview

This system is designed to manage and track official communication within a government office.

It ensures:

- Accountability
- Traceability
- Structured document flow
- Timely action & feedback

This is a multi-tenant system.

All core business data is organization-scoped.

---

## 🧠 Core Concept

The system revolves around a single core entity:

👉 **Correspondence**

Lifecycle:

Receive → Register → Review → Dispatch → Action → Feedback → Close

This is **not a simple CRUD system** — it models real-world communication workflows.

---

## 🏗️ Tech Stack

- Next.js (App Router)
- Prisma ORM
- PostgreSQL
- Auth.js
- Server Actions
- Zod (server-side validation)
- shadcn/ui
- Tailwind CSS
- lucide-react

---

## 📁 Project Structure

app/
(auth)/
dashboard/
correspondence/
documents/
dispatch/
meetings/
reports/
users/
settings/

components/
features/
lib/
auth/
db/
validations/

prisma/
types/

---

## 🔐 Authentication

- All `/dashboard` routes are protected
- Session is validated in pages and server actions

## 🏢 Multi-Tenancy

- The system supports multiple organizations
- Core business records are scoped by `organization_id`
- Queries and protected workflows must resolve the active organization context

---

## ⚙️ Core Modules

### Organizations

- multi-tenant foundation
- membership context
- organization-scoped access

### Users & Departments

- organization member structure
- department ownership and assignment

### Correspondence (CORE)

Tracks all communication:

- sender
- delivery method
- instructions
- priority
- status
- due date

### Dispatch

Tracks document movement

### Documents

File storage & categorization

### Meetings

Meeting records & action points

### Dashboard

Read-only summary and workload visibility

---

## 📌 Status Workflow

New → Under Review → Dispatched → In Progress → Awaiting Feedback → Completed → Cancelled → Closed

---

## 🧩 Forms Pattern

- `<form action={formAction}>`
- `useActionState`
- `useFormStatus`
- Zod validation on server

---

## 🧪 Server Action Pattern

1. Parse FormData
2. Validate (Zod)
3. Check auth
4. Prisma query
5. Return structured response

### Response Shape

```ts
type ActionState<T = unknown> = {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string[] | undefined>;
  values?: Record<string, any>;
  data?: T;
};
```

---

## 🗄️ Database

Use migrations only:

```bash
pnpm prisma migrate dev --name init
```

Current schema notes:

- outgoing correspondence may later require explicit recipient fields
- dispatch tracking may later require an explicit dispatch method field

---

## ▶️ Getting Started

```bash
pnpm install
```

Create `.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/cosec_db"
```

```bash
pnpm prisma migrate dev
pnpm dev
```

---

## 🎯 Development Rules

- Server Components for data
- Server Actions for mutations
- Zod validation (server)
- Keep logic out of UI

---

## ❌ Avoid

- API routes (unless external)
- Client-only validation
- Random refactors

---

## 🧭 Build Order

1. Auth
2. Organizations
3. Users & Departments
4. Correspondence
5. Dispatch / Movement Tracking
6. Documents
7. Meetings
8. Dashboard

---

## 🧠 Principle

System is about **communication tracking + accountability**, not CRUD.

---

## 📄 License

Private / Internal Use
