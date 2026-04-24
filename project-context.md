# uDeets — Project Context

> The living state of the project. Updated at the end of every substantial session.
> Owner: udeets (udeetsdev1@gmail.com)
> Last updated: April 24, 2026 (eod — Phase 1.5 roadmap locked, see § 7.5)

---

## 1. What uDeets is

uDeets is a Next.js + Supabase community hub platform inspired by the Band app. Users create **Hubs** (for temples, restaurants, HOAs, clubs, small businesses, and local communities) where members see a feed of **Deets** (posts/updates), events, photos, and files.

**The bigger vision:** uDeets is a free micro-website + community platform for any SMB or local community that can't afford or doesn't want a standalone website. Each Hub's About page looks and feels like a real website for that business or community. It replaces WhatsApp groups, Facebook pages, Google Business listings, and static websites.

- **Live URL:** https://udeets-ui-web.vercel.app
- **Repo:** GitHub (source of truth)
- **Local dev:** http://localhost:3000
- **Initial market:** Richmond, Virginia → US → India
- **Team:**
  - Product owner: me
  - Architect + UI/UX: Claude.ai
  - Full-stack dev: Claude (VS Code / Cowork)

---

## 2. Current Setup `[CURRENT]`

- Tech stack, services, DB schema, component tree — see `architecture.md`
- Frontend deployed on Vercel, backend is Supabase (auth + Postgres + storage + realtime)
- 36 migrations in `supabase/migrations/`
- All DB calls go through `apps/web/lib/services/*`
- 10 hub templates built, 5 completed end-to-end, 5 with configs created
- Auth: Google OAuth, Apple OAuth (pending dev account setup), email/password
- Idle-timeout auto-logout wired in (30 min + 60 sec warning)
- Realtime for deets, deet_likes, deet_comments
- Invite system: search-by-user + QR codes
- Profile: My Hubs, My Posts, Requests, Invitations tabs — all wired to real data

---

## 3. Phase-2 Setup `[PHASE 2 — AWS migration]`

The plan is to swap Supabase for AWS-native services without touching the UI. See `architecture.md` § 2 and § 16 for migration detail.

**Targets:**
- Storage → S3 + CloudFront
- Auth → Amazon Cognito
- Database → Aurora Serverless v2 (Postgres-compatible)
- API → API Gateway + Lambda
- Realtime → AppSync or API Gateway WebSockets

**Why this is easy:** the service-layer abstraction means the swap is a per-service-file rewrite. UI never changes.

**Readiness:**
- ✅ Service layer complete — no direct Supabase calls in pages/components
- ✅ Auth callback isolated (`/auth/callback/route.ts`)
- ✅ `profiles` table is canonical user data (portable)
- ⚠️ Storage bucket usage needs a dedicated `lib/services/storage/` file before swap
- ⚠️ Discover page has one raw fetch that needs a service wrapper

**Additional Phase-2 roadmap items** (independent of the AWS swap):
- More hub categories beyond the current 10
- HOA payment integration (Stripe) for community-dues collection
- Notifications system (push + email + in-app; prefs already in `profiles.notification_preferences` JSONB)
- Analytics for hub admins (views, engagement, growth)
- India market launch
- White-label for RWA / apartment communities

---

## 4. Future / Final Setup `[FUTURE — Platform phase]`

- **Native mobile app** — React Native or PWA shell; reuse Next.js code where possible
- **Payments** — Stripe for HOA dues and Hub Pro / Business Hub tier subscriptions
- **Push notifications** — APNs + FCM behind a unified service-layer interface
- **AI features** — Claude API behind `lib/services/ai/` for post summarization, local-news curation, hub-specific Q&A bots
- **White-label routing** — `custom-domain.com` resolves to tenant-branded sub-experience at the edge
- **Plugin-able hub templates** — templates move from in-repo configs to DB-backed, so new categories ship without a deploy
- **Analytics pipeline** — event ingestion → Kinesis → Redshift/ClickHouse → admin dashboards
- **Monetization tiers** (current plan):

  | Tier | Price | Features |
  |---|---|---|
  | Free | $0 | Basic hub, uDeets branding, 1 admin |
  | Pro Hub | $9.99/mo | Custom accent color, remove branding, analytics, 3 admins |
  | Business Hub | $19.99/mo | Priority in Discover, booking integration, unlimited admins |

---

## 5. Authentication Flow `[CURRENT]`

1. **Google/Apple OAuth** → `/auth/callback/route.ts` exchanges code → `upsertProfile()` saves `full_name`, `avatar_url`, `email` to `profiles`.
2. **Email/password** → `supabase.auth.signUp()` / `signInWithPassword()`.
3. **Profile sync** → `useProfileSync` hook in `AuthGuard` auto-backfills profile data from auth metadata on every session (fixes users who signed up before the upsert was added).
4. Google OAuth stores name under `full_name` OR `name` in `user_metadata` — the callback checks both.

---

## 6. Hub Architecture (summary)

Full architecture tree in `architecture.md` § 6. Summary:

- `HubClient.tsx` is the main orchestrator (~1400+ lines) — all hub state lives here via 9 custom hooks.
- Composer system: `CreateDeetModal` (full popup) + `DeetComposerCard` (inline) + `ComposerChildPanels` (5 child UIs: announcement, notice, poll, event, checkin + file).
- `DeetsSection.tsx` (~2200 lines) renders the feed with threaded comments, reactions, replies, and the image viewer.
- Hub templates (`lib/hub-templates/`) drive per-category UX — no hardcoded category logic in components.

---

## 7. Completed Work — Session Log

### Session (April 19, 2026) — Major sweep

**Completed 24 of 30 bugs/items from user testing.** Clean TypeScript after every batch.

- **Profile Requests & Invitations tabs** — real data fetch from `hub_members status='pending'` + `hub_invitations`; Accept / Decline / Cancel with optimistic UI; new `20260418_create_hub_invitations.sql` migration
- **Home page mobile hamburger** — added `Menu` button on `apps/web/app/page.tsx`, outside-click + Escape close, a11y
- **Composer file attachment end-to-end** — new `ComposerChildFlow = "file"`; file chips with name + size; `upload-deet-media.ts` with MIME allowlist + 15 MB file cap / 5 MB image cap; new `20260418_expand_deet_media_mime_types.sql`
- **Dashboard unread dot wired to real DB** — new `20260418_add_hub_members_last_seen.sql` (adds `last_seen_at`, `user_hubs_with_unread()` RPC, `mark_hub_seen(p_hub_id)` RPC); dashboard calls RPC and passes `unreadHubIds` to `DashboardHubCard.hasUnread`
- **Supabase Realtime for deets feed** — `subscribeToDeets` now watches `deets` + `deet_likes` + `deet_comments`; 150 ms debounce; both `HubClient` and `dashboard/page.tsx` pick up live likes + comments
- **Nominatim rate-limit protection** — new `app/api/geo/reverse` + `app/api/geo/search` routes; required `User-Agent` header; per-IP 1 req/sec token bucket
- **Profile name backfill** — one-shot `20260418_backfill_profile_names.sql` populates NULL `full_name` / `avatar_url` / `email` from `auth.users.raw_user_meta_data`
- **Data-loss fixes** — Hub About description now saves; comments retry once after `refreshSession()` on RLS failure; Disable-comments setting persists via `20260418_add_deets_allow_comments.sql`; Announcement + generic edit flow now calls `updateDeet` not `createDeet`; body + rich attachment rendering fixed
- **Poll correctness** — `castPollVote` aborts on pre-insert DELETE failure; `PollContent` tracks `selectedIndices: Set<number>` for multi-select; `togglePollVote` service; honors `allowMultiSelect` + `multiSelectLimit`
- **Feed gallery** — count-aware layout (1 = hero contain, 2 = 50/50, 3+ = large left + two stacked right with `+N` overlay)
- **Viewer sidebar HTML rendering** — post body now uses sanitized `dangerouslySetInnerHTML` so rich text renders (was showing literal tags)
- **Composer overflow** — modal has `maxHeight: calc(100vh - 2rem)`, form body scrolls, Header/Post button pinned
- **Hub photos album picker** — no longer hides current DP + cover from "Choose from Albums"; de-duplicated `allPhotos`; `Current DP` / `Current cover` badges; new `20260418_create_hub_attachments.sql` (creates missing `public.attachments` + backfills DP/cover/gallery)
- **About page rewrite** — header gets About / Use Cases / Resources nav; hero tagline update; reduced padding; new 4th value card ("Generate Sponsorship Revenue"); "Built for local connection" copy; footer text token fix (was invisible on white)
- **Hub hero admin UX** — pencil badge on DP, camera on cover (both mobile + desktop); admins get `Move` button that opens a range slider to set `object-position: 50% <y>%`; persisted via `20260418_add_hub_cover_position.sql` (`cover_image_offset_y`)
- **Hub About tab** — Connect save toast auto-dismisses after 3s; description char counter turns amber at 270+, red at 300, with "N left" → "character limit reached"; `maxLength={300}`
- **Hub invite (Search + QR)** — new `lib/services/profile/search-profiles.ts` (2+ chars, ILIKE, 10 max, escape-safe); new `lib/services/hubs/invite-user-to-hub.ts`; rebuilt `InviteModal` with Search tab (debounced 250 ms, `AbortController`, pills for Invite/Member/Invited) + QR tab (`QRCodeSVG`); new public `/hubs/[category]/[slug]/join` route with redirect-to-auth + pending insert + already-member redirect + slug-not-found fallback
- **Auto-logout on inactivity** — new `services/auth/useIdleTimeout.ts`: 30 min total + 60 sec warning; activity via mousemove/mousedown/keydown/touchstart/scroll/wheel (throttled 1/sec); cross-tab sync via `localStorage:udeets:last-activity`; tab-visibility reconciliation; "Still there?" modal with countdown + Stay signed in / Sign out buttons; redirect to `/auth?redirect=<path>&reason=idle` after signout

### Earlier sessions (summary)

- **April 13:** `deet_views`, `deet_shares`, comment replies (`parent_id`), comment reactions (`comment_reactions`), comment attachments (image + file), reaction-type emoji support, `deets` update-policy RLS
- **April 4–5:** Avatars bucket migration, `app_role` + admin management, recursion-safe RLS via `is_super_admin()` SECURITY DEFINER, expanded deets kind CHECK, poll votes
- **April 3 (Session 4):** Deet likes/comments/views wired to Supabase, denormalized count pattern, member approval flow with amber "Pending Requests" card, preset color theme picker (6 themes), About page reorder with collapsible cards, photos horizontal row, all 10 templates use universal tabs
- **April 1–2 (Sessions 2–3):** Auth fixes (Supabase URL leak, email/password toggle, validation), Join button state, public-hub membership insert, Discover shows user's own hubs, universal Members tab, avatar clipping fix
- **March 30:** Initial deets table + storage bucket, hub_members + RLS, profiles + preferences

---

## 7.5 Phase 1.5 Roadmap — locked April 24, 2026

> Multi-phase product plan locked end-of-day April 24, 2026. Next session resumes from here. Phase 6 (template editor) decisions are still open for debate — recommendations captured below.

### Locked decisions

**DO:**

- 6 super-categories (Local Business, Residential Community, Faith & Spirit, Education, Clubs & Interest, Civic & Nonprofit) with sub-category variants under each. One template file per super-category.
- Model Broadcast vs Engage as a hub-level setting, not a separate hub type. Default from super-category template; creator override at hub creation.
- Local v1 sources from uDeets public hubs only. Tabs: News / Deals / Events / Jobs.
- Bottom nav (logged-in): Home / Hubs / Notifications / Local. Hubs gets its own dedicated page.
- Template editor = palette-constrained: 6 preset color themes, 3 curated font pairings, drag-reorder sections within fixed list, ≤4 CTAs, 1 custom section block.
- Live-save with undo for low-stakes edits; draft-preview-publish for content-bearing edits.
- "System hubs" concept for seeding Local content is parked — revisit at GTM.

**DON'T:**

- Don't proliferate top-level categories beyond 6.
- Don't split hubs into separate Broadcast vs Engage models.
- Don't pull external feeds (Flipp, paid news APIs) before Phase 3+. Gate on a clear business case.
- Don't build a freeform page-builder. Ever.
- Don't let creators add About sections — only reorder and toggle visibility.
- Don't put Events in the bottom nav.
- Don't allow custom hex colors, custom fonts, raw HTML/CSS, or arbitrary embeds.

### Phases (sequenced)

#### Phase 1 — Taxonomy & foundation

**Currently:** 10 peer templates in `lib/hub-templates/`, flat category list, single-step Create Hub picker.

**New approach:** 6 super-categories with ~25 sub-category variants. One template file per super-category exposing `variants[]`. Two-step Create Hub picker (super-category → sub-category).

**Why:** Flat list works at 10, breaks at 25. Grouping is explorable, scalable, and cheaper to maintain. Discover becomes 6 browsable tiles instead of 25 chips.

**Tasks:**
- [ ] Finalize the canonical 6 super-category + sub-category list (write inline in this section once locked)
- [ ] Audit `hubs` table and `lib/hub-templates/` for what exists vs what's missing
- [ ] Migration: add `hub_mode`, `sub_category`, `broadcasts_to_local`, `lat`, `lng`, `address`
- [ ] Refactor `lib/hub-templates/` into 6 super-category files with `variants[]`
- [ ] Update `CATEGORY_TO_TEMPLATE` map (or replace with sub-category → super+variant lookup)
- [ ] Update Create Hub wizard to 2-step picker

#### Phase 2 — Navigation & app IA

**Currently:** Bottom nav (logged-in mobile) is Home / Events / Notifications / Local. `/dashboard` doubles as both the home feed and the hub-roster manager — top of page has tabs for My Hubs / Joined / Requested, then the hubs feed below.

**New approach:** Bottom nav becomes Home / Hubs / Notifications / Local. New `/hubs` page absorbs the roster tabs (My Hubs / Joined / Requested / Invitations) plus browse + filter controls. `/dashboard` becomes pure aggregate feed (Home).

**Why:** Bottom nav slots should map to four distinct mental models — feed, my communities, what changed, what's nearby. Events is not one of those: it's hub-contextual or part of Local discovery. Hubs is the heart of the app and deserves first-class prominence; today it's buried as a tab. Splitting Dashboard into Home + Hubs cleans up the IA. Mirrors mature social apps (Instagram, Twitter, Band).

**Tasks:**
- [ ] Replace Events slot with Hubs in mobile bottom nav
- [ ] Create `/hubs` page; move roster tabs from `/dashboard` top
- [ ] Trim `/dashboard` to feed-only
- [ ] Mirror nav items in web top header for parity

#### Phase 3 — Broadcast vs Engage hubs

**Currently:** Every hub posts the same way — creator, admins, and members can all post (RLS-constrained). No distinction between brand-page hubs and group-conversation hubs.

**New approach:** Add `hub_mode: 'broadcast' | 'engage'` per hub. Default from super-category template (Retail → Broadcast, HOA → Engage, etc.); creator can override at creation or in Settings. Broadcast: members can like/comment/share but not post. Engage: members can post (configurable).

**Why:** No competitor handles both modes — Nextdoor is broadcast-only (dead for book clubs), WhatsApp is engage-only (noisy for restaurants). One platform serving both = the category-defining bet. Also kills a real SMB objection: "I don't want members posting on my brand page."

**Tasks:**
- [ ] Default `hub_mode` from super-category template at creation
- [ ] RLS update on `deets` insert/update/delete based on role × mode
- [ ] Composer hides "create post" for non-admins in Broadcast mode
- [ ] Hub Settings: mode toggle (creator only)

#### Phase 4 — Local page v2

**Currently:** `/local` exists with filter chips All / Deals / News / Jobs, sourced from public hub deets. Events folded into "All." No radius filter, no interest sub-filters, no explicit hub opt-in.

**New approach:** First-class tabs News / Deals / Events / Jobs (Events promoted to peer). Radius filter (3 / 5 / 10 mi / county) using `hubs.lat`/`hubs.lng` + browser geolocation. Per-tab interest chips (real estate, weather, traffic, burglary, politics, etc.). Hubs opt in via `broadcasts_to_local`. Source: uDeets public hubs only. Parked: a few "system hubs" to seed content in new cities — revisit at GTM.

**Why:** Local is the acquisition page that brings non-members to uDeets. Unifies four categories that currently live in four apps (Nextdoor / Flipp / Eventbrite / Indeed) onto one surface, filtered by distance. Internal-only sourcing makes public hubs valuable to SMBs (post deal → reach neighborhood) which creates the growth flywheel: SMB posts → Local shows it → user joins SMB hub → SMB gains follower. Zero API cost, zero licensing risk.

**Tasks:**
- [ ] Apply geo migration (from Phase 1)
- [ ] Geocode hub address on create/edit (use existing `/api/geo` proxy)
- [ ] Map deet kinds to local tabs; promote Events to first-class tab
- [ ] Rebuild `/local` with News / Deals / Events / Jobs tabs
- [ ] Radius filter UI
- [ ] Per-tab interest chip filters
- [ ] Haversine geo query: hubs in radius → fetch their deets

#### Phase 5 — Super-category template palettes

**Currently:** 10 peer templates of varying completeness; quality varies by template.

**New approach:** Six purpose-built super-category templates. Each defines About page structure, default CTAs, category-specific fields, default `hub_mode`, post types, and variant-level overrides (e.g., Coffee Shop variant of Local Business adds Menu section). End-to-end design per template.

**Why:** Generic templates produce generic hubs. Depth is what makes uDeets better than Facebook Groups or Circle — and what makes the "replace your website" pitch credible for SMBs. Hard to copy: one feature isn't a moat, but six thoughtful product surfaces are.

**Tasks:**
- [ ] Local Business super-template (Food, Retail, Health, Home Services, Pro Services, Auto, Salons)
- [ ] Residential Community super-template (HOA, Apartment, Neighborhood)
- [ ] Faith & Spirit super-template
- [ ] Education super-template (PTA, Schools, Tutoring, Daycare)
- [ ] Clubs & Interest super-template (Sports, Pet, Hobby, Book, Music)
- [ ] Civic & Nonprofit super-template

#### Phase 6 — Template editor (palette-constrained, debate open)

**Currently:** Creators can edit hub name, description, DP, cover, CTAs (modal), and theme color (6 presets). Section order is fixed. No font choice. No custom section. Changes save on explicit action.

**New approach:** Palette-constrained editor — lots of choice within curated options, nothing freeform.

**Editable surface:**
- Color theme: 6 presets on Free; +3 premium themes on Pro; custom accent on Business
- Font pairing: 3 curated pairings (Classic = Playfair + Inter, Modern = Geist + Inter, Editorial = Merriweather + Source Serif)
- Section order: drag to reorder within the optional zone (hero pinned at top)
- Section visibility: show/hide optional sections (don't delete — data preserved)
- CTAs: ≤4 on Free, 6 on Business, fixed action types
- Custom section: 1 on Free, 2 on Pro, 3 on Business — rich text + 1 image, no embeds
- Hub metadata: name, description, hero tagline, contact links, hours

**NOT editable:** layout, tab list, post kinds, color hex values, custom fonts/sizes, raw CSS / HTML / iframe / embeds.

**Open debates with my recommendations:**

1. **Live-save vs draft-preview-publish.** *Recommendation: hybrid.* Live-save + undo toast for low-stakes edits (color, font, section order, show/hide). Draft-preview-publish for content-bearing edits (description, custom section text, CTA targets) — typos shouldn't ship to members instantly.

2. **Version history.** *Recommendation: undo toast for v1; 7-day revert (last 5 changes) for v2.* Full history is enterprise territory — probably never.

3. **Template evolution.** *Recommendation: opt-in upgrade only.* When we ship a template v2, existing hubs keep their look. Surface a "Refresh to latest design" button in Settings.

4. **Editor on mobile.** *Recommendation: mobile-first.* Long-press drag with clear drop indicator at 375px. Don't ship desktop-first.

5. **Edit permissions.** *Recommendation: creator-only by default.* Toggle in Hub Settings to delegate template-edit rights to admins.

6. **Paywall split (proposed):**

   | Feature | Free | Pro $9.99 | Business $19.99 |
   |---|---|---|---|
   | Color themes | 6 | 9 | 9 + custom accent |
   | Font pairings | 3 | 3 | 5 |
   | CTAs | 4 | 4 | 6 |
   | Custom sections | 1 | 2 | 3 |
   | uDeets branding | Shown | Hidden | Hidden |
   | Analytics | — | Basic | Full |
   | Priority Discover | — | — | Yes |

**Why:** Zero customization = creators feel constrained. Too much customization = ugly hubs that embarrass the platform. Palette gives ownership without chaos. Hard rule: every editable element must be something we pre-designed. If a creator can choose it, we shipped it. Constraint is the feature.

**Tasks:**
- [ ] Drag-reorder About sections (mobile-first)
- [ ] Section show/hide toggles
- [ ] Font pairing picker (3 curated pairings)
- [ ] Unify theme picker UI with the rest of the editor
- [ ] Custom section block (rich text + 1 image)
- [ ] Undo toast for low-stakes edits
- [ ] Draft-preview-publish flow for content-bearing edits
- [ ] Settings: admin delegation toggle for template edits

#### Phase 7 — Polish / front door

Three unrelated cleanups, grouped only by "do before GTM."

**7a. Landing page redesign**
- *Currently:* `/` covers value prop but visually basic; not at Resend / Linear quality bar.
- *New approach:* Resend / Linear aesthetic — cleaner type, gradient accents, "why uDeets" three-pillar section, super-category case-study tiles, strong CTA above fold.
- *Why:* First impression matters. Pre-GTM front door must look premium.

**7b. Profile dropdown polish** (this is the "profile dropdown" item)
- *Currently:* Top-right web dropdown shows Profile / Settings / Sign out. Mobile differs — avatar tap from nav drawer.
- *New approach:* Add quick-access My Hubs, notification badge, plan-tier badge, expanded account info. Mobile/web parity.
- *Why:* Most-frequently-used UI for returning users; small tweaks pay back every session. Plan-tier badge becomes important when paid tiers ship.

**7c. Theme-token migration sweep**
- *Currently:* Some components still use hardcoded hex values (`#0C5C57`, `#E3F1EF`, `#A9D1CA`) instead of CSS variables.
- *New approach:* Audit all components, replace with `var(--ud-*)` tokens or `theme.ts` constants. Target: zero raw hex in component code.
- *Why:* Future rebrands, dark-mode polish, and paid-tier custom accent colors all become one-file changes instead of manual sweeps.

**Tasks:**
- [ ] 7a — Landing page redesign
- [ ] 7b — Profile dropdown polish (mobile + web parity)
- [ ] 7c — Theme-token sweep (audit + replace)

### Tomorrow's first task

Phase 1, step 1: write the canonical 6 super-category + sub-category list. Lock the names, lock the variants. Everything downstream flows from this.

---

## 8. Known Issues / Open Items

### Operational — migrations

All April 18 migrations have been applied to the live Supabase project. No pending DB operations.

### April 18 user-testing list — cleared

All 30 bugs/items from the April 18 user-testing pass are addressed. No items remain from that list.

### Outstanding from earlier sessions

- Profile dropdown premium redesign polish — shipped, minor tweaks may remain
- Landing page redesign (resend.com / linear.app aesthetic) — not yet started
- Unread dot on hub cards — wired to real data, needs live confirmation
- Post title showing "Photo" — covered by `GENERIC_TITLE_LABELS`, confirm on dashboard/profile/alerts
- `lib/theme.ts` built; ongoing work to migrate any remaining hardcoded hex values to tokens

### Caveats worth knowing

- **Invite search (`searchProfiles`) scoped to all signed-up users.** If opt-in discoverability is needed later, add `profiles.searchable boolean default true` and narrow the query.
- **`useIdleTimeout` 30 min / 60 sec** are defaults — overridable via `idleTimeoutMs` / `warningDurationMs` props.
- **`searchProfiles` uses ILIKE** — if `profiles` grows past ~100k rows, add a `pg_trgm` GIN index on `full_name`.

---

## 9. Important Decisions Made

- No chat in Phase 1
- No Stripe in Phase 1 — payment links only
- Band app is the UX north star
- Mobile-first always — 375px first, adapt up
- White backgrounds throughout
- `hub_members.role`: creator | admin | member
- Discover page accessible without login
- Always capture full name on OAuth signup
- Create Hub is a modal overlay
- Hub page uses a 2-column layout
- Email/password kept but not prominently promoted
- Local News/Deals/Hazards are post types with filter chips (Phase 1)
- Hub content gated by membership
- uDeets = free micro-website replacement for SMBs and communities
- Hub About page = micro-website per category template
- Editable CTAs replace static menu photos and links
- No standalone HOA app — HOA is a hub template inside uDeets
- Template system built now (not Phase 2) to avoid a full rewrite later
- ALL templates have a Members tab — label "Members" universally
- All templates use universal tabs: About, Posts, Attachments, Events, Members
- Preset color palette (6 themes) instead of a full color picker
- Template-specific sections (Menu, Services, etc.) use images only for now
- About page layout: Welcome → Description → 3 collapsible cards (Connect, About, Members) → Photos row
- Member approval: admin approves/rejects from Members tab; reject sets status to "rejected" not delete
- `hubs.created_by` is text, `auth.uid()` is uuid — always cast with `::text` in RLS
- Invite search scoped to all signed-up users (change later if opt-in discoverability is needed)

---

## 10. Development Principles

1. **Service layer first** — all DB calls via `lib/services/*`
2. **Mobile-first always** — 375px design target, adapt up
3. **Both breakpoints required** — mobile AND desktop for every feature
4. **No hardcoded colors** — use `lib/theme.ts` + CSS tokens
5. **Lucide / Phosphor only** — consistent stroke weight
6. **White backgrounds** — `--ud-bg-subtle` for content areas
7. **AWS-ready** — service interfaces swappable without touching UI
8. **Schema changes = migration file** — no direct dashboard edits
9. **Template-driven rendering** — HubClient reads config, never hardcodes category logic
10. **Editable over static** — admins control their content, no hardcoded fields

---

## 11. Brand

- Primary teal: `#0C5C57`
- Light teal accent: `#E3F1EF`
- Cover/placeholder teal: `#A9D1CA`
- White backgrounds everywhere (mint → white migration done)
- Font: serif bold headings + clean sans-serif body
- Design north star: Band App (band.us) — mobile-first, clean, premium community feel
- Secondary inspiration: linear.app, resend.com, circle.so, luma.app

---

## 12. How to Update This File

At the end of any session where substantial changes shipped:
1. Add a new block under § 7 Completed Work — Session Log with the date and a bulleted list of what shipped
2. Update § 8 Open Items — remove items that are now done, add newly-discovered ones
3. Update § 2 Current Setup if anything foundational changed
4. If the architecture / component tree / services list changed, update `architecture.md` too
5. Bump the "Last updated" date at the top of this file

Do **not** duplicate info between this file and `architecture.md` — this file is the living "what's true today + what's next"; `architecture.md` is the stable reference.
