-- Invitee accept/decline for chat_room_invites (membership INSERT is staff-only under RLS).
-- Restores invitee UPDATE policy removed in 20260511090000 (decline via PostgREST still works).

drop policy if exists "chat_room_invites_update_invitee" on public.chat_room_invites;
create policy "chat_room_invites_update_invitee"
  on public.chat_room_invites for update to authenticated
  using (invited_user_id = auth.uid())
  with check (
    invited_user_id = auth.uid()
    and status in ('accepted', 'declined')
  );

create or replace function public.accept_chat_room_invite(p_room_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_inv_id uuid;
  v_invited_by uuid;
  v_hub uuid;
begin
  if v_uid is null then
    raise exception 'accept_chat_room_invite_unauth';
  end if;

  select i.id, i.invited_by
    into v_inv_id, v_invited_by
  from public.chat_room_invites i
  where i.room_id = p_room_id
    and i.invited_user_id = v_uid
    and i.status = 'pending'
  for update;

  if v_inv_id is null then
    raise exception 'accept_chat_room_invite_not_found';
  end if;

  select r.hub_id into v_hub from public.chat_rooms r where r.id = p_room_id;
  if v_hub is null then
    raise exception 'accept_chat_room_invite_room_missing';
  end if;

  if not exists (
    select 1 from public.hub_members hm
    where hm.hub_id = v_hub
      and hm.user_id = v_uid
      and hm.status = 'active'
  ) then
    raise exception 'accept_chat_room_invite_not_hub_member';
  end if;

  update public.chat_room_invites
  set status = 'accepted', responded_at = now()
  where id = v_inv_id;

  insert into public.chat_room_memberships (room_id, user_id, role, status, invited_by)
  values (p_room_id, v_uid, 'member', 'active', v_invited_by)
  on conflict (room_id, user_id) do update set
    status = 'active',
    invited_by = coalesce(excluded.invited_by, chat_room_memberships.invited_by),
    role = case
      when chat_room_memberships.role = 'owner' then chat_room_memberships.role
      else excluded.role
    end;
end;
$$;

create or replace function public.decline_chat_room_invite(p_room_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_cnt int;
begin
  if v_uid is null then
    raise exception 'decline_chat_room_invite_unauth';
  end if;

  update public.chat_room_invites
  set status = 'declined', responded_at = now()
  where room_id = p_room_id
    and invited_user_id = v_uid
    and status = 'pending';

  get diagnostics v_cnt = row_count;
  if v_cnt = 0 then
    raise exception 'decline_chat_room_invite_not_found';
  end if;
end;
$$;

comment on function public.accept_chat_room_invite(uuid) is
  'Pending invitee (auth.uid()) accepts; requires active hub_membership for the room hub; upserts active member row.';
comment on function public.decline_chat_room_invite(uuid) is
  'Pending invitee (auth.uid()) declines chat_room_invites for the room.';

revoke all on function public.accept_chat_room_invite(uuid) from public;
revoke all on function public.decline_chat_room_invite(uuid) from public;
grant execute on function public.accept_chat_room_invite(uuid) to authenticated;
grant execute on function public.decline_chat_room_invite(uuid) to authenticated;
