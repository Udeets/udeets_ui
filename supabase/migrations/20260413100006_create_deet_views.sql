-- ============================================================
-- Track who viewed each deet (one row per user per deet).
-- The existing view_count on deets stays as a denormalized counter.
-- ============================================================

create table if not exists public.deet_views (
  id uuid primary key default gen_random_uuid(),
  deet_id uuid not null references public.deets(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  viewed_at timestamptz not null default timezone('utc', now()),
  unique (deet_id, user_id)
);

create index if not exists deet_views_deet_id_idx on public.deet_views (deet_id);

alter table public.deet_views enable row level security;

-- Anyone authenticated can read views
create policy "Anyone can read deet views"
  on public.deet_views for select
  to authenticated
  using (true);

-- Users can insert their own view record
create policy "Users can record deet views"
  on public.deet_views for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Users can update their own view record (timestamp refresh)
create policy "Users can update own deet views"
  on public.deet_views for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
