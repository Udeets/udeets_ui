# uDeets — Project Context

> Last updated: April 4, 2026
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
- `DeetChildModal` wrapper for all composer sub-panels

### Composer System
- **CreateDeetModal** — Full popup composer with rich text editor (contentEditable), formatting toolbar, 8 action buttons, attached items display
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
| `hubs/.../components/deets/DeetChildModal.tsx` | Child modal wrapper |
| `hubs/.../components/deets/deetTypes.ts` | Type definitions |
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

## 9. Known Issues / Pending Items

1. **Avatars bucket migration** — File `supabase/migrations/20260404100003_create_avatars_bucket.sql`; apply with `supabase db push` or paste the SQL into the Supabase dashboard SQL editor.

2. **Profile names for existing users** — The `useProfileSync` hook backfills profiles on login, but users who signed up before the fix will only get their profile updated the next time they log in. There is no batch migration script to backfill all existing users at once.

3. **Home page mobile nav** — The nav links (About, Use Cases, Resources) are hidden on mobile (`hidden md:flex`) with no hamburger menu. Users can still access everything via footer links and the Discover search, but a mobile menu would be a nice addition.

4. **File attachment** — The "Attach File" button in the composer currently opens the photo picker as a placeholder. A proper file picker needs to be implemented.

5. **Nominatim rate limiting** — The check-in feature uses the free Nominatim API for reverse geocoding. For production, consider self-hosting or using a paid service to avoid rate limits.

6. **Real-time updates** — Deets feed currently requires manual refresh. Supabase Realtime subscriptions could be added for live updates.

---

## 10. Environment & Config

- **Supabase**: Client created via `@/lib/supabase/client` (browser) and `@/lib/supabase/server` (server components/API routes)
- **Auth callback**: `/auth/callback/route.ts`
- **Tailwind**: v4 with `@tailwindcss/postcss`
- **TypeScript**: Strict mode, last compiled clean with zero errors
- **Geolocation**: Browser Geolocation API + Nominatim OpenStreetMap (free, no API key)
