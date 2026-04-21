-- Add reaction_type to deet_likes (which emoji the user reacted with)
alter table public.deet_likes
  add column if not exists reaction_type text not null default 'like';

-- Add parent_id to deet_comments for one-level nested replies
alter table public.deet_comments
  add column if not exists parent_id uuid references public.deet_comments(id) on delete cascade;

-- Index for fast reply lookups
create index if not exists idx_deet_comments_parent_id on public.deet_comments(parent_id);

-- RLS policies already exist for deet_comments (select, insert, update, delete for own)
-- and deet_likes (select, insert, delete). No new policies needed.
