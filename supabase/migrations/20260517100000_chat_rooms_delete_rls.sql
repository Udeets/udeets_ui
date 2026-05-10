-- Allow hub staff or room owner/admin to delete a chat room (cascades to messages, memberships, etc.).
drop policy if exists "chat_rooms_delete_hub_staff_or_room_admin" on public.chat_rooms;
create policy "chat_rooms_delete_hub_staff_or_room_admin"
  on public.chat_rooms for delete to authenticated
  using (
    public.chat_rls_hub_staff_for_room(id)
    or public.chat_rls_room_owner_admin(id, auth.uid())
  );
