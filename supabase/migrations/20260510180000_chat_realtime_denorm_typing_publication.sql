-- Denormalize room_id onto reactions and votes so Realtime postgres_changes can filter by room.
-- Add chat_room_typing for ephemeral typing signals (RLS + publication).
-- Extend supabase_realtime publication for hub chat live updates.

-- -----------------------------------------------------------------------------
-- chat_message_reactions.room_id
-- -----------------------------------------------------------------------------
alter table public.chat_message_reactions
  add column if not exists room_id uuid references public.chat_rooms(id) on delete cascade;

update public.chat_message_reactions r
set room_id = m.room_id
from public.chat_messages m
where m.id = r.message_id
  and r.room_id is null;

create or replace function public.chat_message_reactions_set_room_id()
returns trigger
language plpgsql
as $$
begin
  select m.room_id into strict new.room_id
  from public.chat_messages m
  where m.id = new.message_id;
  return new;
end;
$$;

drop trigger if exists trg_chat_message_reactions_set_room on public.chat_message_reactions;
create trigger trg_chat_message_reactions_set_room
  before insert or update of message_id on public.chat_message_reactions
  for each row
  execute procedure public.chat_message_reactions_set_room_id();

alter table public.chat_message_reactions
  alter column room_id set not null;

create index if not exists chat_message_reactions_room_id_idx
  on public.chat_message_reactions (room_id);

-- -----------------------------------------------------------------------------
-- chat_poll_votes.room_id
-- -----------------------------------------------------------------------------
alter table public.chat_poll_votes
  add column if not exists room_id uuid references public.chat_rooms(id) on delete cascade;

update public.chat_poll_votes v
set room_id = m.room_id
from public.chat_polls p
join public.chat_messages m on m.id = p.message_id
where p.id = v.poll_id
  and v.room_id is null;

create or replace function public.chat_poll_votes_set_room_id()
returns trigger
language plpgsql
as $$
begin
  select m.room_id into strict new.room_id
  from public.chat_polls p
  join public.chat_messages m on m.id = p.message_id
  where p.id = new.poll_id;
  return new;
end;
$$;

drop trigger if exists trg_chat_poll_votes_set_room on public.chat_poll_votes;
create trigger trg_chat_poll_votes_set_room
  before insert on public.chat_poll_votes
  for each row
  execute procedure public.chat_poll_votes_set_room_id();

alter table public.chat_poll_votes
  alter column room_id set not null;

create index if not exists chat_poll_votes_room_id_idx
  on public.chat_poll_votes (room_id);

-- -----------------------------------------------------------------------------
-- chat_room_typing (ephemeral; members only)
-- -----------------------------------------------------------------------------
create table if not exists public.chat_room_typing (
  room_id uuid not null references public.chat_rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  updated_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

create index if not exists chat_room_typing_room_updated_idx
  on public.chat_room_typing (room_id, updated_at desc);

alter table public.chat_room_typing enable row level security;

grant select, insert, update, delete on public.chat_room_typing to authenticated;

drop policy if exists "chat_room_typing_select_members" on public.chat_room_typing;
create policy "chat_room_typing_select_members"
  on public.chat_room_typing for select to authenticated
  using (
    exists (
      select 1
      from public.chat_room_memberships crm
      where crm.room_id = chat_room_typing.room_id
        and crm.user_id = (select auth.uid())
        and crm.status = 'active'
    )
  );

drop policy if exists "chat_room_typing_insert_self_member" on public.chat_room_typing;
create policy "chat_room_typing_insert_self_member"
  on public.chat_room_typing for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.chat_room_memberships crm
      where crm.room_id = chat_room_typing.room_id
        and crm.user_id = (select auth.uid())
        and crm.status = 'active'
    )
  );

drop policy if exists "chat_room_typing_update_self_member" on public.chat_room_typing;
create policy "chat_room_typing_update_self_member"
  on public.chat_room_typing for update to authenticated
  using (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.chat_room_memberships crm
      where crm.room_id = chat_room_typing.room_id
        and crm.user_id = (select auth.uid())
        and crm.status = 'active'
    )
  )
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.chat_room_memberships crm
      where crm.room_id = chat_room_typing.room_id
        and crm.user_id = (select auth.uid())
        and crm.status = 'active'
    )
  );

drop policy if exists "chat_room_typing_delete_self" on public.chat_room_typing;
create policy "chat_room_typing_delete_self"
  on public.chat_room_typing for delete to authenticated
  using (user_id = (select auth.uid()));

comment on table public.chat_room_typing is 'Ephemeral typing indicators; clients subscribe via Realtime; rows deleted when typing stops.';

-- -----------------------------------------------------------------------------
-- Realtime publication
-- -----------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'chat_message_reactions'
  ) then
    alter publication supabase_realtime add table public.chat_message_reactions;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'chat_poll_votes'
  ) then
    alter publication supabase_realtime add table public.chat_poll_votes;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'chat_room_memberships'
  ) then
    alter publication supabase_realtime add table public.chat_room_memberships;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'chat_room_typing'
  ) then
    alter publication supabase_realtime add table public.chat_room_typing;
  end if;
end $$;
