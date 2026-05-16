-- Hub creators are admins in the app even when hub_members row is missing (see useHubRole).
-- Align _hub_is_admin with create_chat_room_for_hub authz.

create or replace function public._hub_is_admin(p_hub_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.hub_members m
    where m.hub_id = p_hub_id
      and m.user_id = p_user_id
      and m.role in ('creator', 'admin')
      and m.status = 'active'
  )
  or exists (
    select 1 from public.hubs h
    where h.id = p_hub_id
      and h.created_by = p_user_id::text
  );
$$;

revoke all on function public._hub_is_admin(uuid, uuid) from public;
grant execute on function public._hub_is_admin(uuid, uuid) to authenticated, service_role;
