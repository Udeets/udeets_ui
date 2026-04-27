# uDeets — Architecture & Tech Stack

> Quick-reference for AI assistants and developers. Read this file before exploring code.
> Covers: tech stack, monorepo layout, component tree, services, DB schema, patterns, and phase-2 / future migration plans.
> **Scope markers:** sections tagged `[CURRENT]` describe the shipped Supabase stack. `[PHASE 2]` covers the AWS migration. `[FUTURE]` covers the long-term platform vision.

---

## 1. Tech Stack `[CURRENT]`

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.1.6 |
| UI | React | 19.2.3 |
| Styling | Tailwind CSS + CSS custom properties | 4 |
| Language | TypeScript (strict) | 5.x |
| Auth | Supabase Auth (Google + Apple OAuth + email/password) | @supabase/ssr 0.9 |
| Database | Supabase Postgres with RLS | @supabase/supabase-js 2.57 |
| Storage | Supabase Storage (`deet-media`, `avatars`) | — |
| Realtime | Supabase Realtime (deets, deet_likes, deet_comments) | — |
| Icons | Lucide React + Phosphor Icons | 0.577, 2.1.10 |
| Forms/UI state | React hooks only (no Redux / Zustand / Query lib) | — |
| Monorepo | npm workspaces | — |
| Deploy | Vercel | — |
| Geo | Browser Geolocation API + Nominatim (OpenStreetMap) | — |
| Supabase project ID | `psckhdbtissnmdgcfwgo` | — |

**Env vars** (`apps/web/.env.local`):
- `NEXT_PUBLIC_SUPABASE_URL=https://psckhdbtissnmdgcfwgo.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key>`

**Remote image hosts** (`next.config.ts`): `lh3.googleusercontent.com`, `psckhdbtissnmdgcfwgo.supabase.co`

**Path alias:** `@/*` → `apps/web/*`

---

## 2. Tech Stack `[PHASE 2 — AWS Migration]`

Plan is to swap Supabase for AWS-native services while keeping the service-layer interface stable. No UI code changes required because all DB calls go through `apps/web/lib/services/*`.

| Layer | Current (Supabase) | Phase 2 (AWS) | Migration notes |
|---|---|---|---|
| Auth | Supabase Auth | Amazon Cognito | Same callback route pattern, same `upsertProfile` call |
| Database | Supabase Postgres | Aurora Serverless v2 (Postgres-compatible) | Export/import via `pg_dump`, reapply RLS-equivalent policies at the API layer |
| Storage | Supabase Storage | S3 + CloudFront | Abstract storage behind a `lib/services/storage/` file first |
| API | Next.js Route Handlers + Supabase JS client | API Gateway + Lambda | Swap service layer implementations; UI stays untouched |
| Realtime | Supabase Realtime | AppSync (GraphQL subscriptions) or API Gateway WebSockets | Keep `subscribeToDeets` signature; swap underlying transport |

**Readiness checklist (current status):**
- ✅ All DB calls behind service files (`lib/services/*`)
- ✅ No direct Supabase calls in pages/components
- ✅ `profiles` table is canonical user data (portable)
- ✅ Auth callback isolated (`/auth/callback/route.ts`)
- ⚠️ Storage bucket abstraction — needs a dedicated service file before swap
- ⚠️ Discover page has one raw fetch — needs a service wrapper

**Migration sequence (when triggered):**
1. Storage → S3 + CloudFront
2. Auth → Cognito
3. DB → Aurora Serverless
4. API → Lambda + API Gateway

---

## 3. Tech Stack `[FUTURE — Platform Phase]`

- **Native mobile:** React Native or PWA shell; reuse Next.js code where possible.
- **Payments:** Stripe (HOA dues, Hub Pro / Business Hub tier subscriptions).
- **Notifications:** Push (APNs/FCM) + email (SES or Resend) + in-app. Preferences already in `profiles.notification_preferences` JSONB.
- **Analytics:** Hub-admin dashboards (views, engagement, member growth). Likely Aurora + a light Metabase-like viewer, or ClickHouse for scale.
- **AI features:** Post summarization, local news curation, hub-specific Q&A bots. Likely Claude API behind a service-layer wrapper.
- **White-label:** RWA / apartment / PTA tenants get branded subdomains and pre-configured templates.

---

## 4. Monorepo Structure `[CURRENT]`

```
udeets-ui/
├── apps/
│   ├── web/              # Next.js frontend (primary app)
│   ├── api/              # Fastify API server (minimal, mostly unused)
│   └── db/               # DB config placeholder
├── packages/             # Shared packages (reserved, empty)
├── supabase/
│   └── migrations/       # SQL migration files (chronological)
├── scripts/              # Build/deploy scripts
├── package.json          # Root workspace config
├── CLAUDE.md             # AI-assistant index
├── project-context.md    # Current state + open items + future plans
└── architecture.md       # THIS FILE
```

### `apps/web` Layout

```
apps/web/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout
│   ├── globals.css               # Tailwind + CSS custom properties (design tokens)
│   ├── page.tsx                  # Landing page (/)
│   ├── auth/                     # /auth (login), /auth/callback (OAuth)
│   ├── dashboard/                # /dashboard
│   ├── discover/                 # /discover, /discover/location
│   ├── create-hub/               # /create-hub (wizard)
│   ├── profile/                  # /profile
│   ├── settings/                 # /settings
│   ├── admin/                    # /admin (super_admin only)
│   ├── alerts/                   # /alerts
│   ├── events/                   # /events
│   ├── my-posts/                 # /my-posts
│   ├── local/                    # /local
│   ├── about/, privacy/, terms/, use-cases/, resources/
│   ├── seed/                     # /seed (data seeding)
│   ├── api/geo/                  # /api/geo/reverse, /api/geo/search (Nominatim proxy)
│   └── hubs/[category]/[slug]/   # Main hub detail page
│
├── components/                   # Shared components (AuthGuard, navigation, theme-provider)
├── hooks/                        # Shared hooks (useUserRole)
├── services/auth/                # signInWithGoogle, signInWithApple, signOut, useAuthSession, useProfileSync, useIdleTimeout
├── types/                        # Shared types
├── lib/                          # Core library (services + utilities)
├── public/                       # Static assets (hub-images/, avatars/)
├── middleware.ts                 # Auth session middleware
└── next.config.ts                # Image remote patterns for Google + Supabase
```

---

## 5. Route Map `[CURRENT]`

| Route | Page | Notes |
|---|---|---|
| `/` | Landing/home page | Public marketing page |
| `/about` | About page | Company info, timeline, orbit graphic |
| `/auth` | Sign in / sign up | Google + Apple OAuth + email/password |
| `/auth/callback` | OAuth callback | Upserts profile from auth metadata |
| `/dashboard` | User dashboard | Authenticated, hubs rail + feed |
| `/discover` | Hub discovery | Category strip, location search |
| `/discover/location` | Location-based discovery | Map/geo search |
| `/create-hub` | Hub creation wizard | Template selection, multi-step |
| `/hubs/[category]/[slug]` | Hub detail page | Main hub view with tabs |
| `/hubs/[category]/[slug]/full` | Full hub view | Extended view |
| `/hubs/[category]/[slug]/join` | Hub join page (QR target) | Prompts auth if needed |
| `/profile` | User profile | My Info / My Hubs / My Posts / Requests / Invitations tabs |
| `/settings` | User settings | Notifications, privacy prefs |
| `/admin` | Admin panel | Super admin user management |
| `/alerts`, `/events`, `/my-posts` | Listings | |
| `/terms`, `/privacy`, `/use-cases`, `/resources` | Static | Legal + marketing |
| `/api/geo/reverse`, `/api/geo/search` | Nominatim proxy | Rate-limited, adds required User-Agent |

---

## 6. Hub Detail Page — Component Tree `[CURRENT]`

**Route:** `/hubs/[category]/[slug]` (example: `/hubs/food-dining/desibites`)

```
page.tsx (Server Component)
  → getHubBySlug(category, slug) → toHubRecord()
  └── HubRouteClient.tsx (Client wrapper — passes initialHub)
      └── HubClient.tsx (Main orchestrator — ALL state lives here)
          │
          │  HOOKS (state management):
          │  ├── useDeetComposer()      — composer form state, media uploads, submit
          │  ├── useDeetInteractions()  — likes, comments, views, reactors
          │  ├── useHubViewerState()    — image viewer modal (open/close/prev/next)
          │  ├── useHubMediaFlow()      — DP, cover, gallery uploads
          │  ├── useHubSettingsFlow()   — hub settings persistence
          │  ├── useHubConnectFlow()    — social/contact links
          │  ├── useHubFilters()        — search + filter feed items
          │  ├── useHubLiveFeed()       — realtime Supabase subscription
          │  └── useHubSectionState()   — tab/panel navigation
          │
          │  RENDERED SECTIONS:
          ├── HubHeroHeader             — DP, cover image, hub name, member count
          ├── HubSidebarNav             — Desktop left sidebar with tab links
          ├── HubTabBar                 — Mobile tab buttons
          ├── AboutSection              — Description, connect links, custom sections, CTAs
          ├── DeetsSection              — Main feed (posts/deets) — see below
          ├── EventsSection             — Events list
          ├── MembersSection            — Member list, pending requests (admin approve/reject)
          ├── AdminsSection             — Admin management
          ├── AttachmentsSection        — Photos + Files tabs
          ├── PhotosSection / FilesSection
          ├── ReviewsSection
          ├── SettingsSection           — Hub settings form
          ├── CTADisplay / CTAEditorModal
          ├── CustomSectionDisplay / CustomSectionEditorModal
          │
          │  MODALS:
          ├── CreateDeetModal           — Rich text composer with formatting
          │   ├── ComposerChildPanels   — Specialized UIs (poll, event, announcement, notice, checkin)
          │   └── ComposerIcons         — Phosphor icon buttons
          ├── DeetChildModal / DeetSettingsModal
          ├── InviteModal (Search + QR) / DeleteHubModal
          └── Image Viewer (portal)     — Full-screen image viewer with comment context
```

### DeetsSection Internals

DeetsSection is the largest component (~2200 lines).

```
DeetsSection (exported function, ~30 props)
├── Local state: sortOption, copiedDeetId, shareCountOverrides, sharedDeetIds, etc.
├── handleShareDeet()   — copies link + persists to deet_shares (idempotent)
├── handleDeleteDeet()  — with confirmation flow
├── Renders each HubFeedItem as a card with:
│   ├── Author row (avatar, name, role badge, time, 3-dot menu)
│   ├── Body content (HTML sanitized, image gallery, attachments, polls)
│   ├── Stats row (likes, comments, views, shares)
│   ├── Action bar (Like/EmojiReactButton, Comment, View, Share)
│   └── DeetCommentsSection (expanded when comment icon clicked)
│       ├── commentReactions state — persisted to comment_reactions table
│       ├── Loads reactions on mount via getCommentReactions()
│       ├── handleSetCommentReaction() — optimistic + toggleCommentReaction()
│       ├── CommentRow (top-level comments)
│       │   ├── Avatar, name, body, image thumbnail, file attachment
│       │   ├── React button → emoji picker (6 emojis + X to un-react)
│       │   ├── Reply button (top-level only)
│       │   └── Edit/Delete menu (own comments only)
│       └── Nested replies (ml-[46px] indent, one level deep)
│
├── Helper components (same file):
│   ├── EmojiReactButton — deet-level emoji reaction with popup picker
│   ├── CommentRow — single comment row (top-level or reply)
│   ├── DeetCommentsSection — comment list + input
│   └── Utility functions (sanitizeHtmlContent, commentTimeAgo, etc.)
│
└── Constants:
    ├── DEET_TYPE_CONFIG — icon/label/color per deet kind
    ├── EMOJI_TEXT_MAP — emoji → label mapping
    └── SortOption type ("Newest" | "Oldest" | …)
```

---

## 7. Lib — Services & Utilities `[CURRENT]`

### Supabase Clients (`lib/supabase/`)

| File | Purpose |
|------|---------|
| `client.ts` | Browser client via `createBrowserClient()` — singleton |
| `server.ts` | Server client via `createServerClient()` with cookie handling |
| `middleware.ts` | `updateSession(request)` — auth middleware |

**Env vars:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY`)

### Deet Services (`lib/services/deets/`)

| File | Key Exports |
|------|------------|
| `deet-types.ts` | `DeetType`, `DeetKind`, `DeetRecord`, `CreateDeetInput`, `DeetAttachment` |
| `deet-interactions.ts` | See function table below |
| `list-deets.ts` | `listDeets(options?)`, `subscribeToDeets(onChange)` |
| `create-deet.ts` | `createDeet(input)` |
| `update-deet.ts` | `updateDeet(input)` |
| `delete-deet.ts` | `deleteDeet(deetId)` |
| `query-utils.ts` | `DEET_COLUMNS`, `normalizeDeetRecord()`, `getDeetPreviewImages()` |
| `upload-deet-media.ts` | `uploadDeetMedia({file, hubId, hubSlug})` |
| `upload-comment-media.ts` | `uploadCommentImage(file)`, `uploadCommentFile(file)` |
| `poll-votes.ts` | `getPollVotes`, `getMyPollVotes`, `castPollVote`, `removePollVote`, `togglePollMultiVote` |

#### `deet-interactions.ts` — Function Reference

| Function | Signature | Description |
|----------|-----------|-------------|
| `toggleDeetLike` | `(deetId, reactionType?) → {liked, likeCount}` | Like/unlike with emoji support |
| `getDeetLikeStatus` | `(deetIds[]) → Map<id, {liked, count}>` | Batch like status |
| `addDeetComment` | `(deetId, body, parentId?, attachments?) → DeetComment` | Add comment with media/reply, self-heals profile names |
| `listDeetComments` | `(deetId) → DeetComment[]` | Threaded comments |
| `editDeetComment` | `(commentId, newBody) → void` | Edit comment |
| `deleteDeetComment` | `(commentId, deetId) → void` | Delete + update count |
| `syncDeetCommentCounts` | `(deetIds[]) → Record<id, count>` | Heal denormalized counts |
| `listDeetReactors` | `(deetId) → DeetReactor[]` | Who reacted |
| `getDeetReactorPreviews` | `(deetIds[]) → Record<id, DeetReactor[]>` | Batch previews |
| `incrementDeetView` | `(deetId) → boolean` | Record view (idempotent) |
| `listDeetViewers` | `(deetId) → DeetViewer[]` | Who viewed |
| `syncDeetViewCounts` | `(deetIds[]) → Record<id, count>` | Heal view counts |
| `recordDeetShare` | `(deetId) → {alreadyShared, total}` | Record share (idempotent) |
| `syncDeetShareCounts` | `(deetIds[]) → Record<id, count>` | Heal share counts |
| `toggleCommentReaction` | `(commentId, reactionType) → {emoji}` | Toggle comment emoji |
| `getCommentReactions` | `(commentIds[]) → Record<id, emoji>` | Batch user's comment reactions |
| `getDeetCounts` | `(deetIds[]) → Map<id, {likeCount, commentCount, viewCount}>` | Denormalized counts |

### Hub Services (`lib/services/hubs/`)

| File | Key Exports |
|------|------------|
| `hub-types.ts` | `HubRecord`, `Hub`, `CreateHubInput`, `UpdateHubInput`, `HubSettings`, `HubConnectLinks` |
| `get-hub-by-slug.ts` | `getHubBySlug(category, slug)` |
| `list-hubs.ts` | `listHubs(options?)` |
| `create-hub.ts` | `createHub(input)` |
| `update-hub.ts` | `updateHub(hubId, input)` |
| `delete-hub.ts` | `deleteHub(hubId)` |
| `upload-hub-media.ts` | `uploadHubMedia(file, hubId)` |
| `invite-user-to-hub.ts` | Invite flow (checks membership + pending invites, falls back gracefully) |

### Other Services

| Directory | Key Files |
|-----------|-----------|
| `services/members/` | `list-members.ts`, `list-members-client.ts`, `list-my-memberships.ts`, `manage-members.ts` |
| `services/events/` | `create-event.ts`, `list-events.ts`, `event-rsvps.ts` |
| `services/sections/` | `list-sections.ts`, `save-sections.ts` |
| `services/ctas/` | `list-ctas.ts`, `upsert-ctas.ts` (max 4 per hub) |
| `services/profile/` | `upsert-profile.ts`, `search-profiles.ts` |
| `services/admin/` | `list-users.ts`, `update-user-role.ts` |

### Core Lib Files

| File | Purpose |
|------|---------|
| `hub-content.ts` | `HubFeedItem`, `HubEventItem`, `HubNotificationItem`, `HubContent` types |
| `hubs.ts` | `HubRecord` type, `toHubRecord()` mapper, `normalizePublicSrc()` |
| `hub-color-themes.ts` | Color theme system for hubs (6 themes) |
| `hub-templates/` | Per-category template configs |
| `roles.ts` | RBAC: `hasMinRole()`, `can()`, `resolveEffectiveRole()` |
| `theme.ts` | Design tokens (169 lines, centralized) |
| `mappers/deets/` | `map-deet-to-alert.ts`, `map-deet-to-event.ts`, `map-deet-to-dashboard-card.ts`, `map-legacy-deet-kind.ts` |

---

## 8. Database Schema `[CURRENT]`

### Core Tables

| Table | Key Columns | Constraints |
|---|---|---|
| `hubs` | id, name, slug, category, description, dp_image_url, cover_image_url, visibility, accent_color, cover_image_offset_y, created_by | — |
| `deets` | id, hub_id (FK→hubs), author_name, title, body, kind, preview_image_url, preview_image_urls[], attachments (jsonb), created_by (FK→auth.users), like_count, comment_count, view_count, share_count, allow_comments | kind CHECK |
| `profiles` | id (FK→auth.users), full_name, avatar_url, email, app_role, notification_preferences (jsonb), privacy_settings (jsonb) | — |
| `hub_members` | id, hub_id (FK→hubs), user_id (FK→auth.users), role, status, last_seen_at, joined_at | UNIQUE(hub_id, user_id) |
| `hub_invitations` | id, hub_id, invitee_user_id, inviter_user_id, status | UNIQUE pending |

### Interaction Tables

| Table | Key Columns | Constraints |
|---|---|---|
| `deet_likes` | id, deet_id, user_id, reaction_type (default `'like'`) | UNIQUE(deet_id, user_id) |
| `deet_comments` | id, deet_id, user_id, body, parent_id (self-FK), image_url, attachment_url, attachment_name | — |
| `deet_views` | id, deet_id, user_id, viewed_at | UNIQUE(deet_id, user_id) |
| `deet_shares` | id, deet_id, user_id, shared_at | UNIQUE(deet_id, user_id) |
| `comment_reactions` | id, comment_id, user_id, reaction_type | UNIQUE(comment_id, user_id) |
| `poll_votes` | id, deet_id, user_id, option_index | UNIQUE(deet_id, user_id, option_index) |

### Content Tables

| Table | Key Columns |
|---|---|
| `events` | id, hub_id, title, description, event_date, start_time, end_time, location, cover_image_url, created_by |
| `event_rsvps` | event_id, user_id, status (`'going'` / `'maybe'` / `'not_going'`) |
| `hub_sections` | id, hub_id, title, position, is_visible |
| `hub_section_items` | id, section_id, label, tag, value, position |
| `hub_ctas` | id, hub_id, label, action_type, action_value, position, is_visible |
| `attachments` | id, hub_id (FK→hubs), source (`'dp'`/`'cover'`/`'gallery'`/`'post'`), file_url, file_type |

### Storage Buckets

| Bucket | Limit | Types |
|---|---|---|
| `deet-media` | 15 MB (files), 5 MB (images) | PDF, Word, Excel, PowerPoint, text, CSV, zip, jpeg, png, webp, gif |
| `avatars` | 5 MB | jpeg, png, webp, gif |

### Key RPCs

| RPC | Purpose |
|---|---|
| `user_hubs_with_unread()` | Returns hubs with a deet newer than user's `last_seen_at` |
| `mark_hub_seen(p_hub_id)` | Updates `hub_members.last_seen_at` for current user |
| `is_super_admin()` | SECURITY DEFINER helper to avoid recursive RLS policy checks |

---

## 9. Key Patterns & Conventions `[CURRENT]`

1. **Service layer first** — every Supabase call goes through `lib/services/*`. Pages and components never import `@/lib/supabase/client` directly.

2. **Backward-compatible queries** — service functions try queries with new columns, catch errors mentioning missing columns, retry without. This lets code deploy before migrations are applied.

3. **Dynamic imports for non-critical paths** — shares, views, and similar telemetry use `import("@/lib/services/deets/deet-interactions")` to avoid blocking initial render.

4. **Optimistic UI + server reconciliation** — overrides like `likeCountOverrides`, `shareCountOverrides` give instant feedback, reconciled with server response.

5. **Denormalized counts** — `deets.*_count` columns. Primary operation (insert/delete in interaction table) succeeds first, count update fire-and-forget, `syncDeet*Counts()` functions heal stale values.

6. **Lifted state** — comment reactions are lifted from `CommentRow` to `DeetCommentsSection` so the image viewer sidebar can display the user's reaction state.

7. **Hub templates** — each hub category has a pre-configured template in `lib/hub-templates/` (tabs, post types, About sections, default CTAs, member roles, discover card, key fields). `HubClient` reads the template config — no hardcoded category logic.

8. **Universal tabs** — all 10 templates use: About, Posts, Attachments, Events, Members. Label is "Members" universally (no per-template rename).

9. **File path alias** — `@/*` → `apps/web/*` (configured in `tsconfig.json`).

10. **Component colocation** — hub page components live under `app/hubs/[category]/[slug]/components/` alongside their hooks in `hooks/`.

11. **Supabase RLS** — row-level security is used extensively. `is_super_admin()` SECURITY DEFINER avoids recursive policy checks.

12. **RLS gotcha** — `hubs.created_by` is `text`, `auth.uid()` is `uuid`. Always cast with `::text` in policies.

13. **FK gotcha** — Supabase relational queries fail when FK points to `auth.users` instead of `profiles`. Use two-step fetch (fetch IDs, then fetch profiles separately).

14. **Migrations only for schema** — no direct dashboard schema edits. Files in `supabase/migrations/YYYYMMDD_<name>.sql`.

15. **No hardcoded colors** — use `lib/theme.ts` + CSS tokens from `globals.css`.

---

## 10. Key Types Quick Reference `[CURRENT]`

```typescript
// Feed item displayed in DeetsSection
type HubFeedItem = {
  id: string; kind: HubFeedItemKind; author: string; authorId: string;
  authorAvatar?: string; role?: "creator" | "admin" | "member";
  time: string; title: string; body: string; image?: string; images?: string[];
  likes: number; comments: number; views: number; shares: number;
  deetAttachments?: HubFeedItemAttachment[];
}

type HubFeedItemKind = "announcement" | "photo" | "notice" | "event" | "poll"
  | "file" | "news" | "deal" | "hazard" | "alert" | "jobs" | "post"

// Database record for a deet
interface DeetRecord {
  id, hub_id, author_name, title, body, kind: DeetKind,
  preview_image_url, preview_image_urls: string[], attachments: jsonb,
  created_by: uuid, created_at, updated_at,
  like_count?, comment_count?, view_count?, share_count?,
  allow_comments?: boolean
}

type DeetKind = "Posts" | "Notices" | "Photos" | "News" | "Deals" | "Hazards" | "Alerts" | "Jobs"

// Threaded comment
interface DeetComment {
  id, deetId, userId, body, createdAt, authorName?, authorAvatar?,
  parentId?: string | null, replies?: DeetComment[],
  imageUrl?, attachmentUrl?, attachmentName?
}

// Image viewer state
type ViewerState = {
  open: boolean; images: string[]; index: number;
  title?: string; body?: string; focusId?: string;
  commentContext?: ViewerCommentContext;
}
```

---

## 11. RBAC Role Hierarchy `[CURRENT]`

```
super_admin (40)  →  Platform admin (profiles.app_role)
admin (30)        →  Hub creator / admin (hub_members.role)
member (20)       →  Active hub member
viewer (10)       →  Authenticated non-member or unauthenticated
```

Core function: `resolveEffectiveRole(appRole, hubRole, hubStatus, isAuthenticated)` in `lib/roles.ts`.

---

## 12. Design Tokens `[CURRENT]`

Defined in `globals.css`, used everywhere via `var(--ud-*)`:

```
--ud-brand-primary: #0C5C57 (teal)
--ud-brand-light:   #E3F1EF
--ud-gradient-from / --ud-gradient-to
--ud-text-primary / --ud-text-secondary / --ud-text-muted / --ud-text-inverse
--ud-bg-card / --ud-bg-subtle / --ud-bg-page
--ud-border / --ud-border-focus / --ud-border-subtle
--ud-status-danger / --ud-status-warning / --ud-status-success
```

Dark-mode overrides live under `@media (prefers-color-scheme: dark)`.

---

## 13. Hub Template System `[CURRENT]`

### Two Master Layouts

- **Business Hub** — Restaurant, Food Truck, Home Services, Health & Wellness, Events, Retail. Feel: micro-website, professional, customer-facing.
- **Community Hub** — HOA, Faith, PTA, Sports. Feel: community portal, warm, member-focused.

### Template Config (`getHubConfig` returns)

- `tabs[]` — ordered tab list
- `postTypes[]` — allowed deet kinds
- `terminology{}` — renamed labels
- `aboutSections[]` — About page blocks
- `defaultCTAs[]` — pre-populated CTA buttons
- `keyFields[]` — category-specific info fields
- `memberRoles{}` — role names and permissions
- `discoverCard{}` — Discover page appearance
- `layout` — `'business'` | `'community'`

### Status

| # | Template | Layout | Status |
|---|---|---|---|
| 1 | Food & Dining | Business | Complete |
| 2 | HOA & Residential | Community | Complete |
| 3 | Home Services | Business | Config created |
| 4 | Faith & Worship | Community | Config created |
| 5 | PTA & School | Community | Config created |
| 6 | Sports & Recreation | Community | Config created |
| 7 | Health & Wellness | Business | Config created |
| 8 | Events & Experiences | Business | Config created |
| 9 | Retail & Local Shop | Business | Config created |

All templates use universal tabs: About, Posts, Attachments, Events, Members.

---

## 14. Migration File Index `[CURRENT]`

Chronological — apply in this order:

```
20260330_create_deets.sql
20260330_enable_deets_rls.sql
20260330_create_deet_media_bucket.sql
20260330_create_hub_members.sql
20260330_backfill_hub_members.sql
20260330_fix_hub_members_rls.sql
20260330_fix_hub_members_rls_v2.sql
20260330_create_profiles.sql
20260330_add_profile_preferences.sql
20260401_create_hub_ctas.sql
20260401_add_hub_visibility.sql
20260401_create_hub_sections.sql
20260402_add_hub_accent_color.sql
20260402_create_deet_interactions.sql
20260402_hub_members_admin_update_rls.sql
20260403_create_events.sql
20260403_add_hubs_delete_rls.sql
20260404_add_profiles_app_role.sql
20260404_admin_manage_roles_rls.sql
20260404_create_avatars_bucket.sql
20260405_fix_profiles_rls_recursion.sql
20260405_expand_deets_kind_check.sql
20260405_create_poll_votes.sql
20260413_add_deets_update_policy.sql
20260413_create_deet_views.sql
20260413_add_reaction_type_and_comment_replies.sql
20260413_add_comment_attachments.sql
20260413_add_comment_reactions.sql
20260413_add_deet_shares.sql
20260418_add_deets_allow_comments.sql
20260418_add_hub_cover_position.sql
20260418_add_hub_members_last_seen.sql
20260418_backfill_profile_names.sql
20260418_create_hub_attachments.sql
20260418_create_hub_invitations.sql
20260418_expand_deet_media_mime_types.sql
```

See `project-context.md` § Known Issues for the subset that still needs to be applied to the live Supabase instance.

---

## 15. Mapping: DeetRecord → HubFeedItem `[CURRENT]`

File: `components/deets/map-deet-to-hub-feed-item.ts`

```
DeetRecord.kind ("Posts")      → HubFeedItem.kind ("post")
DeetRecord.author_name         → HubFeedItem.author
DeetRecord.created_by          → HubFeedItem.authorId
DeetRecord.preview_image_urls  → HubFeedItem.images
DeetRecord.like_count          → HubFeedItem.likes
DeetRecord.comment_count       → HubFeedItem.comments
DeetRecord.view_count          → HubFeedItem.views
DeetRecord.share_count         → HubFeedItem.shares
DeetRecord.attachments (jsonb) → HubFeedItem.deetAttachments
```

Legacy kind-to-type mapping in `lib/mappers/deets/map-legacy-deet-kind.ts`:

```
Posts → update     Notices → announcement     Photos → media
News → update      Deals → update             Hazards → alert
Alerts → alert     Jobs → update
```

---

## 16. Architecture Evolution `[PHASE 2 — AWS Migration]`

When Supabase is swapped for AWS:

- **`apps/web/lib/supabase/` → `apps/web/lib/api/`** — single HTTP client wrapping API Gateway
- **All `lib/services/*` files** — implementations swap from Supabase JS client calls to `fetch` against API Gateway. Interfaces stay identical so no UI changes.
- **RLS policies → Lambda authorizers** — translate Postgres RLS rules into Cognito-claim-based authorizer logic or Postgres policies on Aurora.
- **`subscribeToDeets`** — swap Supabase channel subscription for AppSync subscription or WebSocket. Keep `onChange` callback signature.
- **Storage helpers** — abstract `uploadDeetMedia`, `uploadHubMedia`, etc. behind a `lib/services/storage/` module now so the swap becomes a one-file change.
- **`/auth/callback`** — swap Supabase `exchangeCodeForSession` for Cognito Hosted UI callback. `upsertProfile` stays the same.

---

## 17. Architecture Evolution `[FUTURE — Platform Phase]`

- **Native shell** — Option A: wrap existing Next.js in a React Native WebView + native nav. Option B: dedicated React Native app that consumes the same API. Option C: PWA with installable manifest + service worker (cheapest, fastest).
- **Plugin-able hub templates** — move templates from in-repo configs to DB-backed, so new categories ship without a deploy.
- **White-label routing** — `custom-domain.com` → tenant-specific branding resolved at the edge.
- **AI service layer** — `lib/services/ai/` wrapping Claude API, with per-hub summarization, curation, and Q&A endpoints.
- **Analytics pipeline** — event ingestion → Kinesis → Redshift/ClickHouse → admin dashboards.
