---
name: bug-fix
description: Diagnose and fix a bug in the udeets codebase. Use this when the user describes a broken behavior, a UI glitch, a failing flow, a console error, or asks you to debug/trace/reproduce an issue in udeets. Triggers on phrases like "fix", "bug", "broken", "not working", "doesn't", "crashes", "throws", "reproduce", "why is X...", "debug", "diagnose", or anything that sounds like something is behaving incorrectly.
---

# udeets Bug Fix Workflow

Use this skill when I describe a bug, broken behavior, or regression in the udeets codebase. The goal is to locate the failure, understand the trigger, and produce a targeted fix that matches the existing patterns — without scope creep.

---

## Phase 1 — Orient (always first)

1. **Read `project-context.md`** — check § 8 Open Items to see if this bug is already tracked. If yes, look for prior investigation notes before starting from scratch.
2. **Read `architecture.md`** sections relevant to the feature area (service, hook, component, table, RLS policy).
3. **Capture the bug report** in one sentence. If my description is vague, ask me a single clarifying question before diving in.

---

## Phase 2 — Locate

Trace the bug along the udeets layer stack, in this order:

1. **UI layer** — which page / component renders this? Look under `apps/web/app/...` or `apps/web/app/hubs/[category]/[slug]/components/...`
2. **Hook layer** — is there a `useXxx` hook orchestrating state? Look in `apps/web/app/hubs/[category]/[slug]/hooks/` or `apps/web/hooks/` or `apps/web/services/auth/`
3. **Service layer** — which function in `apps/web/lib/services/*` is involved? Never skip this layer.
4. **DB layer** — is there an RLS policy, trigger, or RPC? Look in `supabase/migrations/`
5. **Network layer** — is a server API route involved? Look in `apps/web/app/api/`

At each layer, read the actual code. Do NOT assume behavior from names. Report which layer(s) are implicated before writing a fix.

### udeets-specific heuristics

- **"Not saving" bugs** — 90% of the time this is one of: RLS policy denying the write, optimistic UI not reconciling, or a missing `await` on the service call. Check RLS first if the insert/update returns success but the row isn't persisted on reload.
- **"Wrong count" bugs** — denormalized `*_count` columns drift. Check `syncDeet*Counts` was called, or if the interaction row itself wasn't inserted.
- **"Author name is blank / says User"** bugs — the profile name cascade is `profiles.full_name → auth user_metadata.full_name → auth user_metadata.name → email prefix → "User"`. Check that `useProfileSync` has run for the user and that `listDeetComments` / similar service calls are reading profiles correctly.
- **"Column does not exist" errors** — the migration hasn't been applied to the live Supabase. Check `project-context.md` § 8 for pending migrations.
- **"Permission denied" / "row violates RLS"** errors — RLS gotchas list: `hubs.created_by` is text not uuid (cast `auth.uid()::text`); FK to `auth.users` breaks Supabase joins (use two-step fetch).
- **Realtime stale** — `subscribeToDeets` watches `deets`, `deet_likes`, `deet_comments`. If the update doesn't appear, either (a) the table isn't in the subscription list, or (b) the 150 ms debounce is coalescing.
- **Hub tab/template behavior** — all templates use universal tabs: About, Posts, Attachments, Events, Members. If a tab is missing, check `lib/hub-templates/<category>.ts` and `HubClient.tsx`.

---

## Phase 3 — Propose (pause for approval)

Before writing any code, present:

1. **Root cause** — one paragraph, no speculation
2. **Proposed fix** — which files, which lines, what the change does
3. **Risk** — does this touch a shared service? any RLS implications? any migration needed?
4. **Tests** — what tests will you add or update?

Wait for explicit approval before editing files. Exception: single-line typo fixes can proceed without approval.

---

## Phase 4 — Fix

- **Match existing patterns.** Mimic the style of neighboring code.
- **Service layer first.** Never call `supabase.from(...)` directly in pages/components.
- **Backward-compatible queries.** If adding a new column read, wrap in try/catch that falls back to the old shape.
- **Optimistic UI + server reconciliation.** Keep the `*CountOverrides` pattern for interaction changes.
- **No hardcoded colors.** Use `lib/theme.ts` + CSS tokens.
- **No new comments unless I ask.**
- **No unrelated refactors.**

If the fix requires a migration:
1. Create `supabase/migrations/YYYYMMDD_<name>.sql` (use today's date)
2. Add graceful fallback for deploys that haven't applied it yet
3. Flag that I need to `supabase db push` or apply via the SQL editor

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

1. If the bug was in `project-context.md` § 8 Open Items, remove it.
2. Add an entry to `project-context.md` § 7 Completed Work — Session Log under today's date describing what shipped.
3. If a new pattern / convention emerged, add it to `architecture.md` § Key Patterns & Conventions.
4. Bump "Last updated" at the top of `project-context.md`.

---

## What NOT to do

- Don't fix "adjacent" bugs you notice while in there. Flag them and move on.
- Don't introduce new libraries or dependencies without asking first.
- Don't add `console.log` statements "just in case."
- Don't create wrapper services, abstractions, or new files unless the fix genuinely requires them.
- Don't commit unless I explicitly ask. Never push to main.
- Don't edit `README.md` unless I ask — it's intentionally out of date / archived.
