-- One-shot backfill to close the gap for users who signed up before the
-- profile-sync fix and haven't logged back in.
--
-- Pulls full_name / avatar_url / email from auth.users.user_metadata and
-- fills any NULLs in public.profiles. Never overwrites a value the user has
-- already set (thanks to coalesce).
--
-- Google OAuth stores display name under BOTH `full_name` and `name` depending
-- on the flow, so we check both keys in priority order.

update public.profiles p
set
  full_name = coalesce(
    p.full_name,
    u.raw_user_meta_data ->> 'full_name',
    u.raw_user_meta_data ->> 'name',
    split_part(coalesce(u.email, ''), '@', 1)
  ),
  avatar_url = coalesce(p.avatar_url, u.raw_user_meta_data ->> 'avatar_url'),
  email = coalesce(p.email, u.email),
  updated_at = now()
from auth.users u
where u.id = p.id
  and (
    p.full_name is null
    or p.avatar_url is null
    or p.email is null
  );

-- Surface counts so the operator running the migration can sanity-check results.
do $$
declare
  remaining int;
begin
  select count(*) into remaining from public.profiles where full_name is null;
  raise notice 'profiles with full_name still NULL after backfill: %', remaining;
end $$;
