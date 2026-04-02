-- Add visibility column to hubs table
-- Values: 'public' or 'private', defaults to 'public'
alter table public.hubs
  add column if not exists visibility text not null default 'public';
