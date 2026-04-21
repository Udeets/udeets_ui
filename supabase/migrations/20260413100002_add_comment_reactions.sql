-- Comment-level reactions table (mirrors deet_likes pattern for comments)
create table if not exists public.comment_reactions (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.deet_comments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reaction_type text not null default 'like',
  created_at timestamptz not null default timezone('utc', now()),
  unique (comment_id, user_id)
);

create index if not exists idx_comment_reactions_comment_id on public.comment_reactions (comment_id);
create index if not exists idx_comment_reactions_user_id on public.comment_reactions (user_id);

-- RLS policies
alter table public.comment_reactions enable row level security;

create policy "Anyone can read comment reactions"
  on public.comment_reactions for select
  using (true);

create policy "Authenticated users can insert own comment reactions"
  on public.comment_reactions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own comment reactions"
  on public.comment_reactions for update
  using (auth.uid() = user_id);

create policy "Users can delete own comment reactions"
  on public.comment_reactions for delete
  using (auth.uid() = user_id);
