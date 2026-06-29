# UDeets — Project Context

> **Purpose:** Quick reference for AI assistants and new contributors. For full architecture, see [ARCHITECTURE.md](./ARCHITECTURE.md).

---

## What is UDeets?

A **community hub platform** where users join hubs (neighborhoods, schools, clubs, etc.), post deets (updates), chat, and receive notifications. Think Nextdoor meets Slack for local communities.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind, shadcn/ui |
| Backend | FastAPI (Python), SQLAlchemy, Alembic |
| Database | PostgreSQL (local Docker or RDS) |
| Auth | FastAPI JWT — Google OAuth + email/phone/password registration |
| Realtime | WebSocket (notifications, chat) with polling fallback |
| Storage | S3 presigned uploads via API |
| Hosting | Vercel (web), AWS ECS/RDS (API + DB) |

---

## Monorepo Layout

```
udeets_ui/
├── apps/
│   ├── web/          # Next.js frontend
│   └── api/          # FastAPI backend
├── packages/
│   └── contracts/    # Shared TypeScript types
├── supabase/         # Archived SQL history only (not used at runtime)
├── scripts/          # bootstrap.py, dev orchestration
└── docs/             # API docs, migration notes
```

---

## Key Concepts

- **Hub** — A community space (e.g. "Oakwood Neighborhood"). Users join via membership.
- **Deet** — A post/update within a hub (text, media, reactions).
- **Profile** — User identity; linked to auth user via `profiles.user_id`.
- **Membership** — User ↔ Hub relationship with role (member, admin, etc.).

---

## Auth Flow

1. User signs in at `/auth` — Google OAuth or email/phone + password (register).
2. API issues JWT; web app stores it in HttpOnly cookie via `/auth/login` or `/auth/callback`.
3. Session resolved via `GET /api/v1/auth/me` (not client-side JWT decode).
4. Unverified users redirected to `/auth/verify` (email link and/or phone OTP). **One verified contact** (email or phone) is enough to use the app; other contacts may stay unverified on the profile.
5. Protected API routes require verified account (`verification_gate` middleware + `get_verified_user`).

---

## Service Layer Pattern

All data access goes through `apps/web/lib/services/`:

```
Component → lib/services/deets/create-deet.ts → lib/api/client.ts → FastAPI
```

- **Never** call the database directly from the frontend.
- Services are thin wrappers; interfaces stay stable if backend changes.

---

## Database Schema

- **Source of truth:** SQLAlchemy models in `apps/api/app/db/models/` + Alembic migrations in `apps/api/alembic/versions/`.
- **Local empty DB:** `npm run bootstrap` (creates tables + stamps Alembic).
- **Existing RDS:** `alembic upgrade head` from `apps/api`.
- **Archived SQL:** `supabase/migrations/` — historical reference only; do not run for new environments.

---

## Environment Variables

| App | File | Key vars |
|-----|------|----------|
| Web | `apps/web/.env.local` | `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_NOTIFICATIONS_REALTIME_ENABLED`, Google OAuth |
| API | `apps/api/.env` | `DATABASE_URL`, `JWT_SECRET`, `GOOGLE_*`, `NOTIFICATIONS_REALTIME_ENABLED` |

See `apps/web/env.template` and `apps/api/.env.example` for full lists.

---

## Common Commands

```bash
npm run dev              # Start web + API (via scripts)
npm run bootstrap        # Fresh local DB: create schema + stamp Alembic
cd apps/api && alembic upgrade head   # Apply migrations on existing DB
```

---

## Phase Status

| Phase | Status |
|-------|--------|
| Phase 0 — Cognito removal | Done |
| Phase 1 — Credential registration + verification | Done (local DB bootstrapped; API gated) |
| Phase 2 — AWS production hardening | In progress (ECS, RDS, S3) |

---

## Docs to Read First

1. [ARCHITECTURE.md](./ARCHITECTURE.md) — full system design
2. [docs/local-dev-bootstrap.md](./docs/local-dev-bootstrap.md) — local setup
3. [docs/chat-api.md](./docs/chat-api.md) — chat/realtime API
