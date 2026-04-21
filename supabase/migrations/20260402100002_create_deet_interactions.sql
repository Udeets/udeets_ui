-- ============================================================
-- Deet interactions: likes, comments, and view counts
-- ============================================================

-- Likes (one per user per deet)
create table if not exists public.deet_likes (
  id uuid primary key default gen_random_uuid(),
  deet_id uuid not null references public.deets(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  unique (deet_id, user_id)
);

create index if not exists deet_likes_deet_id_idx on public.deet_likes (deet_id);
create index if not exists deet_likes_user_id_idx on public.deet_likes (user_id);

-- Comments
create table if not exists public.deet_comments (
  id uuid primary key default gen_random_uuid(),
  deet_id uuid not null references public.deets(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists deet_comments_deet_id_idx on public.deet_comments (deet_id, created_at);

-- View count on deets table (denormalized for performance)
alter table public.deets
  add column if not exists view_count integer not null default 0;

alter table public.deets
  add column if not exists like_count integer not null default 0;

alter table public.deets
  add column if not exists comment_count integer not null default 0;

-- RLS policies
alter table public.deet_likes enable row level security;
alter table public.deet_comments enable row level security;

-- Anyone authenticated can read likes
create policy "Anyone can read deet likes"
  on public.deet_likes for select
  to authenticated
  using (true);

-- Users can insert their own likes
create policy "Users can like deets"
  on public.deet_likes for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Users can remove their own likes
create policy "Users can unlike deets"
  on public.deet_likes for delete
  to authenticated
  using (auth.uid() = user_id);

-- Anyone authenticated can read comments
create policy "Anyone can read deet comments"
  on public.deet_comments for select
  to authenticated
  using (true);

-- Users can insert their own comments
create policy "Users can comment on deets"
  on public.deet_comments for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Users can delete their own comments
create policy "Users can delete own comments"
  on public.deet_comments for delete
  to authenticated
  using (auth.uid() = user_id);
