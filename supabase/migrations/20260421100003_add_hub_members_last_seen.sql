-- Add last_seen_at to hub_members so we can render unread dots on hub cards.
-- Set to hub_members.joined timestamp (or now()) so existing memberships start
-- as "seen" and don't immediately show a flood of unread dots.

alter table public.hub_members
  add column if not exists last_seen_at timestamptz;

-- Backfill: treat existing memberships as seen now so the unread dot
-- only lights up for genuinely new activity going forward.
update public.hub_members
set last_seen_at = now()
where last_seen_at is null
  and status = 'active';

-- Helper RPC: returns the set of hub ids for the calling user that have deets
-- newer than the user's last_seen_at on their membership.
create or replace function public.user_hubs_with_unread()
returns table(hub_id uuid)
language sql
stable
security invoker
as $$
  select m.hub_id
  from public.hub_members m
  where m.user_id = auth.uid()
    and m.status = 'active'
    and exists (
      select 1
      from public.deets d
      where d.hub_id = m.hub_id
        and d.created_at > coalesce(m.last_seen_at, 'epoch'::timestamptz)
        and d.created_by is distinct from m.user_id
    );
$$;

grant execute on function public.user_hubs_with_unread() to authenticated;

-- RPC to mark a hub as seen by the current user (called when they open it).
create or replace function public.mark_hub_seen(p_hub_id uuid)
returns void
language sql
security invoker
as $$
  update public.hub_members
  set last_seen_at = now()
  where hub_id = p_hub_id
    and user_id = auth.uid()
    and status = 'active';
$$;

grant execute on function public.mark_hub_seen(uuid) to authenticated;
