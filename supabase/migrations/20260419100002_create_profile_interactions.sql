-- Profile-level interactions: users can like/comment on another user's
-- profile photo (separate from deet likes/comments), and report profiles
-- for admin review.
--
-- These tables are keyed on the PROFILE (the user), not a specific avatar
-- file URL — so if a user changes their avatar, existing likes/comments
-- persist. Feels natural for "Katrina's profile" vs "this specific image".

-- ──────────────────────────────────────────────────────────────
-- profile_likes
-- A user (liker_id) likes another user's profile (profile_id).
-- Unique on (liker_id, profile_id) so a user can only like once per profile.
-- ──────────────────────────────────────────────────────────────
create table if not exists public.profile_likes (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references auth.users(id) on delete cascade,
  liker_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (profile_id, liker_id),
  check (profile_id <> liker_id)
);

create index if not exists profile_likes_profile_idx on public.profile_likes(profile_id);
create index if not exists profile_likes_liker_idx on public.profile_likes(liker_id);

alter table public.profile_likes enable row level security;

drop policy if exists "Anyone can read profile likes" on public.profile_likes;
create policy "Anyone can read profile likes"
  on public.profile_likes
  for select
  using (true);

drop policy if exists "Users can like profiles" on public.profile_likes;
create policy "Users can like profiles"
  on public.profile_likes
  for insert
  to authenticated
  with check (liker_id = auth.uid());

drop policy if exists "Users can unlike their own likes" on public.profile_likes;
create policy "Users can unlike their own likes"
  on public.profile_likes
  for delete
  to authenticated
  using (liker_id = auth.uid());

-- ──────────────────────────────────────────────────────────────
-- profile_comments
-- Any authenticated user can comment on another user's profile.
-- Commenters can edit/delete their own comments; profile owners can delete
-- any comment on their own profile.
-- ──────────────────────────────────────────────────────────────
create table if not exists public.profile_comments (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references auth.users(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (length(trim(body)) > 0 and length(body) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create index if not exists profile_comments_profile_idx on public.profile_comments(profile_id, created_at desc);
create index if not exists profile_comments_author_idx on public.profile_comments(author_id);

alter table public.profile_comments enable row level security;

drop policy if exists "Anyone authenticated can read profile comments" on public.profile_comments;
create policy "Anyone authenticated can read profile comments"
  on public.profile_comments
  for select
  to authenticated
  using (true);

drop policy if exists "Users can comment on profiles" on public.profile_comments;
create policy "Users can comment on profiles"
  on public.profile_comments
  for insert
  to authenticated
  with check (author_id = auth.uid());

drop policy if exists "Authors can edit own comments" on public.profile_comments;
create policy "Authors can edit own comments"
  on public.profile_comments
  for update
  to authenticated
  using (author_id = auth.uid())
  with check (author_id = auth.uid());

drop policy if exists "Authors and profile owners can delete" on public.profile_comments;
create policy "Authors and profile owners can delete"
  on public.profile_comments
  for delete
  to authenticated
  using (author_id = auth.uid() or profile_id = auth.uid());

-- ──────────────────────────────────────────────────────────────
-- user_reports
-- When someone reports a profile, a row lands here for admin review.
-- Platform admins (profiles.app_role = 'superadmin') can read and update.
-- ──────────────────────────────────────────────────────────────
create table if not exists public.user_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reported_user_id uuid not null references auth.users(id) on delete cascade,
  reason text not null check (length(trim(reason)) > 0 and length(reason) <= 1000),
  context text,  -- optional extra context: hub slug, deet id, etc.
  status text not null default 'open'
    check (status in ('open', 'reviewing', 'resolved', 'dismissed')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  check (reporter_id <> reported_user_id)
);

create index if not exists user_reports_reported_idx on public.user_reports(reported_user_id, status);
create index if not exists user_reports_reporter_idx on public.user_reports(reporter_id);
create index if not exists user_reports_status_idx on public.user_reports(status, created_at desc);

alter table public.user_reports enable row level security;

-- Reporter can see their own reports (so the UI can confirm submission).
drop policy if exists "Reporter reads own reports" on public.user_reports;
create policy "Reporter reads own reports"
  on public.user_reports
  for select
  to authenticated
  using (reporter_id = auth.uid());

-- Platform admins can read every report.
drop policy if exists "Platform admins read all reports" on public.user_reports;
create policy "Platform admins read all reports"
  on public.user_reports
  for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.app_role = 'superadmin'
    )
  );

-- Any authenticated user can file a report against another user.
drop policy if exists "Users file reports" on public.user_reports;
create policy "Users file reports"
  on public.user_reports
  for insert
  to authenticated
  with check (reporter_id = auth.uid() and reported_user_id <> auth.uid());

-- Platform admins can update status/reviewed fields.
drop policy if exists "Platform admins update reports" on public.user_reports;
create policy "Platform admins update reports"
  on public.user_reports
  for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.app_role = 'superadmin'
    )
  );
