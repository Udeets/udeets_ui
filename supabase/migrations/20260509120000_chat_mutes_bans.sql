-- Room-level mutes and bans for chat authorization (used with service-layer checks + RLS).

create table if not exists public.chat_room_mutes (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.chat_rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  muted_by uuid references auth.users(id) on delete set null,
  muted_until timestamptz,
  reason text,
  created_at timestamptz not null default now(),
  constraint chat_room_mutes_room_user_unique unique (room_id, user_id)
);

create index if not exists chat_room_mutes_room_idx on public.chat_room_mutes (room_id);
create index if not exists chat_room_mutes_user_idx on public.chat_room_mutes (user_id);

create table if not exists public.chat_room_bans (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.chat_rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  banned_by uuid references auth.users(id) on delete set null,
  reason text,
  created_at timestamptz not null default now(),
  constraint chat_room_bans_room_user_unique unique (room_id, user_id)
);

create index if not exists chat_room_bans_room_idx on public.chat_room_bans (room_id);
create index if not exists chat_room_bans_user_idx on public.chat_room_bans (user_id);

-- -----------------------------------------------------------------------------
-- RLS — chat_room_mutes
-- -----------------------------------------------------------------------------
alter table public.chat_room_mutes enable row level security;

drop policy if exists "chat_room_mutes_select_self_or_mod" on public.chat_room_mutes;
create policy "chat_room_mutes_select_self_or_mod"
  on public.chat_room_mutes for select to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.chat_room_memberships crm
      where crm.room_id = chat_room_mutes.room_id
        and crm.user_id = auth.uid()
        and crm.status = 'active'
        and crm.role in ('owner', 'admin', 'moderator')
    )
    or exists (
      select 1 from public.chat_rooms r
      join public.hub_members hm on hm.hub_id = r.hub_id
      where r.id = chat_room_mutes.room_id
        and hm.user_id = auth.uid()
        and hm.role in ('creator', 'admin')
        and hm.status = 'active'
    )
  );

drop policy if exists "chat_room_mutes_write_mod" on public.chat_room_mutes;
create policy "chat_room_mutes_write_mod"
  on public.chat_room_mutes for insert to authenticated
  with check (
    muted_by = auth.uid()
    and (
      exists (
        select 1 from public.chat_room_memberships crm
        where crm.room_id = chat_room_mutes.room_id
          and crm.user_id = auth.uid()
          and crm.status = 'active'
          and crm.role in ('owner', 'admin', 'moderator')
      )
      or exists (
        select 1 from public.chat_rooms r
        join public.hub_members hm on hm.hub_id = r.hub_id
        where r.id = chat_room_mutes.room_id
          and hm.user_id = auth.uid()
          and hm.role in ('creator', 'admin')
          and hm.status = 'active'
      )
    )
  );

drop policy if exists "chat_room_mutes_delete_mod" on public.chat_room_mutes;
create policy "chat_room_mutes_delete_mod"
  on public.chat_room_mutes for delete to authenticated
  using (
    exists (
      select 1 from public.chat_room_memberships crm
      where crm.room_id = chat_room_mutes.room_id
        and crm.user_id = auth.uid()
        and crm.status = 'active'
        and crm.role in ('owner', 'admin', 'moderator')
    )
    or exists (
      select 1 from public.chat_rooms r
      join public.hub_members hm on hm.hub_id = r.hub_id
      where r.id = chat_room_mutes.room_id
        and hm.user_id = auth.uid()
        and hm.role in ('creator', 'admin')
        and hm.status = 'active'
    )
  );

drop policy if exists "chat_room_mutes_update_mod" on public.chat_room_mutes;
create policy "chat_room_mutes_update_mod"
  on public.chat_room_mutes for update to authenticated
  using (
    exists (
      select 1 from public.chat_room_memberships crm
      where crm.room_id = chat_room_mutes.room_id
        and crm.user_id = auth.uid()
        and crm.status = 'active'
        and crm.role in ('owner', 'admin', 'moderator')
    )
    or exists (
      select 1 from public.chat_rooms r
      join public.hub_members hm on hm.hub_id = r.hub_id
      where r.id = chat_room_mutes.room_id
        and hm.user_id = auth.uid()
        and hm.role in ('creator', 'admin')
        and hm.status = 'active'
    )
  );

-- -----------------------------------------------------------------------------
-- RLS — chat_room_bans (room owner/admin or hub admin)
-- -----------------------------------------------------------------------------
alter table public.chat_room_bans enable row level security;

drop policy if exists "chat_room_bans_select_self_or_staff" on public.chat_room_bans;
create policy "chat_room_bans_select_self_or_staff"
  on public.chat_room_bans for select to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.chat_room_memberships crm
      where crm.room_id = chat_room_bans.room_id
        and crm.user_id = auth.uid()
        and crm.status = 'active'
        and crm.role in ('owner', 'admin')
    )
    or exists (
      select 1 from public.chat_rooms r
      join public.hub_members hm on hm.hub_id = r.hub_id
      where r.id = chat_room_bans.room_id
        and hm.user_id = auth.uid()
        and hm.role in ('creator', 'admin')
        and hm.status = 'active'
    )
  );

drop policy if exists "chat_room_bans_insert_staff" on public.chat_room_bans;
create policy "chat_room_bans_insert_staff"
  on public.chat_room_bans for insert to authenticated
  with check (
    banned_by = auth.uid()
    and (
      exists (
        select 1 from public.chat_room_memberships crm
        where crm.room_id = chat_room_bans.room_id
          and crm.user_id = auth.uid()
          and crm.status = 'active'
          and crm.role in ('owner', 'admin')
      )
      or exists (
        select 1 from public.chat_rooms r
        join public.hub_members hm on hm.hub_id = r.hub_id
        where r.id = chat_room_bans.room_id
          and hm.user_id = auth.uid()
          and hm.role in ('creator', 'admin')
          and hm.status = 'active'
      )
    )
  );

drop policy if exists "chat_room_bans_delete_staff" on public.chat_room_bans;
create policy "chat_room_bans_delete_staff"
  on public.chat_room_bans for delete to authenticated
  using (
    exists (
      select 1 from public.chat_room_memberships crm
      where crm.room_id = chat_room_bans.room_id
        and crm.user_id = auth.uid()
        and crm.status = 'active'
        and crm.role in ('owner', 'admin')
    )
    or exists (
      select 1 from public.chat_rooms r
      join public.hub_members hm on hm.hub_id = r.hub_id
      where r.id = chat_room_bans.room_id
        and hm.user_id = auth.uid()
        and hm.role in ('creator', 'admin')
        and hm.status = 'active'
    )
  );
