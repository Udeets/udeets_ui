---
name: bug-fix
description: Diagnose and fix a bug in the udeets codebase. Use this when the user describes a broken behavior, a UI glitch, a failing flow, a console error, or asks you to debug/trace/reproduce an issue in udeets. Triggers on phrases like "fix", "bug", "broken", "not working", "doesn't", "crashes", "throws", "reproduce", "why is X...", "debug", "diagnose", or anything that sounds like something is behaving incorrectly.
---

# udeets Bug Fix Workflow

Use this skill when I describe a bug, broken behavior, or regression in the udeets codebase. The goal is to locate the failure, understand the trigger, and produce a targeted fix that matches the existing patterns — without scope creep.

---

## Phase 1 — Orient (always first)

1. **Read `project-context.md`** — check Phase Status and docs links for known gaps.
2. **Read `ARCHITECTURE.md`** sections relevant to the feature area (service, hook, component, table, API route).
3. **Capture the bug report** in one sentence. If my description is vague, ask me a single clarifying question before diving in.

---

## Phase 2 — Locate

Trace the bug along the udeets layer stack, in this order:

1. **UI layer** — which page / component renders this? Look under `apps/web/app/...` or `apps/web/app/hubs/[category]/[slug]/components/...`
2. **Hook layer** — is there a `useXxx` hook orchestrating state? Look in `apps/web/app/hubs/[category]/[slug]/hooks/` or `apps/web/hooks/` or `apps/web/lib/auth/`
3. **Service layer** — which function in `apps/web/lib/services/*` is involved? Never skip this layer.
4. **API / DB layer** — FastAPI router in `apps/api/app/routers/`, repository in `apps/api/app/db/repositories/`, or Postgres RPC from archived SQL in `supabase/migrations/` (reference). Check Alembic in `apps/api/alembic/versions/` for schema changes.
5. **Network layer** — Next proxy at `apps/web/app/api/v1/[...path]/route.ts` or dedicated routes under `apps/web/app/api/`

At each layer, read the actual code. Do NOT assume behavior from names. Report which layer(s) are implicated before writing a fix.

### udeets-specific heuristics

- **"Not saving" bugs** — often: API 403 (unverified user), validation error swallowed in UI, or missing `await` on the service call. Check FastAPI logs and network tab for the proxied `/api/v1/*` response.
- **"Wrong count" bugs** — denormalized `*_count` columns drift. Check count sync was called, or if the interaction row itself wasn't inserted.
- **"Author name is blank / says User"** bugs — check profile fetch via API and that `useProfileSync` / profile upsert has run for the user.
- **"Column does not exist" errors** — Alembic migration not applied on the target DB. Local empty DB: `npm run bootstrap`. Existing RDS: `cd apps/api && alembic upgrade head`.
- **"Permission denied" / 403** — check `verification_gate` middleware (unverified account) or hub membership / role checks in the API service layer.
- **Realtime stale** — chat/notifications use WebSocket with polling fallback when `NEXT_PUBLIC_*_REALTIME_ENABLED` is not `true`. Check env and `/health`.
- **Hub tab/template behavior** — all templates use universal tabs: About, Posts, Attachments, Events, Members. If a tab is missing, check `lib/hub-templates/<category>.ts` and `HubClient.tsx`.

---

## Phase 3 — Propose (pause for approval)

Before writing any code, present:

1. **Root cause** — one paragraph, no speculation
2. **Proposed fix** — which files, which lines, what the change does
3. **Risk** — does this touch a shared service? any migration needed?
4. **Tests** — what tests will you add or update?

Wait for explicit approval before editing files. Exception: single-line typo fixes can proceed without approval.

---

## Phase 4 — Fix

- **Match existing patterns.** Mimic the style of neighboring code.
- **Service layer first.** Never call FastAPI or the DB directly from pages/components — use `apps/web/lib/services/*` and `lib/api/client.ts`.
- **Backward-compatible queries.** If adding a new column read, wrap in try/catch that falls back to the old shape.
- **Optimistic UI + server reconciliation.** Keep the `*CountOverrides` pattern for interaction changes.
- **No hardcoded colors.** Use `lib/theme.ts` + CSS tokens.
- **No new comments unless I ask.**
- **No unrelated refactors.**

If the fix requires a migration:
1. Add an Alembic revision under `apps/api/alembic/versions/` (follow existing naming)
2. Update SQLAlchemy models in `apps/api/app/db/models/`
3. Add graceful fallback for deploys that haven't applied it yet
4. Flag that I need `alembic upgrade head` on RDS (or re-bootstrap locally)

---

## Phase 5 — Verify

Before saying "done":

1. **Typecheck clean** — `cd apps/web && npx tsc --noEmit` should report zero errors
2. **Tests pass** — run the relevant test file if one exists
3. **Reproduce the original bug is gone** — either by reasoning about the code path or running it locally
4. **No regressions obvious** — grep for the pattern/symbol to see if other callers need the same fix

Report back with:
- What was broken, what was fixed, which files changed, tests run, commands for me to apply any migration.

---

## Phase 6 — Document

1. If the bug was tracked in project docs, update or remove the note.
2. If a new pattern / convention emerged, add it to `ARCHITECTURE.md` § Key Patterns & Conventions.

---

## What NOT to do

- Don't fix "adjacent" bugs you notice while in there. Flag them and move on.
- Don't introduce new libraries or dependencies without asking first.
- Don't add `console.log` statements "just in case."
- Don't create wrapper services, abstractions, or new files unless the fix genuinely requires them.
- Don't commit unless I explicitly ask. Never push to main.
- Don't edit `README.md` unless I ask — it's intentionally out of date / archived.
