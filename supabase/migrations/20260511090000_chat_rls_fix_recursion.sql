-- Fix PostgreSQL 42P17: infinite recursion detected in policy for relation "chat_rooms".
-- chat_rooms policies referenced chat_room_memberships; those policies referenced chat_rooms again.
-- SECURITY DEFINER helpers read underlying rows without re-evaluating RLS on those tables.

-- -----------------------------------------------------------------------------
-- Helper functions (SECURITY DEFINER = run as owner; bypasses RLS on reads inside)
-- -----------------------------------------------------------------------------

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
  );
$$;

create or replace function public.chat_rls_active_member(p_room_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.chat_room_memberships m
    where m.room_id = p_room_id
      and m.user_id = p_user_id
      and m.status = 'active'
  );
$$;

create or replace function public.chat_rls_active_mod_plus(p_room_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.chat_room_memberships m
    where m.room_id = p_room_id
      and m.user_id = p_user_id
      and m.status = 'active'
      and m.role in ('owner', 'admin', 'moderator')
  );
$$;

create or replace function public.chat_rls_room_owner_admin(p_room_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.chat_room_memberships m
    where m.room_id = p_room_id
      and m.user_id = p_user_id
      and m.status = 'active'
      and m.role in ('owner', 'admin')
  );
$$;

revoke all on function public.chat_rls_hub_staff_for_room(uuid) from PUBLIC;
revoke all on function public.chat_rls_active_member(uuid, uuid) from PUBLIC;
revoke all on function public.chat_rls_active_mod_plus(uuid, uuid) from PUBLIC;
revoke all on function public.chat_rls_room_owner_admin(uuid, uuid) from PUBLIC;

grant execute on function public.chat_rls_hub_staff_for_room(uuid) to authenticated;
grant execute on function public.chat_rls_active_member(uuid, uuid) to authenticated;
grant execute on function public.chat_rls_active_mod_plus(uuid, uuid) to authenticated;
grant execute on function public.chat_rls_room_owner_admin(uuid, uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- chat_rooms
-- -----------------------------------------------------------------------------
drop policy if exists "chat_rooms_select_hub_staff_or_member" on public.chat_rooms;
create policy "chat_rooms_select_hub_staff_or_member"
  on public.chat_rooms for select to authenticated
  using (
    public.chat_rls_hub_staff_for_room(id)
    or public.chat_rls_active_member(id, auth.uid())
  );

drop policy if exists "chat_rooms_update_hub_staff_or_room_admin" on public.chat_rooms;
create policy "chat_rooms_update_hub_staff_or_room_admin"
  on public.chat_rooms for update to authenticated
  using (
    public.chat_rls_hub_staff_for_room(id)
    or public.chat_rls_room_owner_admin(id, auth.uid())
  );

-- -----------------------------------------------------------------------------
-- chat_room_memberships
-- -----------------------------------------------------------------------------
drop policy if exists "chat_room_memberships_select_self_or_staff" on public.chat_room_memberships;
create policy "chat_room_memberships_select_self_or_staff"
  on public.chat_room_memberships for select to authenticated
  using (
    user_id = auth.uid()
    or public.chat_rls_hub_staff_for_room(chat_room_memberships.room_id)
    or public.chat_rls_active_member(chat_room_memberships.room_id, auth.uid())
  );

drop policy if exists "chat_room_memberships_insert_staff" on public.chat_room_memberships;
create policy "chat_room_memberships_insert_staff"
  on public.chat_room_memberships for insert to authenticated
  with check (
    public.chat_rls_hub_staff_for_room(chat_room_memberships.room_id)
    or public.chat_rls_active_mod_plus(chat_room_memberships.room_id, auth.uid())
  );

drop policy if exists "chat_room_memberships_update_self_or_staff" on public.chat_room_memberships;
create policy "chat_room_memberships_update_self_or_staff"
  on public.chat_room_memberships for update to authenticated
  using (
    user_id = auth.uid()
    or public.chat_rls_hub_staff_for_room(chat_room_memberships.room_id)
    or public.chat_rls_active_mod_plus(chat_room_memberships.room_id, auth.uid())
  );

-- -----------------------------------------------------------------------------
-- chat_room_invites
-- -----------------------------------------------------------------------------
drop policy if exists "chat_room_invites_select_invitee_or_staff" on public.chat_room_invites;
create policy "chat_room_invites_select_invitee_or_staff"
  on public.chat_room_invites for select to authenticated
  using (
    invited_user_id = auth.uid()
    or public.chat_rls_hub_staff_for_room(chat_room_invites.room_id)
    or public.chat_rls_active_mod_plus(chat_room_invites.room_id, auth.uid())
  );

drop policy if exists "chat_room_invites_insert_staff" on public.chat_room_invites;
create policy "chat_room_invites_insert_staff"
  on public.chat_room_invites for insert to authenticated
  with check (
    invited_by = auth.uid()
    and (
      public.chat_rls_hub_staff_for_room(chat_room_invites.room_id)
      or public.chat_rls_active_mod_plus(chat_room_invites.room_id, auth.uid())
    )
  );

drop policy if exists "chat_room_invites_update_staff_revoke" on public.chat_room_invites;
create policy "chat_room_invites_update_staff_revoke"
  on public.chat_room_invites for update to authenticated
  using (
    public.chat_rls_hub_staff_for_room(chat_room_invites.room_id)
    or public.chat_rls_active_mod_plus(chat_room_invites.room_id, auth.uid())
  )
  with check (status in ('revoked', 'expired'));

-- -----------------------------------------------------------------------------
-- chat_messages
-- -----------------------------------------------------------------------------
drop policy if exists "chat_messages_select_room_members" on public.chat_messages;
create policy "chat_messages_select_room_members"
  on public.chat_messages for select to authenticated
  using (
    public.chat_rls_active_member(chat_messages.room_id, auth.uid())
    or public.chat_rls_hub_staff_for_room(chat_messages.room_id)
  );

drop policy if exists "chat_messages_insert_room_members" on public.chat_messages;
create policy "chat_messages_insert_room_members"
  on public.chat_messages for insert to authenticated
  with check (
    sender_id = auth.uid()
    and public.chat_rls_active_member(chat_messages.room_id, auth.uid())
  );

drop policy if exists "chat_messages_insert_system_staff" on public.chat_messages;
create policy "chat_messages_insert_system_staff"
  on public.chat_messages for insert to authenticated
  with check (
    message_kind = 'system'
    and sender_id is null
    and (
      public.chat_rls_active_mod_plus(chat_messages.room_id, auth.uid())
      or public.chat_rls_hub_staff_for_room(chat_messages.room_id)
    )
  );

drop policy if exists "chat_messages_update_own_or_mod" on public.chat_messages;
create policy "chat_messages_update_own_or_mod"
  on public.chat_messages for update to authenticated
  using (
    (
      sender_id = auth.uid()
      and public.chat_rls_active_member(chat_messages.room_id, auth.uid())
    )
    or public.chat_rls_active_mod_plus(chat_messages.room_id, auth.uid())
    or public.chat_rls_hub_staff_for_room(chat_messages.room_id)
  );

-- -----------------------------------------------------------------------------
-- chat_message_attachments (hub branch only needed change)
-- -----------------------------------------------------------------------------
drop policy if exists "chat_message_attachments_select_room_members" on public.chat_message_attachments;
create policy "chat_message_attachments_select_room_members"
  on public.chat_message_attachments for select to authenticated
  using (
    exists (
      select 1 from public.chat_messages m
      join public.chat_room_memberships crm on crm.room_id = m.room_id
      where m.id = chat_message_attachments.message_id
        and crm.user_id = auth.uid()
        and crm.status = 'active'
    )
    or exists (
      select 1 from public.chat_messages m
      where m.id = chat_message_attachments.message_id
        and public.chat_rls_hub_staff_for_room(m.room_id)
    )
  );

-- -----------------------------------------------------------------------------
-- chat_room_mutes / chat_room_bans
-- -----------------------------------------------------------------------------
drop policy if exists "chat_room_mutes_select_self_or_mod" on public.chat_room_mutes;
create policy "chat_room_mutes_select_self_or_mod"
  on public.chat_room_mutes for select to authenticated
  using (
    user_id = auth.uid()
    or public.chat_rls_active_mod_plus(chat_room_mutes.room_id, auth.uid())
    or public.chat_rls_hub_staff_for_room(chat_room_mutes.room_id)
  );

drop policy if exists "chat_room_mutes_write_mod" on public.chat_room_mutes;
create policy "chat_room_mutes_write_mod"
  on public.chat_room_mutes for insert to authenticated
  with check (
    muted_by = auth.uid()
    and (
      public.chat_rls_active_mod_plus(chat_room_mutes.room_id, auth.uid())
      or public.chat_rls_hub_staff_for_room(chat_room_mutes.room_id)
    )
  );

drop policy if exists "chat_room_mutes_delete_mod" on public.chat_room_mutes;
create policy "chat_room_mutes_delete_mod"
  on public.chat_room_mutes for delete to authenticated
  using (
    public.chat_rls_active_mod_plus(chat_room_mutes.room_id, auth.uid())
    or public.chat_rls_hub_staff_for_room(chat_room_mutes.room_id)
  );

drop policy if exists "chat_room_mutes_update_mod" on public.chat_room_mutes;
create policy "chat_room_mutes_update_mod"
  on public.chat_room_mutes for update to authenticated
  using (
    public.chat_rls_active_mod_plus(chat_room_mutes.room_id, auth.uid())
    or public.chat_rls_hub_staff_for_room(chat_room_mutes.room_id)
  );

drop policy if exists "chat_room_bans_select_self_or_staff" on public.chat_room_bans;
create policy "chat_room_bans_select_self_or_staff"
  on public.chat_room_bans for select to authenticated
  using (
    user_id = auth.uid()
    or public.chat_rls_room_owner_admin(chat_room_bans.room_id, auth.uid())
    or public.chat_rls_hub_staff_for_room(chat_room_bans.room_id)
  );

drop policy if exists "chat_room_bans_insert_staff" on public.chat_room_bans;
create policy "chat_room_bans_insert_staff"
  on public.chat_room_bans for insert to authenticated
  with check (
    banned_by = auth.uid()
    and (
      public.chat_rls_room_owner_admin(chat_room_bans.room_id, auth.uid())
      or public.chat_rls_hub_staff_for_room(chat_room_bans.room_id)
    )
  );

drop policy if exists "chat_room_bans_delete_staff" on public.chat_room_bans;
create policy "chat_room_bans_delete_staff"
  on public.chat_room_bans for delete to authenticated
  using (
    public.chat_rls_room_owner_admin(chat_room_bans.room_id, auth.uid())
    or public.chat_rls_hub_staff_for_room(chat_room_bans.room_id)
  );
