-- Allow users with a pending chat_room_invites row to SELECT the room (name, hub_id)
-- for notifications and client room metadata. Active membership already covered.

drop policy if exists "chat_rooms_select_hub_staff_or_member" on public.chat_rooms;
create policy "chat_rooms_select_hub_staff_or_member"
  on public.chat_rooms for select to authenticated
  using (
    public.chat_rls_hub_staff_for_room(id)
    or public.chat_rls_active_member(id, auth.uid())
    or exists (
      select 1
      from public.chat_room_invites i
      where i.room_id = chat_rooms.id
        and i.invited_user_id = auth.uid()
        and i.status = 'pending'
    )
  );
