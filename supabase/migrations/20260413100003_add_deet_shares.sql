-- Add share_count to deets for denormalized share tracking
alter table public.deets
  add column if not exists share_count integer not null default 0;

-- Create deet_shares table to track individual shares (one per user per deet)
create table if not exists public.deet_shares (
  id uuid primary key default gen_random_uuid(),
  deet_id uuid not null references public.deets(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  shared_at timestamptz not null default now(),
  unique (deet_id, user_id)
);

-- Index for counting shares per deet
create index if not exists idx_deet_shares_deet_id on public.deet_shares(deet_id);

-- RLS policies
alter table public.deet_shares enable row level security;

-- Anyone can view shares
create policy "Anyone can view deet shares"
  on public.deet_shares for select
  using (true);

-- Authenticated users can insert their own shares
create policy "Authenticated users can share deets"
  on public.deet_shares for insert
  with check (auth.uid() = user_id);
