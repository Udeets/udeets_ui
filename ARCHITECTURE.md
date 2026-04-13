# uDeets Architecture Reference

> Quick-reference for AI assistants and developers. Read this file first to avoid redundant exploration.
> Last updated: 2026-04-13

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.1.6 |
| UI | React | 19.2.3 |
| Styling | Tailwind CSS | 4 |
| Backend | Supabase (Postgres + Auth + Storage) | @supabase/ssr 0.9, @supabase/supabase-js 2.57 |
| Icons | Lucide React, @phosphor-icons/react | 0.577, 2.1.10 |
| Language | TypeScript | 5.x |
| Monorepo | npm workspaces | — |

---

## Monorepo Structure

```
udeets-ui/
├── apps/
│   ├── web/              # Next.js frontend (primary app)
│   ├── api/              # Fastify API server (minimal, mostly unused)
│   └── db/               # DB config placeholder
├── packages/             # Shared packages (empty, reserved)
├── supabase/
│   └── migrations/       # 31 SQL migration files
├── scripts/              # Build/deploy scripts
├── package.json          # Root workspace config
├── ARCHITECTURE.md       # THIS FILE
└── README.md
```

---

## Apps/Web Directory Layout

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
│   └── hubs/[category]/[slug]/   # THE MAIN HUB DETAIL PAGE (see below)
│
├── components/                   # Shared components (AuthGuard, nav, theme-provider)
├── hooks/                        # Shared hooks (useUserRole)
├── services/auth/                # Auth helpers (signInWithGoogle, signInWithApple, signOut, useAuthSession, useProfileSync)
├── types/                        # Shared types
├── lib/                          # Core library (see below)
├── public/                       # Static assets (hub-images/, avatars/)
├── middleware.ts                 # Auth session middleware
└── next.config.ts                # Image remote patterns for Google + Supabase
```

---

## Hub Detail Page — Component Tree

**Route:** `/hubs/[category]/[slug]` (e.g., `/hubs/food-dining/desibites`)

```
page.tsx (Server Component)
  → getHubBySlug(category, slug) → toHubRecord()
  └── HubRouteClient.tsx (Client wrapper — passes initialHub)
      └── HubClient.tsx (Main orchestrator — ALL state lives here)
          │
          │  HOOKS (state management):
          │  ├── useDeetComposer()      — composer form state, media uploads, submit
          │  ├── useDeetInteractions()   — likes, comments, views, reactors
          │  ├── useHubViewerState()     — image viewer modal (open/close/prev/next)
          │  ├── useHubMediaFlow()       — DP, cover, gallery uploads
          │  ├── useHubSettingsFlow()    — hub settings persistence
          │  ├── useHubConnectFlow()     — social/contact links
          │  ├── useHubFilters()         — search + filter feed items
          │  ├── useHubLiveFeed()        — realtime Supabase subscription
          │  └── useHubSectionState()    — tab/panel navigation
          │
          │  RENDERED SECTIONS:
          ├── HubHeroHeader             — DP, cover image, hub name, member count
          ├── HubSidebarNav             — Desktop left sidebar with tab links
          ├── HubTabBar                 — Mobile tab buttons
          ├── AboutSection              — Description, connect links, custom sections, CTAs
          ├── DeetsSection              — THE MAIN FEED (posts/deets) — see below
          ├── EventsSection             — Events list
          ├── MembersSection            — Member list, pending requests
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
          │   ├── ComposerChildPanels   — Specialized UIs (poll, event, announcement, etc.)
          │   └── ComposerIcons         — Phosphor icon buttons
          ├── DeetChildModal / DeetSettingsModal
          ├── InviteModal / DeleteHubModal
          └── Image Viewer (portal)     — Full-screen image viewer with comment context
```

### DeetsSection Internal Structure

DeetsSection is the largest component (~2200 lines). Key internals:

```
DeetsSection (exported function, ~30 props)
├── Local state: sortOption, copiedDeetId, shareCountOverrides, sharedDeetIds, etc.
├── handleShareDeet() — copies link + persists to deet_shares (idempotent)
├── handleDeleteDeet() — with confirmation flow
├── Renders each HubFeedItem as a card with:
│   ├── Author row (avatar, name, role badge, time, 3-dot menu)
│   ├── Body content (HTML sanitized, image gallery, attachments, polls)
│   ├── Stats row (likes, comments, views, shares)
│   ├── Action bar (Like/EmojiReactButton, Comment, View, Share)
│   └── DeetCommentsSection (expanded when comment icon clicked)
│       ├── commentReactions state — persisted to comment_reactions table
│       ├── Loads reactions from DB on mount via getCommentReactions()
│       ├── handleSetCommentReaction() — optimistic update + toggleCommentReaction()
│       ├── CommentRow (top-level comments)
│       │   ├── Avatar, name, body, image thumbnail, file attachment
│       │   ├── React button → emoji picker (6 emojis + X to un-react)
│       │   ├── Reply button (top-level only)
│       │   └── Edit/Delete menu (own comments only)
│       └── Nested replies (ml-[46px] indent, one level deep)
│
├── Helper components (defined in same file):
│   ├── EmojiReactButton — deet-level emoji reaction with popup picker
│   ├── CommentRow — single comment row (used for both top-level and replies)
│   ├── DeetCommentsSection — comment list + input for a single deet
│   └── Various utility functions (sanitizeHtmlContent, commentTimeAgo, etc.)
│
└── Constants:
    ├── DEET_TYPE_CONFIG — icon/label/color per deet kind
    ├── EMOJI_TEXT_MAP — emoji → label mapping ("👍" → "Liked", etc.)
    └── SortOption type ("Newest" | "Oldest" | etc.)
```

---

## Lib Directory — Services & Utilities

### Supabase Clients (`lib/supabase/`)

| File | Purpose |
|------|---------|
| `client.ts` | Browser client via `createBrowserClient()` — singleton |
| `server.ts` | Server client via `createServerClient()` with cookie handling |
| `middleware.ts` | `updateSession(request)` — auth middleware |

**Env vars:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Deet Services (`lib/services/deets/`)

| File | Key Exports |
|------|------------|
| `deet-types.ts` | `DeetType`, `DeetKind`, `DeetRecord`, `CreateDeetInput`, `DeetAttachment` |
| `deet-interactions.ts` | See function table below |
| `list-deets.ts` | `listDeets(options?)`, `subscribeToDeets(onChange)` |
| `create-deet.ts` | `createDeet(input)` |
| `update-deet.ts` | `updateDeet(input)` |
| `delete-deet.ts` | `deleteDeet(deetId)` |
| `query-utils.ts` | `DEET_COLUMNS` (select string), `normalizeDeetRecord()`, `getDeetPreviewImages()` |
| `upload-deet-media.ts` | `uploadDeetMedia({file, hubId, hubSlug})` |
| `upload-comment-media.ts` | `uploadCommentImage(file)`, `uploadCommentFile(file)` |
| `poll-votes.ts` | `getPollVotes()`, `getMyPollVotes()`, `castPollVote()`, `removePollVote()` |

#### deet-interactions.ts — Full Function Reference

| Function | Signature | Description |
|----------|----------|-------------|
| `toggleDeetLike` | `(deetId, reactionType?) → {liked, likeCount}` | Like/unlike with emoji support |
| `getDeetLikeStatus` | `(deetIds[]) → Map<id, {liked, count}>` | Batch like status |
| `addDeetComment` | `(deetId, body, parentId?, attachments?) → DeetComment` | Add comment with media/reply |
| `listDeetComments` | `(deetId) → DeetComment[]` | Threaded comments |
| `editDeetComment` | `(commentId, newBody) → void` | Edit comment |
| `deleteDeetComment` | `(commentId, deetId) → void` | Delete + update count |
| `syncDeetCommentCounts` | `(deetIds[]) → Record<id, count>` | Heal denormalized counts |
| `listDeetReactors` | `(deetId) → DeetReactor[]` | Who reacted + profile info |
| `getDeetReactorPreviews` | `(deetIds[]) → Record<id, DeetReactor[]>` | Batch reactor previews |
| `incrementDeetView` | `(deetId) → boolean` | Record view (idempotent) |
| `listDeetViewers` | `(deetId) → DeetViewer[]` | Who viewed |
| `syncDeetViewCounts` | `(deetIds[]) → Record<id, count>` | Heal view counts |
| `recordDeetShare` | `(deetId) → {alreadyShared, total}` | Record share (idempotent, one per user) |
| `syncDeetShareCounts` | `(deetIds[]) → Record<id, count>` | Heal share counts |
| `toggleCommentReaction` | `(commentId, reactionType) → {emoji}` | Comment emoji reaction toggle |
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

### Other Services

| Directory | Key Files |
|-----------|----------|
| `services/members/` | `list-members.ts`, `list-members-client.ts`, `list-my-memberships.ts`, `manage-members.ts` |
| `services/events/` | `create-event.ts`, `list-events.ts`, `event-rsvps.ts` |
| `services/sections/` | `list-sections.ts`, `save-sections.ts` |
| `services/ctas/` | `list-ctas.ts`, `upsert-ctas.ts` (max 4 CTAs per hub) |
| `services/profile/` | `upsert-profile.ts` |
| `services/admin/` | `list-users.ts`, `update-user-role.ts` |

### Core Lib Files

| File | Purpose |
|------|---------|
| `hub-content.ts` | `HubFeedItem`, `HubEventItem`, `HubNotificationItem`, `HubContent` types |
| `hubs.ts` | `HubRecord` type, `toHubRecord()` mapper, `normalizePublicSrc()` |
| `hub-color-themes.ts` | Color theme system for hubs |
| `hub-templates/` | Pre-configured templates per category (faith, food, sports, retail, etc.) |
| `roles.ts` | RBAC: `hasMinRole()`, `can()`, `resolveEffectiveRole()` |
| `mappers/deets/` | `map-deet-to-alert.ts`, `map-deet-to-event.ts`, `map-deet-to-dashboard-card.ts`, `map-legacy-deet-kind.ts` |

---

## Key Types Quick Reference

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
  like_count?, comment_count?, view_count?, share_count?
}

type DeetKind = "Posts" | "Notices" | "Photos" | "News" | "Deals" | "Hazards" | "Alerts" | "Jobs"

// Comment with threading
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

type ViewerCommentContext = {
  commentId: string; authorName: string; authorAvatar?: string;
  body: string; createdAt: string; reactedEmoji?: string | null;
  replies?: Array<{id, authorName, authorAvatar?, body, createdAt}>;
}
```

---

## Database Schema

### Core Tables

| Table | Key Columns | Constraints |
|-------|------------|-------------|
| `hubs` | id, name, slug, category, description, dp_image_url, cover_image_url, visibility, accent_color, created_by | — |
| `deets` | id, hub_id (FK→hubs), author_name, title, body, kind, preview_image_url, preview_image_urls[], attachments (jsonb), created_by (FK→auth.users), like_count, comment_count, view_count, share_count | kind CHECK |
| `profiles` | id (FK→auth.users), full_name, avatar_url, email, app_role, notification_preferences (jsonb), privacy_settings (jsonb) | — |
| `hub_members` | id, hub_id (FK→hubs), user_id (FK→auth.users), role, status, joined_at | UNIQUE(hub_id, user_id) |

### Interaction Tables

| Table | Key Columns | Constraints |
|-------|------------|-------------|
| `deet_likes` | id, deet_id (FK→deets), user_id (FK→auth.users), reaction_type (default 'like'), created_at | UNIQUE(deet_id, user_id) |
| `deet_comments` | id, deet_id (FK→deets), user_id (FK→auth.users), body, parent_id (FK→deet_comments), image_url, attachment_url, attachment_name | — |
| `deet_views` | id, deet_id (FK→deets), user_id (FK→auth.users), viewed_at | UNIQUE(deet_id, user_id) |
| `deet_shares` | id, deet_id (FK→deets), user_id (FK→auth.users), shared_at | UNIQUE(deet_id, user_id) |
| `comment_reactions` | id, comment_id (FK→deet_comments), user_id (FK→auth.users), reaction_type, created_at | UNIQUE(comment_id, user_id) |
| `poll_votes` | id, deet_id (FK→deets), user_id (FK→auth.users), option_index | UNIQUE(deet_id, user_id, option_index) |

### Content Tables

| Table | Key Columns |
|-------|------------|
| `events` | id, hub_id (FK→hubs), title, description, event_date, start_time, end_time, location, cover_image_url, created_by |
| `event_rsvps` | event_id (FK→events), user_id, status ('going'/'maybe'/'not_going') |
| `hub_sections` | id, hub_id (FK→hubs), title, position, is_visible |
| `hub_section_items` | id, section_id (FK→hub_sections), label, tag, value, position |
| `hub_ctas` | id, hub_id, label, action_type, action_value, position, is_visible |

### Storage Buckets

| Bucket | Limit | Types |
|--------|-------|-------|
| `deet-media` | 5 MB | jpeg, png, webp, gif |
| `avatars` | 5 MB | jpeg, png, webp, gif |

---

## Denormalized Count Pattern

Deets have denormalized count columns (`like_count`, `comment_count`, `view_count`, `share_count`) for fast reads. The pattern:

1. **Primary operation** (insert/delete in interaction table) always succeeds first
2. **Count update** happens non-blocking via `updateDenormalizedCount()` (fire-and-forget)
3. **Healing** — `syncDeet*Counts()` functions recount from source tables and fix stale values
4. **Frontend** — uses `*CountOverrides` state for optimistic UI, reconciles with server response

---

## RBAC Role Hierarchy

```
super_admin (40)  → Platform admin (profiles.app_role)
admin (30)        → Hub creator/admin (hub_members.role)
member (20)       → Active hub member
viewer (10)       → Authenticated non-member or unauthenticated
```

Key function: `resolveEffectiveRole(appRole, hubRole, hubStatus, isAuthenticated)` in `lib/roles.ts`

---

## Design Tokens (CSS Custom Properties)

Defined in `globals.css`, used everywhere via `var(--ud-*)`:

```
--ud-brand-primary: #0C5C57 (teal)
--ud-brand-light: #E3F1EF
--ud-gradient-from / --ud-gradient-to
--ud-text-primary / --ud-text-secondary / --ud-text-muted / --ud-text-inverse
--ud-bg-card / --ud-bg-subtle / --ud-bg-page
--ud-border / --ud-border-focus / --ud-border-subtle
--ud-status-danger / --ud-status-warning / --ud-status-success
```

Dark mode overrides are defined in `@media (prefers-color-scheme: dark)`.

---

## Migration File Index (chronological)

```
20260330_create_deets.sql                        # deets table + triggers
20260330_enable_deets_rls.sql                    # RLS for deets
20260330_create_deet_media_bucket.sql            # deet-media storage
20260330_create_hub_members.sql                  # hub_members table
20260330_backfill_hub_members.sql                # backfill creators
20260330_fix_hub_members_rls.sql                 # RLS fix v1
20260330_fix_hub_members_rls_v2.sql              # RLS fix v2
20260330_create_profiles.sql                     # profiles table
20260330_add_profile_preferences.sql             # JSON prefs columns
20260401_create_hub_ctas.sql                     # hub_ctas table
20260401_add_hub_visibility.sql                  # visibility column
20260401_create_hub_sections.sql                 # sections + items
20260402_add_hub_accent_color.sql                # accent_color column
20260402_create_deet_interactions.sql             # deet_likes + deet_comments + count columns
20260402_hub_members_admin_update_rls.sql        # admin can update members
20260403_create_events.sql                       # events + event_rsvps
20260403_add_hubs_delete_rls.sql                 # creator can delete hub
20260404_add_profiles_app_role.sql               # app_role column
20260404_admin_manage_roles_rls.sql              # super admin policies
20260404_create_avatars_bucket.sql               # avatars storage
20260405_fix_profiles_rls_recursion.sql          # is_super_admin() function
20260405_expand_deets_kind_check.sql             # extended kind enum
20260405_create_poll_votes.sql                   # poll_votes table
20260413_add_deets_update_policy.sql             # count update + comment edit RLS
20260413_create_deet_views.sql                   # deet_views table
20260413_add_reaction_type_and_comment_replies.sql  # reaction_type + parent_id
20260413_add_comment_attachments.sql             # comment image/file columns
20260413_add_comment_reactions.sql               # comment_reactions table
20260413_add_deet_shares.sql                     # deet_shares + share_count
```

---

## Key Patterns & Conventions

1. **Backward-compatible queries** — Service functions try queries with new columns, catch errors mentioning missing columns, and retry without them. This allows deploying code before migrations.

2. **Dynamic imports** — Non-critical service calls (shares, views) use `import("@/lib/services/deets/deet-interactions")` to avoid blocking initial render.

3. **Optimistic UI + server reconciliation** — State overrides (e.g., `likeCountOverrides`, `shareCountOverrides`) provide instant feedback, then reconcile with server response.

4. **Lifted state** — Comment reactions are lifted from `CommentRow` to `DeetCommentsSection` so the image viewer sidebar can display the user's reaction state.

5. **Hub templates** — Each hub category has a pre-configured template in `lib/hub-templates/` defining default sections, tabs, and content structure.

6. **File path alias** — `@/*` maps to `apps/web/*` (configured in tsconfig).

7. **Component colocation** — Hub page components live under `app/hubs/[category]/[slug]/components/` alongside their hooks in `hooks/`.

8. **Supabase RLS** — Row-level security is used extensively. A `is_super_admin()` SECURITY DEFINER function avoids recursive policy checks.

---

## Mapping: DeetRecord → HubFeedItem

The file `components/deets/map-deet-to-hub-feed-item.ts` converts database records to UI items:

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
Posts → update, Notices → announcement, Photos → media,
News → update, Deals → update, Hazards → alert, Alerts → alert, Jobs → update
```

---

## Environment Setup

```bash
# Install dependencies
npm install

# Dev server
cd apps/web && npm run dev

# Build
npm run build

# Required env vars (in apps/web/.env.local):
NEXT_PUBLIC_SUPABASE_URL=https://psckhdbtissnmdgcfwgo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key>
```

**Supabase project:** `psckhdbtissnmdgcfwgo`

**Remote image hosts** (next.config.ts): `lh3.googleusercontent.com`, `psckhdbtissnmdgcfwgo.supabase.co`
