-- chat_rooms INSERT RLS: ensure hub_members visibility cannot block room creation for
-- legitimate hub creators/admins (mirrors app-layer assertCreateChatRoomAllowed).
-- Also default created_by to auth.uid() so the row always matches the session user.

alter table public.chat_rooms
  alter column created_by set default auth.uid();

create or replace function public.chat_rls_may_insert_chat_room(p_hub_id uuid, p_created_by uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce(p_created_by, auth.uid()) = auth.uid()
    and exists (
      select 1 from public.hub_members hm
      where hm.hub_id = p_hub_id
        and hm.user_id = auth.uid()
        and hm.role in ('creator', 'admin')
        and hm.status = 'active'
    );
$$;

comment on function public.chat_rls_may_insert_chat_room(uuid, uuid) is
  'RLS helper: hub creator/admin may insert a chat room for this hub as self (SECURITY DEFINER read on hub_members).';

revoke all on function public.chat_rls_may_insert_chat_room(uuid, uuid) from public;
grant execute on function public.chat_rls_may_insert_chat_room(uuid, uuid) to authenticated;

drop policy if exists "chat_rooms_insert_hub_staff" on public.chat_rooms;

create policy "chat_rooms_insert_hub_staff"
  on public.chat_rooms for insert to authenticated
  with check (public.chat_rls_may_insert_chat_room(hub_id, created_by));
