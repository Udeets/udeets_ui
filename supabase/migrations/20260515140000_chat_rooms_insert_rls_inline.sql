-- Replace SECURITY DEFINER insert helper with an inline WITH CHECK so hub_members / hubs
-- reads run as the authenticated invoker (same as pre-20260514120000), and hub *owners*
-- still pass when hubs.created_by matches even if hub_members is missing (e.g. failed insert).
--
-- Also extend chat_rls_hub_staff_for_room so the first chat_room_memberships row (room owner)
-- can be inserted when the user is only on hubs.created_by (memberships insert uses this RPC).

create or replace function public.chat_rls_hub_staff_for_room(p_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.chat_rooms cr
    inner join public.hub_members hm on hm.hub_id = cr.hub_id
    where cr.id = p_room_id
      and hm.user_id = auth.uid()
      and hm.role in ('creator', 'admin')
      and hm.status = 'active'
  )
  or exists (
    select 1
    from public.chat_rooms cr
    inner join public.hubs h on h.id = cr.hub_id
    where cr.id = p_room_id
      and h.created_by = auth.uid()::text
  );
$$;

drop policy if exists "chat_rooms_insert_hub_staff" on public.chat_rooms;

create policy "chat_rooms_insert_hub_staff"
  on public.chat_rooms for insert to authenticated
  with check (
    coalesce(created_by, auth.uid()) = auth.uid()
    and (
      exists (
        select 1 from public.hub_members hm
        where hm.hub_id = chat_rooms.hub_id
          and hm.user_id = auth.uid()
          and hm.role in ('creator', 'admin')
          and hm.status = 'active'
      )
      or exists (
        select 1 from public.hubs h
        where h.id = chat_rooms.hub_id
          and h.created_by = auth.uid()::text
      )
    )
  );

drop function if exists public.chat_rls_may_insert_chat_room(uuid, uuid);
