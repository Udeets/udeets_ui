# uDeets — Project Context

> Last updated: April 19, 2026
> Owner: udeets (udeetsdev1@gmail.com)

---

## 1. What is uDeets?

uDeets is a Next.js community platform (inspired by the Band app). Users create "hubs" for communities, businesses, or organizations. Hubs contain "deets" (posts/updates), events, photos, files, members, and more. Think of it as a modern replacement for WhatsApp groups, Facebook groups, and community bulletin boards.

---

## 2. Tech Stack

- **Framework**: Next.js 16 (App Router) with `"use client"` components
- **React**: 19.2.3
- **Styling**: Tailwind CSS v4 with CSS custom properties (`--ud-brand-primary`, `--ud-bg-card`, etc.)
- **Backend/DB**: Supabase (Auth with Google/Apple OAuth, PostgreSQL, RLS policies, Storage buckets)
- **Icons**: lucide-react (v0.577) — Band app style: `stroke-[1.5]`, `h-5 w-5`
- **Monorepo**: Workspace with `apps/web` and `packages/*`
- **TypeScript**: v5

---

## 3. Route Structure

| Route | Page | Notes |
|---|---|---|
| `/` | Landing/home page | Public marketing page |
| `/about` | About page | Company info, timeline, orbit graphic |
| `/auth` | Sign in / Sign up | Google & Apple OAuth + email/password |
| `/auth/callback` | OAuth callback handler | Upserts profile from auth metadata |
| `/dashboard` | User dashboard | Authenticated, shows feed |
| `/discover` | Hub discovery | Category strip, location search |
| `/discover/location` | Location-based discovery | Map/geo search |
| `/create-hub` | Hub creation wizard | Template selection, multi-step |
| `/hubs/[category]/[slug]` | Hub detail page | Main hub view with tabs |
| `/hubs/[category]/[slug]/full` | Full hub view | Extended view |
| `/profile` | User profile | My Info, My Hubs, My Posts tabs |
| `/settings` | User settings | Notifications, privacy prefs |
| `/admin` | Admin panel | Super admin user management |
| `/alerts` | Alerts/notifications page | |
| `/events` | Events listing | |
| `/my-posts` | User's posts | |
| `/terms` | Terms & Conditions | 11-section legal page |
| `/privacy` | Privacy Policy | 12-section legal page |
| `/use-cases` | Use cases showcase | Templates for different industries |
| `/resources` | FAQ, blog, tutorials | Help centre |

---

## 4. Database Schema (Supabase)

### Tables

- **profiles** (`id` UUID PK → auth.users, `full_name`, `avatar_url`, `email`, `app_role`, `notification_preferences` JSONB, `privacy_settings` JSONB, `created_at`, `updated_at`)
- **hubs** (`id`, `name`, `slug`, `category`, `description`, `created_by`, `dp_image_url`, `cover_image_url`, `city`, `state`, `visibility`, `accent_color`, `like_count`, `comment_count`, `view_count`, ...)
- **hub_members** (`hub_id`, `user_id`, `role`, `status`)
- **hub_sections** (custom sections per hub)
- **hub_ctas** (call-to-action buttons per hub)
- **deets** (`id`, `hub_id`, `created_by`, `title`, `body`, `post_type`, `like_count`, `comment_count`, `view_count`, ...)
- **deet_likes** (`id`, `deet_id`, `user_id`)
- **deet_comments** (`id`, `deet_id`, `user_id`, `body`, `created_at`)
- **events** (hub events with RSVPs)

### Storage Buckets

- **deet-media** — Photos/files attached to deets
- **avatars** — Profile pictures (migration: `20260404100003_create_avatars_bucket.sql`)
  - **IMPORTANT**: This bucket migration may need to be applied to the live Supabase instance. Run `supabase db push` or apply manually via Supabase dashboard SQL editor.

### Key RLS Notes

- Supabase relational queries fail when FK is to `auth.users` not `profiles` — requires two-step fetch pattern
- Profile reads are open to all authenticated users; updates are self-only
- Hub members have role-based RLS (creator, admin, moderator, member)

---

## 5. Authentication Flow

1. **Google/Apple OAuth** → `/auth/callback/route.ts` exchanges code → `upsertProfile()` saves `full_name`, `avatar_url`, `email` to profiles table
2. **Email/password** → `supabase.auth.signUp()` / `signInWithPassword()`
3. **Profile sync** → `useProfileSync` hook in `AuthGuard` auto-backfills profile data from auth metadata on every session (fixes users who signed up before the upsert was added)
4. Google OAuth stores name under `full_name` OR `name` in `user_metadata` — callback checks both

---

## 6. Key Architecture Patterns

### Hub Client (apps/web/app/hubs/[category]/[slug]/HubClient.tsx)
- Main hub page component (~1400+ lines)
- Uses 9 custom hooks for different concerns (composer, interactions, filters, media, settings, etc.)
- Modals rendered via `createPortal` to `document.body`
- `ComposerChildFlow` pattern: parent modal opens child panels (photo, emoji, announcement, notice, poll, event, checkin, settings)
- Composer sub-panels are composed inline (legacy `DeetChildModal` wrapper removed in favor of `ComposerChildPanels` / dedicated flows)

### Composer System
- **CreateDeetModal** — Two-step flow: pick a **content kind** (post, announcement, poll, event, …), then compose. Rich text (`contentEditable`), formatting toolbar, photo strip, and **DeetSettingsFields** (comments, pin, schedule, audience). For the **general update** kind (`post`) only, optional **Local feed tag chips** (#News, #Hazard, #Deals, #Jobs) set `deetSettings.localFeedTag`; submit maps that to `deets.kind` (`News` / `Hazards` / `Deals` / `Jobs`) via `composer/composerMapper.ts` and also stores `localFeedTag` inside the `deet_options` attachment meta. Clearing a chip sets `localFeedTag` back to `null` (ordinary hub post / `Posts` or `Photos` as before).
- **DeetComposerCard** — Mini inline composer in the feed, matching popup style with all 8 action buttons
- **ComposerChildPanels.tsx** — 5 child panel components:
  - `AnnouncementChildContent` — title + details
  - `NoticeChildContent` — title + description
  - `PollChildContent` — question + 2-6 dynamic options
  - `EventChildContent` — name, date, time, location
  - `CheckinChildContent` — browser geolocation + Nominatim reverse geocoding

### Deet Interactions (apps/web/lib/services/deets/deet-interactions.ts)
- `toggleDeetLike` — optimistic UI with `likeCountOverrides` state
- `listDeetComments` — fetches profiles + auth metadata fallback for names
- `addDeetComment` — self-heals profile name from auth metadata
- `incrementDeetView` / `getDeetCounts` — denormalized counts

### Styling Convention
- CSS custom properties: `--ud-border-subtle`, `--ud-bg-card`, `--ud-bg-subtle`, `--ud-brand-primary`, `--ud-brand-light`, `--ud-gradient-from`, `--ud-gradient-to`, `--ud-text-primary`, `--ud-text-secondary`, `--ud-text-muted`
- Icon sizes: `h-5 w-5 stroke-[1.5]` for action icons, `h-[18px] w-[18px] stroke-[1.5]` for inline icons
- Touch targets: `h-10 w-10` rounded-full buttons
- Cards: `rounded-xl border-[var(--ud-border-subtle)] bg-[var(--ud-bg-card)] shadow-sm`

---

## 7. Key Files Reference

### Core Components
| File | Purpose |
|---|---|
| `components/AuthGuard.tsx` | Auth wrapper + profile sync |
| `components/udeets-navigation.tsx` | Header, bottom nav, notifications/events/profile panels |
| `components/mock-app-shell.tsx` | App shell layout wrapper |
| `components/brand-logo.tsx` | Logo components |
| `services/auth/useAuthSession.ts` | Auth state hook |
| `services/auth/useProfileSync.ts` | Auto-backfill profile from auth metadata |
| `hooks/useUserRole.ts` | Platform role hook |

### Hub System
| File | Purpose |
|---|---|
| `hubs/[category]/[slug]/HubClient.tsx` | Main hub page (imports all sub-components) |
| `hubs/.../components/deets/CreateDeetModal.tsx` | Popup composer |
| `hubs/.../components/deets/DeetComposerCard.tsx` | Inline feed composer |
| `hubs/.../components/deets/ComposerChildPanels.tsx` | 5 child modal panels |
| `hubs/.../components/deets/deetTypes.ts` | Type definitions (`DeetSettingsState`, including `localFeedTag`) |
| `hubs/.../components/deets/composer/composerMapper.ts` | Maps composer state → create/update payload (`resolvedKind`, attachments) |
| `hubs/.../components/sections/DeetsSection.tsx` | Feed section with comments |
| `hubs/.../hooks/useDeetComposer.ts` | Composer state management |
| `hubs/.../hooks/useDeetInteractions.ts` | Like/comment/view state |

### Services
| File | Purpose |
|---|---|
| `lib/services/deets/deet-interactions.ts` | Like, comment, view APIs |
| `lib/services/deets/create-deet.ts` | Create new deets |
| `lib/services/hubs/create-hub.ts` | Hub creation |
| `lib/services/profile/upsert-profile.ts` | Server-side profile upsert |
| `lib/services/members/manage-members.ts` | Member management |

---

## 8. Completed Work (This Session)

### A. Post Composer Cleanup
- Removed profile name/avatar from top of CreateDeetModal
- Updated all icons to Band app style (`stroke-[1.5]`, `h-5 w-5`)
- Unified card styling to match ProfilePanel (`rounded-xl`, `border-[var(--ud-border-subtle)]`, `shadow-lg`)

### B. Profile Editing
- Created `avatars` storage bucket migration with RLS policies
- Fixed Supabase error handling in profile save/upload
- Synced profile changes to auth user metadata via `supabase.auth.updateUser()`
- Added visible error messages for avatar upload failures

### C. Dead Button Audit
- Fixed 6 unwired buttons across Files, Reviews, settings, and hub creation

### D. Discover Page
- Sticky Create Hub at visible end of category strip (not scrollable end)
- Removed Create Hub from header

### E. Like Count Fix
- Added `likeCountOverrides` state to track real-time like counts
- `DeetsSection` now uses `likeCountOverrides?.[item.id] ?? item.likes`

### F. Comment Name Fix
- Added email fallback in comment services
- Fixed Google OAuth `name` vs `full_name` field mismatch
- Created `useProfileSync` hook to auto-backfill NULL profiles
- Comments now cascade through: `profiles.full_name` → auth metadata name → email prefix → "User"

### G. Composer Action Buttons
- Added 5 new `ComposerChildFlow` types: event, checkin, announcement, notice, poll
- Created `ComposerChildPanels.tsx` with all 5 child components
- Wired all buttons in CreateDeetModal via `onOpenChild()`
- Added child modal sections in HubClient.tsx with proper imports
- Redesigned DeetComposerCard to show all 8 action buttons matching popup style

### H. Terms & Privacy Pages
- Created full Terms (11 sections) and Privacy (12 sections) pages
- Wired links in auth page (changed `<a>` to `<Link>`)
- Added Terms/Privacy links to all page footers (home, auth, about, use-cases, resources)

### I. Home Page
- Changed tagline from "Organized beautifully" to "Effortlessly connected"

### J. Mobile Responsiveness Audit & Fixes
- Navigation dropdown panels: responsive widths (`w-[calc(100vw-2rem)] max-w-[360px]`)
- Emoji picker grids: `grid-cols-5 sm:grid-cols-6` (was `grid-cols-6`)
- Album/photo grids: `grid-cols-2 sm:grid-cols-3` (was `grid-cols-3`)
- Composer action buttons: added `flex-wrap` for narrow screens
- About page orbit graphic: added smaller mobile size (`h-56 w-56`)
- Footer nav links: `flex-wrap` + `gap-4 sm:gap-8`
- Search input: responsive width `w-24 min-w-0 sm:w-44`

---

## 8b. Completed Work (April 18–19, 2026 Session)

This session addressed 24 of 30 bugs/items from user testing. TypeScript clean after every batch.

### K. Profile Requests & Invitations Tabs
- `/profile` Requests tab — real data fetch from `hub_members status='pending'`, cancel with optimistic UI (`profile/page.tsx`)
- `/profile` Invitations tab — real data fetch from `hub_invitations`, Accept (upserts `hub_members` + bumps joined count) / Decline flows
- New migration `20260418_create_hub_invitations.sql` — table + RLS (invitee read/respond; hub admins read/create/revoke) + unique-pending index
- Invitee cascade for inviter names (profiles → auth metadata → email prefix)

### L. Home Page Mobile Hamburger
- Added `Menu` icon button (mobile-only) to `apps/web/app/page.tsx` header
- Dropdown reveals About / Use Cases / Resources / Discover / Terms / Privacy
- Outside-click + Escape close; `aria-expanded` for a11y

### M. Composer File Attachment Flow (End-to-End)
- New `ComposerChildFlow = "file"` type + DB-safe `AttachedDeetItem` with `type="file"`
- `DeetComposerCard` + `CreateDeetModal` "Attach File" now opens a file picker (not the photo one)
- New file modal in `HubClient.tsx` — file chips with name + size, remove-per-file
- `upload-deet-media.ts` — explicit MIME allowlist (PDF/Word/Excel/PowerPoint/text/CSV/zip/images), 15 MB for files, 5 MB for images, returns richer `{path, publicUrl, mimeType, fileName, sizeBytes, kind}`
- New migration `20260418_expand_deet_media_mime_types.sql` — expands the `deet-media` bucket to allow the new MIME types
- `useDeetComposer.ts` wires `selectedDocFiles` + doc attachments into the submit flow

### N. Dashboard Unread Dot Wired to Real DB
- New migration `20260418_add_hub_members_last_seen.sql`:
  - `last_seen_at` column on `hub_members`, backfilled to `now()` for existing active members
  - `user_hubs_with_unread()` RPC — returns hubs where any deet exists newer than the user's `last_seen_at`
  - `mark_hub_seen(p_hub_id)` RPC — called when the user opens a hub page
- Dashboard calls the RPC and passes `unreadHubIds` into `DashboardHubCard.hasUnread`

### O. Supabase Realtime on Deets Feed
- `subscribeToDeets` now watches `deets`, `deet_likes`, and `deet_comments` (previously only `deets`)
- Debounced 150 ms so bursts coalesce into a single refetch
- Both `HubClient` and `dashboard/page.tsx` pick up live likes + comments without manual refresh

### P. Nominatim Rate-Limit Protection
- New API routes `app/api/geo/reverse/route.ts` and `app/api/geo/search/route.ts`
- Adds required `User-Agent: uDeets/1.0 (contact: udeetsdev1@gmail.com)` header per Nominatim ToS
- Per-IP 1 req/sec in-memory token bucket
- Client-side errors surfaced to the user; fallback to raw coords on failure

### Q. Profile Name Backfill
- New migration `20260418_backfill_profile_names.sql`
- One-shot SQL that fills NULL `full_name` / `avatar_url` / `email` on `profiles` from `auth.users.raw_user_meta_data`
- Uses `coalesce(p.full_name, u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(u.email, '@', 1))` — never overwrites a value the user has already set
- Raises a notice with the remaining-null count for sanity-check after run

### R. Verification of "Already Done" April 3 Items
Verified via code audit that the following items from the April 3 session were already complete (no work needed):
- Hub sidebar Settings highlight bug — fixed in `HubSidebarNav.tsx`
- Profile dropdown Band-style redesign — `udeets-navigation.tsx`
- Settings page polish — `settings/page.tsx`
- Preferences migration — `20260330_add_profile_preferences.sql` present
- Author name cascade in deet feed — `HubClient.tsx` lines 191–196
- "Photo" title handling via `GENERIC_TITLE_LABELS` — dashboard/profile/alerts
- Design system — `lib/theme.ts` (169 lines, centralized tokens)
- April 1 migrations `hub_template_fields` + `attachment_source` — superseded by actual April 1 migrations (ctas, visibility, sections)

### S. Data-Loss Saving Bugs
- **Hub About description not saving** — fixed UI refresh (description is now local state in `HubClient.tsx` set on save success)
- **Comments not saving** — `addDeetComment` retries once after `refreshSession()` on RLS failure; if the session really did expire, surfaces a specific "Your session expired…" message instead of the generic toast
- **Disable-comments setting not persisting** — new migration `20260418_add_deets_allow_comments.sql`; `allow_comments` flows through `CreateDeetInput`/`UpdateDeetInput` → `createDeet`/`updateDeet` with graceful fallback when the column isn't migrated yet; `DeetsSection` renders a muted "Comments off" chip instead of the Comment button when `allow_comments = false`
- **Announcement update + generic Edit flow** — replaced the `TODO` placeholder edit-button with a real `startEditingDeet(item)` on `useDeetComposer`; pre-fills text/attachments/post-type/commentsEnabled, preserves existing image URLs if no new photo picked, calls `updateDeet` instead of `createDeet`, fires `onDeetUpdated` → new `replaceDeet` helper in `useHubLiveFeed` (in-place update, not a prepend)
- **Content + poll + image combined rendering** — `DeetsSection` was swallowing `item.body` whenever a rich attachment was present; now only suppresses body when it's literally the rich attachment's title/detail echo, so user-typed text alongside a poll/event/etc. renders

### T. Poll Correctness (#22 + #26)
- `castPollVote` now aborts if the pre-insert DELETE fails (previously a failed cleanup + successful insert left duplicate rows, which is what produced the "both options stay selected" bug)
- `PollContent` tracks `selectedIndices: Set<number>` instead of a single index; reads all existing user votes on mount so pre-existing duplicates are reflected honestly
- New `togglePollVote` service for multi-select
- `HubFeedItemAttachment.pollSettings` propagates through the mapper; `PollContent` honors `allowMultiSelect` + `multiSelectLimit` (checkbox indicators, limit counter, limit-aware disabling)

### U. Feed Gallery (multi-image in a single deet)
- Replaced the single `item.image` hero with a layout that adapts by count:
  - 1 image → `object-contain` hero at natural aspect (no forced-crop blur on small images)
  - 2 images → 50/50 split
  - 3+ images → large left tile + two stacked right tiles, `+N` overlay on the third
- All tiles open the viewer at the clicked index

### V. Viewer Sidebar HTML Rendering (#17 part 2)
- Post body in the image-viewer sidebar was rendered inside a `<p>` so HTML tags from the rich editor showed as literal text ("source code on right")
- Fixed via sanitized `dangerouslySetInnerHTML` (script + on* handler strip) so rich text renders correctly

### W. Composer Overflow (#15)
- `CreateDeetModal` now has `maxHeight: calc(100vh - 2rem)` on the shell + `flex flex-col` layout
- Form body is `flex-1 overflow-y-auto` so long posts + attachment previews scroll inside the modal while Header/Post button stay pinned

### X. Hub Photos / Album Picker (#27)
- Album picker no longer hides the current DP and cover from "Choose from Albums" (it previously filtered them out, which is why users with 3 photos saw only 1 option when both DP and cover were set)
- `allPhotos` now explicitly includes DP + cover + attachments + gallery (de-duplicated); tiles already in use get a small "Current DP" / "Current cover" / "Current DP & cover" badge
- New migration `20260418_create_hub_attachments.sql` creates the missing `public.attachments` table that `useHubMediaFlow.ts` and the Photos loader already assumed existed. Backfills every hub's current DP, cover, and gallery URLs on migrate
- Every hub image upload (dp/cover/gallery) now writes a row to `attachments`

### Y. About Page Rewrite (#1–#7, minus #5)
- **#1** Header gained About / Use Cases / Resources nav links matching the home page; "About" is filled-pill highlighted with `aria-current="page"`
- **#2** Hero tagline: "Every community & member in the community deserves a clean, organized space to share what matters. That's why we built uDeets."
- **#3** "The problem we solve" padding: `py-20 sm:py-28` → `py-12 sm:py-16`; grid expanded to 4 cards, new 💰 Generate Sponsorship Revenue card
- **#4** "What we stand for" padding reduced the same way (`mt-14` → `mt-10`)
- **#6** Value card "Built for real people" → "Built for local connection" with updated description ("Feel connected at home in a global world…")
- **#7** Footer text was invisible because it used `text-white` on a white `bg-[var(--ud-bg-card)]` — swapped to `--ud-text-secondary` / `--ud-text-primary` / `--ud-text-muted` tokens so every link and the copyright line renders

### Z. Hub Hero Admin UX (#8 + #9)
- **#8** Pencil badge pinned bottom-right on DP (both mobile + desktop), camera button top-right on cover. Both click through to the same media chooser the whole tile had — just gives the visual affordance that was missing
- **#9** Cover vertical-positioning: admins see a `Move` button next to the camera; click opens an inline range slider overlaid on the cover; dragging updates `object-position: 50% <y>%` live, Save persists via `updateHub(id, { coverImageOffsetY })`, Cancel reverts
- New migration `20260418_add_hub_cover_position.sql` — `cover_image_offset_y numeric(5,2) default 50.00` with 0–100 check; added to `HUB_COLUMNS_BASE` and `toHubRecord`
- `ImageWithFallback` now accepts an optional `style` prop (was swallowing style overrides before)

### AA. Hub About Tab (#10 + #12)
- **#10** Connect save — toast text changed "Connect links updated." → "Connect updated", auto-dismisses after 3 s (was previously sticky)
- **#12** Description character limit UX — counter turns amber at 270+, red at 300; appends "· N left" when approaching and "· character limit reached" when the cap is hit; `maxLength={300}` on the textarea

### BB. Hub Invite (Search + QR) (#29 + #30)
- New server-side typeahead `lib/services/profile/search-profiles.ts` — 2+ chars, `ILIKE` on name + email, up to 10 matches, escape-safe
- New `lib/services/hubs/invite-user-to-hub.ts` — checks existing membership + pending invites, inserts into `hub_invitations` (the April 18 table); falls back to legacy `hub_members status='invited'` if the invitations table isn't deployed
- Rebuilt `InviteModal` with two tabs:
  - **Search** — debounced 250 ms typeahead, cancels stale requests via `AbortController`, pills for Invite/Member/Invited, loads existing member + invite sets once on mount
  - **QR Code** — `QRCodeSVG` from `qrcode.react` (new dep, 4.2.0), encodes `<origin>/hubs/<category>/<slug>/join`, shows the raw link with a Copy button below
- New public route `/hubs/[category]/[slug]/join/page.tsx` — hub-join landing page for QR scans:
  - Not signed in → prompts with `?redirect_to=` so the user returns to the join flow after auth
  - Signed in → inserts a pending `hub_members` row (admin still approves in Members)
  - Already a member → auto-redirects to the hub
  - Hub slug not found → friendly message + Discover link

### CC. Auto-Logout on Inactivity (#21)
- New `services/auth/useIdleTimeout.ts` hook
- 30 min total idle → 60 sec warning → auto sign-out (configurable via args)
- Activity events: mousemove / mousedown / keydown / touchstart / scroll / wheel (throttled 1/sec so mousemove doesn't spam rescheduling)
- Cross-tab sync via `localStorage:udeets:last-activity` — activity in any tab resets every tab
- Tab visibility reconciliation — if the user was over the threshold while the tab was hidden, warning fires immediately on return
- Wired into `AuthGuard` (so every authenticated page inherits the behavior; public pages unaffected)
- Modal: "Still there?" title, live-countdown body, **Stay signed in** primary button (autoFocused) and **Sign out** secondary
- After auto-signout: redirects to `/auth?redirect=<path>&reason=idle` so the user lands back where they were after re-auth (and you can show a "signed out for security" banner on the auth page by reading `?reason=idle`)

### DD. Local feed + `origin/main` port notes (`integration/main-port`)
- **`listDeets`** accepts optional `kinds?: string[]` (and `hubIds`, `limit`) so `/local` can query only the deet kinds it needs instead of every row on the platform.
- **`LocalPageClient`** + nav polish and **`/hubs/.../join`** refinements were brought over via staged cherry-picks from `origin/main` (see repo script `scripts/cherry-pick-origin-main-staged.ps1`).
- **Composer vs `origin/main`:** On main, Local tags toggled a legacy `postType` field. On this branch they use **`localFeedTag`** on `DeetSettingsState` so they do not collide with the unified composer’s **`jobs`** *template* (job posting). Tag chips only appear when the chosen kind is **general update** (`post`).

---

## 9. Known Issues / Pending Items (as of April 19, 2026)

### Operational — apply to live Supabase

All migrations below are committed to `supabase/migrations/`. Apply via `supabase db push` or the SQL Editor in the Supabase dashboard, in chronological order:

1. `20260404100003_create_avatars_bucket.sql` — avatars storage bucket; need to confirm applied in dashboard
2. `20260418_add_deets_allow_comments.sql` — adds `deets.allow_comments bool default true`
3. `20260418_add_hub_cover_position.sql` — adds `hubs.cover_image_offset_y numeric`
4. `20260418_add_hub_members_last_seen.sql` — adds `hub_members.last_seen_at` + `user_hubs_with_unread()` + `mark_hub_seen()` RPCs
5. `20260418_backfill_profile_names.sql` — one-shot profile backfill from `auth.users.user_metadata`
6. `20260418_create_hub_attachments.sql` — creates `public.attachments` table + backfills DP/cover/gallery URLs
7. `20260418_create_hub_invitations.sql` — creates `public.hub_invitations` table + RLS
8. `20260418_expand_deet_media_mime_types.sql` — expands `deet-media` bucket MIME allowlist to include PDF/Office/text/CSV/zip, raises cap to 15 MB
9. `20260419_create_profile_interactions.sql` — profile likes / follow-style interactions table + RLS (profile modal stack)
10. `20260419_allow_self_profile_like.sql` — policy tweak for self-actions if required by the above

### Remaining open items

Six items from the April 18 user testing list remain open and out of scope per user direction:

- **#5** Ad positioning / privacy-by-default copy on `/about` — needs a product decision from the owner before writing copy
- **#13** Members section rebuild — the invite flow is done, but the member-list view itself needs a dedicated design
- **#14** Custom section area — needs product discussion (scope and authoring model)
- **#18** Like / Share re-test after deploy — Comment is fixed this session; Like and Share were reported as "implemented?" and need a verification pass after deploy
- **#24** Move post-type picker (Announcement, Poll, etc.) above the editor — composer reflow; not yet started
- **#28** File attachment re-test — code shipped this session (see section M + the MIME bucket migration). Will work end-to-end once the branch deploys to Vercel and `20260418_expand_deet_media_mime_types.sql` is applied

### Caveats worth knowing

- Search for users in the new Invite modal (#29/#30) is scoped to **all signed-up users** per the product call. If you want to restrict to opt-in discoverability later, add a `profiles.searchable boolean default true` column and narrow the `searchProfiles` query — hook in `lib/services/profile/search-profiles.ts`
- `useIdleTimeout`'s 30 min / 60 sec durations are defaults; they can be overridden by passing `idleTimeoutMs` / `warningDurationMs` to the hook from anywhere it's used
- `searchProfiles` is a simple ILIKE scan; if the `profiles` table grows past ~100k rows, add a `pg_trgm` GIN index on `full_name` for performance

---

## 10. Environment & Config

- **Supabase**: Client created via `@/lib/supabase/client` (browser) and `@/lib/supabase/server` (server components/API routes)
- **Auth callback**: `/auth/callback/route.ts`
- **Tailwind**: v4 with `@tailwindcss/postcss`
- **TypeScript**: Strict mode, last compiled clean with zero errors
- **Geolocation**: Browser Geolocation API + Nominatim OpenStreetMap (free, no API key)
