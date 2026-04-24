# uDeets — AI Assistant Index

> This file tells AI assistants (Claude) what to read and in what order.
> Read this first, then the two canonical docs below.

---

## What uDeets is (30-second version)

Next.js 16 + Supabase community hub platform. Users create "hubs" (for temples, restaurants, HOAs, clubs, SMBs, etc.) where members see a feed of "deets" (posts/updates), events, photos, and files. Also positioned as a free micro-website replacement for SMBs and local communities. Mobile-first, Band-app inspired, Richmond-VA → US → India.

- Live: https://udeets-ui-web.vercel.app
- Owner: udeets (udeetsdev1@gmail.com)
- Source of truth: this GitHub repo

---

## The only two docs you need

1. **`project-context.md`** — the **living state of the project**. Current setup, what shipped in each session, known issues, open items, Phase-2 (AWS migration) plans, Future/platform plans, decisions log, principles. Updated at the end of every substantial session.

2. **`architecture.md`** — the **stable technical reference**. Tech stack (Current / Phase-2 / Future), monorepo layout, Hub detail page component tree, services catalog, DB schema, design tokens, migration file index, patterns & conventions.

### Read order by task

| Task type | Read first | Read second |
|---|---|---|
| Bug fix | `project-context.md` § Open Items | `architecture.md` (relevant service / component) |
| New feature | `project-context.md` § Current Setup | `architecture.md` |
| DB / migration change | `architecture.md` § DB Schema + § Migration Index | `project-context.md` § Open migrations |
| Design / styling | `architecture.md` § Design Tokens | `apps/web/app/globals.css`, `apps/web/lib/theme.ts` |
| Hub template work | `architecture.md` § Hub Template System | `apps/web/lib/hub-templates/` |
| Auth / profile | `project-context.md` § Authentication Flow | `apps/web/services/auth/` |
| Refactor touching services | All of `architecture.md` first | Then source files |
| Session wrap-up | `project-context.md` § How to Update This File | — |

---

## Critical conventions (do not violate)

1. **Service layer first** — all Supabase calls go through `apps/web/lib/services/*`. No direct `supabase.from(...)` in pages/components.
2. **Migrations only for schema changes** — never edit the Supabase dashboard directly. Add a `supabase/migrations/YYYYMMDD_<name>.sql` file.
3. **RLS gotchas:**
   - `hubs.created_by` is `text`, `auth.uid()` is `uuid` — cast with `::text`.
   - Supabase relational queries fail when FK points to `auth.users`; use two-step fetch.
4. **Backward-compatible queries** — try new columns, catch errors mentioning missing columns, retry without.
5. **Optimistic UI + server reconciliation** — `*CountOverrides` state for likes/shares/views.
6. **No hardcoded colors** — use `lib/theme.ts` + CSS tokens (`--ud-brand-primary`, `--ud-bg-card`, etc.).
7. **Mobile-first** — 375px design target, adapt up.
8. **Universal tabs** across all hub templates: About, Posts, Attachments, Events, Members.
9. **Denormalized counts** — primary insert/delete first, count update fire-and-forget, `syncDeet*Counts` heals.
10. **Path alias:** `@/*` → `apps/web/*`.

---

## Environment

- **Node/npm** workspaces monorepo
- **Supabase project ID:** `psckhdbtissnmdgcfwgo`
- Dev: `npm install && cd apps/web && npm run dev` → http://localhost:3000
- Required env in `apps/web/.env.local`:
  - `NEXT_PUBLIC_SUPABASE_URL=https://psckhdbtissnmdgcfwgo.supabase.co`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key>`

---

## How to contribute context back

After a working session where substantial changes shipped:
1. Update `project-context.md` § 7 Completed Work — Session Log with a dated block of what shipped.
2. Update `project-context.md` § 8 Open Items — remove completed items, add newly-discovered ones.
3. If the architecture / component tree / services list changed, update `architecture.md`.
4. Bump "Last updated" at the top of `project-context.md`.
5. Do **not** duplicate information between the two files. `project-context.md` = what's true today + what's next. `architecture.md` = stable reference.
