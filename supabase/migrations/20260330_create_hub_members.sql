-- -----------------------------------------------------------------------------
-- hub_members
-- Stores the membership record for every user in a hub.
-- The hub creator is inserted here by the application at hub creation time.
-- -----------------------------------------------------------------------------

create table if not exists public.hub_members (
  id         uuid        primary key default gen_random_uuid(),
  hub_id     uuid        not null references public.hubs(id) on delete cascade,
  user_id    uuid        not null references auth.users(id) on delete cascade,
  role       text        not null check (role in ('creator', 'admin', 'member')),
  status     text        not null default 'active' check (status in ('active', 'invited', 'pending')),
  joined_at  timestamptz not null default now(),

  constraint hub_members_hub_user_unique unique (hub_id, user_id)
);

create index if not exists hub_members_hub_id_idx  on public.hub_members (hub_id);
create index if not exists hub_members_user_id_idx on public.hub_members (user_id);

-- -----------------------------------------------------------------------------
-- Row-Level Security
-- -----------------------------------------------------------------------------

alter table public.hub_members enable row level security;

-- A user can always read their own membership rows.
create policy "Members can read their own memberships"
  on public.hub_members
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Hub creators and admins can read all membership rows for their hub.
create policy "Hub creators and admins can read all hub members"
  on public.hub_members
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.hub_members as self
      where self.hub_id = hub_members.hub_id
        and self.user_id = auth.uid()
        and self.role   in ('creator', 'admin')
        and self.status = 'active'
    )
  );

-- Anyone authenticated can insert their own membership row
-- (used when joining a hub or when the app inserts the creator on hub creation)
create policy "Authenticated users can insert their own membership"
  on public.hub_members
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Hub creators and admins can insert membership rows for others
-- (used for inviting members)
create policy "Hub admins can insert membership rows for others"
  on public.hub_members
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.hub_members as self
      where self.hub_id = hub_members.hub_id
        and self.user_id = auth.uid()
        and self.role in ('creator', 'admin')
        and self.status = 'active'
    )
  );

-- Hub creators and admins can update membership rows (role changes, status changes)
create policy "Hub admins can update membership rows"
  on public.hub_members
  for update
  to authenticated
  using (
    exists (
      select 1 from public.hub_members as self
      where self.hub_id = hub_members.hub_id
        and self.user_id = auth.uid()
        and self.role in ('creator', 'admin')
        and self.status = 'active'
    )
  );
