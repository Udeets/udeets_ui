-- Per-user chat room read cursors (chat unread red dot).
-- Safe to re-run (IF NOT EXISTS / guarded constraints).

create table if not exists public."chat_room_read_state" (
  "user_id" uuid not null,
  "room_id" uuid not null,
  "last_read_message_id" uuid,
  "last_read_at" timestamp with time zone not null
);

create index if not exists "ix_chat_room_read_state_room_id"
  on public."chat_room_read_state" ("room_id");

do $$
begin
  if not exists (
    select 1
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'chat_room_read_state'
      and con.conname = 'chat_room_read_state_pkey'
  ) then
    alter table public."chat_room_read_state"
      add constraint "chat_room_read_state_pkey" primary key (user_id, room_id);
  end if;
end $$;
