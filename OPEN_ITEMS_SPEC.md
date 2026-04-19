# uDeets — Open Items Implementation Spec

> Generated: April 18, 2026
> Scope: 9 open items identified after verification of pending work from April 3 and April 4 sessions
> Format: analysis + implementation guidance. Each item lists target files, required changes, and gotchas. No code has been modified in this session — this is a spec document to be applied in a follow-up session.

---

## Priority Matrix

| # | Item | Effort | Impact | Risk |
|---|---|---|---|---|
| 1 | Requests tab in `/profile` | S | High | Low |
| 2 | Invitations tab in `/profile` | M (needs migration) | High | Med |
| 3 | Mobile hamburger on home page | S | Med | Low |
| 4 | Real file picker in composer | S | Med | Low |
| 5 | Unread dot wired to real DB | M | Med | Low |
| 6 | Supabase Realtime for deets feed | M | High | Med |
| 7 | Nominatim rate-limit protection | XS | Low | Low |
| 8 | Apply avatars bucket migration | XS (ops) | High | Low |
| 9 | Profile name backfill for existing users | S (ops) | Med | Low |

Recommended order: 8 → 1 → 3 → 4 → 7 → 2 → 5 → 6 → 9. Item 8 first because it unblocks avatar uploads already in the UI.

---

## 1. Requests Tab in `/profile`

**Target file:** `apps/web/app/profile/page.tsx` (replace placeholder at lines 557–566)

**What exists today:**
- Sidebar item `"Requests"` exists (line 18, 20–27).
- Tab branch renders a "Coming soon" card (lines 557–566).
- No state, no data fetch.

**Required changes:**
1. Add state alongside other hooks in `ProfilePage`:
   ```
   type PendingRequest = {
     membershipId: string;
     hubId: string;
     hubName: string;
     hubCategory: string;
     hubSlug: string;
     dpImage: string;
     requestedAt: string;
   };
   const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
   const [isLoadingRequests, setIsLoadingRequests] = useState(false);
   const [cancellingId, setCancellingId] = useState<string | null>(null);
   ```
2. Add a `useEffect` that mirrors the "My Hubs" effect (lines 122–167) but filters `hub_members` with `status = 'pending'`, then does the two-step fetch against `hubs` (required pattern — see PROJECT_CONTEXT §4 "Supabase relational queries fail when FK is to auth.users").
3. Render list with hub avatar + name + `formatTimeAgo(requestedAt)` + "Cancel request" button. On cancel, delete the `hub_members` row (or set `status='cancelled'`). Use optimistic UI: remove the row immediately, restore on error.
4. Empty state mirroring "My Hubs" (lines 470–476) with a "Discover hubs →" link.

**Data query:**
```
supabase.from('hub_members')
  .select('id, hub_id, created_at')
  .eq('user_id', user.id)
  .eq('status', 'pending')
  .order('created_at', { ascending: false });
```

**Gotchas:**
- `hub_members` may not have a `created_at` column on older migrations — verify via migration history. If missing, add a migration to add `created_at timestamptz default now()`.
- If you cancel by delete, be aware of any RLS policy preventing delete-on-self. Setting `status='cancelled'` is safer.

---

## 2. Invitations Tab in `/profile`

**Target files:**
- New migration: `supabase/migrations/20260418_create_hub_invitations.sql`
- `apps/web/app/profile/page.tsx` (replace placeholder at lines 568–577)
- Optional: `apps/web/lib/services/hubs/invitations.ts` (new service helper)

**What exists today:**
- Sidebar item `"Invitations"` exists.
- Tab renders a "Coming soon" card.
- **No invitations table exists in migrations.** (Verified April 18 — migrations directory has no invitations table.)

**Required migration (20260418_create_hub_invitations.sql):**
```sql
create table if not exists public.hub_invitations (
  id uuid primary key default gen_random_uuid(),
  hub_id uuid not null references public.hubs(id) on delete cascade,
  invited_user_id uuid not null references auth.users(id) on delete cascade,
  invited_by uuid references auth.users(id) on delete set null,
  status text not null default 'pending'
    check (status in ('pending','accepted','declined','revoked')),
  created_at timestamptz not null default now(),
  responded_at timestamptz
);

create unique index hub_invitations_unique_pending
  on public.hub_invitations(hub_id, invited_user_id)
  where status = 'pending';

alter table public.hub_invitations enable row level security;

-- Invitee can read their own invitations
create policy "Invitee reads own invitations"
  on public.hub_invitations for select
  using (invited_user_id = auth.uid());

-- Invitee can update status (accept/decline)
create policy "Invitee updates own invitations"
  on public.hub_invitations for update
  using (invited_user_id = auth.uid())
  with check (invited_user_id = auth.uid()
              and status in ('accepted','declined'));

-- Hub admins/creators can insert invitations
create policy "Hub admins create invitations"
  on public.hub_invitations for insert
  with check (
    exists (
      select 1 from public.hub_members
      where hub_id = hub_invitations.hub_id
        and user_id = auth.uid()
        and role in ('creator','admin')
        and status = 'active'
    )
  );
```

**Required UI changes (mirror Requests tab):**
- State: `pendingInvitations`, `isLoadingInvitations`, `respondingId`.
- Effect: query `hub_invitations` where `invited_user_id = user.id AND status = 'pending'`, then two-step fetch `hubs`.
- Render each row with: hub avatar, hub name, "Invited by {inviter_name} · {timeAgo}" (third query for inviter profile), and two buttons **Accept** + **Decline**.
- **Accept flow:** (a) update invitation row `status='accepted', responded_at=now()`; (b) upsert into `hub_members` with `status='active', role='member'`; (c) refresh `hubStats` (line 76) since joined count should bump; (d) optimistically remove row.
- **Decline flow:** update invitation `status='declined', responded_at=now()`; remove row optimistically.

**Gotchas:**
- Consider transaction-like semantics for Accept (invitation update + hub_members insert). Supabase doesn't offer cross-table transactions from the client, so accept either via an RPC function or by doing the `hub_members` insert first (idempotent upsert) and only marking the invitation accepted on success.
- A user who is already a member should not see an invitation — include that filter in the select or handle it gracefully at accept time.

---

## 3. Mobile Hamburger Menu on Home Page

**Target file:** `apps/web/app/page.tsx` (header at lines 514–594)

**What exists today:**
- Header: logo on left, `<nav>` with `hidden md:flex` containing About / Use Cases / Resources (line 522), then Discover search icon + Sign In on right.
- Download button hidden on mobile (`md:hidden`, line 569).
- No hamburger menu exists.

**Required changes:**
1. Add local state `[mobileOpen, setMobileOpen] = useState(false)`.
2. Insert a hamburger button visible only on mobile (`md:hidden`) in the header's right cluster, before the Sign In button. Use `Menu` icon from `lucide-react` (already in use across the app) with `h-5 w-5 stroke-[1.5]` per the Band-style convention (PROJECT_CONTEXT §6).
3. Below the header (or absolutely-positioned dropdown anchored to header bottom), render a mobile menu panel when `mobileOpen` is true. Panel contains:
   - Links: About, Use Cases, Resources (same 3 that exist in the desktop nav)
   - Divider
   - Terms, Privacy links (for consistency with the footer policy added April 4)
4. Close on link click and on outside click (pattern matches the notifications/events panels in `udeets-navigation.tsx` — reuse the same escape + outside-click hook if one exists).
5. Apply the same card styling used by existing nav panels: `rounded-xl border-[var(--ud-border-subtle)] bg-[var(--ud-bg-card)] shadow-lg`.
6. Ensure responsive width per the April 4 mobile audit: `w-[calc(100vw-2rem)] max-w-[360px]`.

**Gotchas:**
- Home page is a server-renderable page today; if you add local state you must mark the component `"use client"` (or lift the header into a client sub-component).
- Lock body scroll while the menu is open on very short viewports to avoid background scrolling under the panel.

---

## 4. Real File Picker in Composer "Attach File"

**Target files:**
- `apps/web/app/hubs/[category]/[slug]/components/deets/DeetComposerCard.tsx` (line 43)
- `apps/web/app/hubs/[category]/[slug]/components/deets/CreateDeetModal.tsx` (attach button)
- `apps/web/app/hubs/[category]/[slug]/HubClient.tsx` (photo input around line 1491)
- `apps/web/lib/services/deets/upload-deet-media.ts` (tighten MIME validation)

**What exists today:**
- In `DeetComposerCard.tsx` the "Attach File" button maps to `key: "photo"` — it opens the same image picker (line 43).
- Photo input has `accept="image/*"` (HubClient.tsx line 1491).
- Upload helper writes to bucket `deet-media` at path `${user.id}/${hubSlug}/deets/${timestamp}-${uuid}.${ext}` with a 5 MB limit (upload-deet-media.ts line 40, line 62).
- MIME filter today only allows image types.

**Required changes:**
1. **Split the button behavior.** Attach File should open a separate hidden `<input type="file">` with broader `accept` (e.g. `.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,image/*`). Keep the Photo button unchanged.
2. Add a new child flow kind (or extend the existing photo attachment flow) so attached files are visible in the composer's attached-items row with a proper file icon + filename + size, not an image preview.
3. **Expand `upload-deet-media.ts`:** add an allowlist of safe MIME types (images + documents). Reject executables/scripts. Keep the 5 MB limit or raise it based on your product call (docs can be larger than 5 MB).
4. **Persist attachment metadata.** The `deets` table currently tracks media URLs for images. If there's no existing column to differentiate file-type from image-type attachments, add one in a migration (e.g. `attachment_source text[]` or a separate `deet_attachments` table keyed by `deet_id` with `{url, mime_type, filename, size_bytes}`). Cross-reference with the older `20260401_add_attachment_source.sql` that was planned but never shipped.
5. Update the deet renderer (DeetsSection) to show a "file card" (icon + filename + download link) when an attachment is a document type.

**Gotchas:**
- Storage RLS on `deet-media` was written for image uploads. Double-check the policy accepts doc MIME types or broaden it.
- Do **not** render user-uploaded HTML or SVG inline without sanitization. Safer to display them as downloads only.
- File extension != MIME type. Validate server-side via bucket MIME restrictions and client-side via `file.type`.

---

## 5. Unread Dot on Hub Cards — Wire to Real DB

**Target files:**
- `apps/web/app/dashboard/components/DashboardHubCard.tsx` (line 135–146 — renders the dot based on `hasUnread` prop)
- `apps/web/app/dashboard/page.tsx` (the parent that passes the prop)
- Potentially new table: `deet_reads` or new column `hub_members.last_seen_at`

**What exists today:**
- `DashboardHubCard` accepts a `hasUnread` boolean prop (line 27). The dot is rendered conditionally with a red circle + SVG notch overlay (lines 135–146). **No DB query drives this today.** Whatever the parent passes is what's shown.

**Required changes (choose one of two approaches):**

**Approach A — Simple "last_seen" on hub_members:**
1. Migration: add `last_seen_at timestamptz` to `hub_members`.
2. When a user opens a hub page, update `last_seen_at = now()` for their membership.
3. Dashboard query: for each hub membership, compare `last_seen_at` to `max(deets.created_at) where hub_id = X`. If `max > last_seen_at` (or `last_seen_at is null` + any deet exists), `hasUnread = true`.
4. Perform this as a single RPC function on Supabase for efficiency, returning `{hub_id, has_unread}` rows.

**Approach B — Per-deet read tracking (more precise but heavier):**
1. New table `deet_reads(deet_id, user_id, read_at, primary key(deet_id, user_id))`.
2. Mark reads on deet view (existing `incrementDeetView` in `deet-interactions.ts` already tracks views — can write a read alongside).
3. `hasUnread` = count of deets in hub with no matching read row for this user > 0.
4. Better for future "unread count" badges, but costs a join per hub card.

**Recommendation:** Approach A is sufficient for a dot (binary). Approach B only if you plan to show unread counts or per-post unread highlighting.

**Gotchas:**
- Do the comparison at query time to avoid stale UI. If you denormalize, you have to invalidate on every new deet.
- The RPC pattern avoids N+1 queries when the dashboard shows many hubs.

---

## 6. Supabase Realtime for Deets Feed

**Target files:**
- `apps/web/app/hubs/[category]/[slug]/HubClient.tsx` (existing realtime at ~line 548 for `hub_members`)
- `apps/web/app/hubs/[category]/[slug]/components/sections/DeetsSection.tsx` (feed rendering)
- `apps/web/app/hubs/[category]/[slug]/hooks/useDeetInteractions.ts` (likes/comments/views state)

**What exists today:**
- Realtime IS wired for `hub_members` changes (HubClient.tsx line 548) and for notifications in `udeets-navigation.tsx`. The infrastructure and auth is already set up.
- `deets` and `deet_likes` / `deet_comments` tables do NOT have realtime subscriptions on the feed itself. Feed refreshes are manual / effect-driven only.

**Required changes:**
1. Add a realtime channel subscription inside HubClient.tsx (or a new `useDeetsRealtime` hook) scoped to the current `hub_id`:
   ```
   supabase
     .channel(`hub-deets-${hubId}`)
     .on('postgres_changes',
       { event: 'INSERT', schema: 'public', table: 'deets', filter: `hub_id=eq.${hubId}` },
       (payload) => prependDeet(payload.new))
     .on('postgres_changes',
       { event: 'UPDATE', schema: 'public', table: 'deets', filter: `hub_id=eq.${hubId}` },
       (payload) => updateDeet(payload.new))
     .on('postgres_changes',
       { event: 'DELETE', schema: 'public', table: 'deets', filter: `hub_id=eq.${hubId}` },
       (payload) => removeDeet(payload.old.id))
     .subscribe();
   ```
2. For comments: separate subscription filtered by `deet_id IN (current feed ids)`. Simpler alternative — subscribe to all comments on active deets and filter client-side by ID set.
3. For likes: subscribe to `deet_likes` and re-fetch `like_count` for the affected deet, OR accept stale counts and only refresh on view.
4. **Cleanup:** return an unsubscribe in the effect cleanup to avoid leaks on hub navigation.
5. Make sure the Supabase publication includes these tables (`alter publication supabase_realtime add table deets, deet_likes, deet_comments;`). Add a migration if missing.

**Gotchas:**
- Payloads from `postgres_changes` do NOT include joined profile data. You'll need to fetch author profile for each incoming deet (or show a lightweight placeholder until profile arrives).
- RLS applies to realtime deliveries. Make sure policies allow the current user to receive these rows.
- Existing `likeCountOverrides` state (PROJECT_CONTEXT §8.E) should reconcile with realtime — avoid double-count races.

---

## 7. Nominatim Rate-Limit Protection

**Target file:** `apps/web/app/hubs/[category]/[slug]/components/deets/ComposerChildPanels.tsx` (CheckinChildContent, lines 430–441)

**What exists today:**
- Two fetch calls: reverse geocode (line 433) and nearby search (line 439) against `nominatim.openstreetmap.org`.
- **No User-Agent header** (violates Nominatim usage policy which requires one identifying the app).
- **No debouncing** — but requests only fire on user-click of "Request Location" (line 419), which caps natural frequency.
- Minimal error handling — errors logged, not surfaced to UI.

**Required changes:**
1. **Proxy through a Next.js API route.** Create `apps/web/app/api/geo/reverse/route.ts` and `apps/web/app/api/geo/search/route.ts`. The API route sets the required `User-Agent: uDeets/1.0 (contact: udeetsdev1@gmail.com)` header and forwards to Nominatim. This also centralizes rate-limit handling.
2. Add server-side in-memory or edge-KV rate limiting (e.g. 1 request/sec/IP). For a stopgap without infra, a per-session cooldown on the client is acceptable: disable the button for 2 seconds after a successful call.
3. Surface errors to the user: on failure, show a small inline message: "Couldn't find your location. Please try again." Don't silently fail.
4. Cache the result for the session. If the user lat/lon hasn't moved >50m, reuse the last geocode instead of re-fetching.
5. **For production:** budget for a paid provider (Google Geocoding, Mapbox, or LocationIQ). Nominatim's free tier forbids use "for critical services" and caps at ~1 req/sec. Swap the API route to the paid provider when scaling.

**Gotchas:**
- Do not leak the user's coordinates anywhere beyond the direct request. Don't log lat/lon to analytics.
- Browser `navigator.geolocation` promise can hang if permission is pending. Add a timeout (10s) and handle rejection.

---

## 8. Apply Avatars Bucket Migration to Live Supabase

**Target:** operational task — apply `supabase/migrations/20260404_create_avatars_bucket.sql` to the hosted Supabase project.

**What the migration does:** Creates a storage bucket `avatars` with a 5 MB limit, allows MIME types `image/jpeg`, `image/png`, `image/webp`, `image/gif`, and adds RLS policies for authenticated self-upload + self-update and public read.

**Two ways to apply:**

**Option A — Supabase CLI (preferred):**
```
cd supabase
supabase link --project-ref <your-project-ref>
supabase db push
```
This applies all migrations whose timestamp is newer than what's already recorded in `_migrations`.

**Option B — Supabase Dashboard SQL Editor:**
1. Open the SQL editor for the target project.
2. Paste the contents of `supabase/migrations/20260404_create_avatars_bucket.sql`.
3. Run. Verify the bucket appears under Storage.

**Post-apply verification:**
1. Upload a test avatar via the profile page. Confirm no "Avatar storage is not set up yet" error (the exact string from `profile/page.tsx` line 235).
2. Fetch the resulting public URL in an incognito window.
3. Try uploading from a second user and ensure user A cannot overwrite user B's avatar (RLS folder check).

---

## 9. Profile Name Backfill for Existing Users

**Target:** operational — one-shot SQL or server action.

**What exists today:**
- `useProfileSync` (apps/web/services/auth/useProfileSync.ts) runs on login. If the profile row is missing, creates it from `auth.users.user_metadata`. If columns are NULL, backfills. Only runs **once per session** (`syncedRef`).
- Result: users who haven't logged in since the fix still have NULL `full_name`.

**Two options to close the gap:**

**Option A — One-shot SQL backfill (recommended, minutes):**
```sql
update public.profiles p
set full_name = coalesce(
  p.full_name,
  u.raw_user_meta_data->>'full_name',
  u.raw_user_meta_data->>'name',
  split_part(coalesce(u.email, ''), '@', 1)
),
avatar_url = coalesce(p.avatar_url, u.raw_user_meta_data->>'avatar_url'),
email = coalesce(p.email, u.email),
updated_at = now()
from auth.users u
where u.id = p.id
  and (
    p.full_name is null
    or p.avatar_url is null
    or p.email is null
  );
```
Run this once in the Supabase SQL editor. Save as migration `20260418_backfill_profile_names.sql` for auditability.

**Option B — Database trigger on auth.users upsert:**
Create a trigger that runs on `insert or update of raw_user_meta_data on auth.users` and mirrors to `public.profiles`. More robust long-term, but more invasive and harder to debug.

**Gotchas:**
- `auth.users.raw_user_meta_data` lives in the `auth` schema. Make sure the DB role running the SQL has access.
- Google OAuth stores the name under BOTH `full_name` and `name` inconsistently (see PROJECT_CONTEXT §5). Always try both keys in that order.
- Don't overwrite values that users have explicitly edited — the `coalesce(p.full_name, ...)` ensures you only fill NULLs.

---

## Appendix — Items Verified Already Done

The following were listed as pending on April 3 but verified done on April 18, so they are **not** in the spec above:

- Hub sidebar Settings highlight bug (fixed in `HubSidebarNav.tsx`)
- Profile dropdown redesign (Band-style complete in `udeets-navigation.tsx`)
- Settings page design refinement (polished)
- Preferences migration (`20260330_add_profile_preferences.sql` applied)
- Author name in deet feed (fallback cascade wired in `HubClient.tsx` lines 191–196)
- Post title "Photo" placeholder (handled via `GENERIC_TITLE_LABELS`)
- Design system `theme.ts` (exists, 169 lines, centralized)
- Older April 1 migrations (`hub_template_fields`, `attachment_source`) — superseded / not needed

---

*End of spec. Apply in any order; priority order above reflects dependency and impact.*
