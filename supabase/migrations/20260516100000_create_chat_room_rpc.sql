-- Create chat room + owner membership in one transaction, with explicit authz checks.
-- Runs as SECURITY DEFINER so inserts are not blocked by RLS evaluation quirks on direct PostgREST inserts.

create or replace function public.create_chat_room_for_hub(
  p_hub_id uuid,
  p_name text,
  p_description text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_room_id uuid;
  v_name text := trim(p_name);
  v_desc text := nullif(trim(coalesce(p_description, '')), '');
begin
  if v_uid is null then
    raise exception 'CHAT_ROOM_CREATE_UNAUTH';
  end if;

  if v_name is null or length(v_name) = 0 or length(v_name) > 200 then
    raise exception 'CHAT_ROOM_NAME_INVALID';
  end if;

  if v_desc is not null and length(v_desc) > 2000 then
    raise exception 'CHAT_ROOM_DESC_INVALID';
  end if;

  if not exists (select 1 from public.hubs where id = p_hub_id) then
    raise exception 'CHAT_ROOM_HUB_NOT_FOUND';
  end if;

  if not (
    exists (
      select 1
      from public.hub_members hm
      where hm.hub_id = p_hub_id
        and hm.user_id = v_uid
        and hm.role in ('creator', 'admin')
        and hm.status = 'active'
    )
    or exists (
      select 1
      from public.hubs h
      where h.id = p_hub_id
        and h.created_by = v_uid::text
    )
  ) then
    raise exception 'CHAT_ROOM_CREATE_FORBIDDEN';
  end if;

  insert into public.chat_rooms (hub_id, name, description, created_by)
  values (p_hub_id, v_name, v_desc, v_uid)
  returning id into v_room_id;

  insert into public.chat_room_memberships (room_id, user_id, role, status, invited_by)
  values (v_room_id, v_uid, 'owner', 'active', v_uid);

  return v_room_id;
end;
$$;

comment on function public.create_chat_room_for_hub(uuid, text, text) is
  'Creates a chat room and active owner membership for auth.uid(); hub creator/admin or hubs.created_by.';

revoke all on function public.create_chat_room_for_hub(uuid, text, text) from public;
grant execute on function public.create_chat_room_for_hub(uuid, text, text) to authenticated;
