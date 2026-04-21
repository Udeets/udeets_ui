-- Allow users to like their own profile.
--
-- The original `profile_likes` table had a CHECK constraint preventing
-- `profile_id = liker_id` (Instagram / LinkedIn convention). Product call
-- is now to allow self-likes so a user's own like counts toward their
-- profile total. This drops that constraint.
--
-- The check constraint was declared inline so Postgres auto-generated its
-- name. We drop every check constraint on the table in a DO block so this
-- works regardless of what name Postgres assigned (usually `profile_likes_check`).

do $$
declare
  cons record;
begin
  for cons in
    select conname
    from pg_constraint
    where conrelid = 'public.profile_likes'::regclass
      and contype = 'c'
  loop
    execute format('alter table public.profile_likes drop constraint %I', cons.conname);
  end loop;
end $$;
