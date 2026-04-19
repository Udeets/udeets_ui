-- Create hub_invitations table for hub-to-user invite flow.
-- Invitee = the user being invited; invited_by = the admin/creator sending the invite.

create table if not exists public.hub_invitations (
  id uuid primary key default gen_random_uuid(),
  hub_id uuid not null references public.hubs(id) on delete cascade,
  invited_user_id uuid not null references auth.users(id) on delete cascade,
  invited_by uuid references auth.users(id) on delete set null,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined', 'revoked')),
  created_at timestamptz not null default now(),
  responded_at timestamptz
);

-- Only one open invitation per (hub, user).
create unique index if not exists hub_invitations_unique_pending
  on public.hub_invitations(hub_id, invited_user_id)
  where status = 'pending';

create index if not exists hub_invitations_invitee_idx
  on public.hub_invitations(invited_user_id, status);

create index if not exists hub_invitations_hub_idx
  on public.hub_invitations(hub_id, status);

-- Enable RLS.
alter table public.hub_invitations enable row level security;

-- Invitee can read their own invitations.
drop policy if exists "Invitee reads own invitations" on public.hub_invitations;
create policy "Invitee reads own invitations"
  on public.hub_invitations
  for select
  using (invited_user_id = auth.uid());

-- Hub admins/creators can read invitations for their hub.
drop policy if exists "Hub admins read invitations" on public.hub_invitations;
create policy "Hub admins read invitations"
  on public.hub_invitations
  for select
  using (
    exists (
      select 1 from public.hub_members m
      where m.hub_id = hub_invitations.hub_id
        and m.user_id = auth.uid()
        and m.role in ('creator', 'admin')
        and m.status = 'active'
    )
  );

-- Invitee can update status (accept/decline).
drop policy if exists "Invitee responds to own invitation" on public.hub_invitations;
create policy "Invitee responds to own invitation"
  on public.hub_invitations
  for update
  using (invited_user_id = auth.uid())
  with check (
    invited_user_id = auth.uid()
    and status in ('accepted', 'declined')
  );

-- Hub admins/creators can insert invitations for their hub.
drop policy if exists "Hub admins create invitations" on public.hub_invitations;
create policy "Hub admins create invitations"
  on public.hub_invitations
  for insert
  with check (
    invited_by = auth.uid()
    and exists (
      select 1 from public.hub_members m
      where m.hub_id = hub_invitations.hub_id
        and m.user_id = auth.uid()
        and m.role in ('creator', 'admin')
        and m.status = 'active'
    )
  );

-- Hub admins/creators can revoke (update to 'revoked') invitations they issued.
drop policy if exists "Hub admins revoke invitations" on public.hub_invitations;
create policy "Hub admins revoke invitations"
  on public.hub_invitations
  for update
  using (
    exists (
      select 1 from public.hub_members m
      where m.hub_id = hub_invitations.hub_id
        and m.user_id = auth.uid()
        and m.role in ('creator', 'admin')
        and m.status = 'active'
    )
  )
  with check (status = 'revoked');
