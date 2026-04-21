-- Poll votes table: stores which option(s) a user selected for a poll deet
create table if not exists public.poll_votes (
  id uuid primary key default gen_random_uuid(),
  deet_id uuid not null references public.deets(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  option_index int not null,
  created_at timestamptz not null default now(),
  unique (deet_id, user_id, option_index)
);

-- Index for fast lookups
create index if not exists idx_poll_votes_deet_id on public.poll_votes(deet_id);
create index if not exists idx_poll_votes_user on public.poll_votes(user_id, deet_id);

-- RLS
alter table public.poll_votes enable row level security;

-- Anyone authenticated can read poll votes
create policy "Anyone can read poll votes"
  on public.poll_votes for select
  using (true);

-- Authenticated users can insert their own votes
create policy "Users can insert own votes"
  on public.poll_votes for insert
  with check (auth.uid() = user_id);

-- Users can delete their own votes (to change vote)
create policy "Users can delete own votes"
  on public.poll_votes for delete
  using (auth.uid() = user_id);
