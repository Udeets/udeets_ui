-- Persist the "Disable comments" composer setting on each deet.
-- Default true so every existing deet remains commentable.

alter table public.deets
  add column if not exists allow_comments boolean not null default true;
