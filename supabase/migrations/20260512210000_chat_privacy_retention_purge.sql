-- Chat message retention: only null (indefinite) or 30 / 90 / 365 days.
-- Purge function runs with elevated privileges (scheduled via service role or pg_cron).

do $$
declare
  cname text;
begin
  select con.conname into cname
  from pg_constraint con
  join pg_class rel on rel.oid = con.conrelid
  where rel.relname = 'chat_rooms'
    and con.contype = 'c'
    and pg_get_constraintdef(con.oid) like '%retention_days%'
  limit 1;
  if cname is not null then
    execute format('alter table public.chat_rooms drop constraint %I', cname);
  end if;
end $$;

update public.chat_rooms
set retention_days = null
where retention_days is not null
  and retention_days not in (30, 90, 365);

alter table public.chat_rooms
  add constraint chat_rooms_retention_days_allowed
  check (retention_days is null or retention_days in (30, 90, 365));

comment on column public.chat_rooms.retention_days is
  'null = keep messages indefinitely; 30/90/365 = delete message rows older than this many days (scheduled purge).';

-- Returns number of messages deleted in this invocation (cascades attachments/reactions/polls).
create or replace function public.chat_purge_messages_past_retention(p_limit int default 500)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n int;
begin
  if p_limit is null or p_limit < 1 then
    p_limit := 500;
  end if;
  if p_limit > 5000 then
    p_limit := 5000;
  end if;

  with doomed as (
    select m.id
    from public.chat_messages m
    inner join public.chat_rooms r on r.id = m.room_id
    where r.retention_days is not null
      and m.created_at < (now() - make_interval(0, 0, 0, r.retention_days))
    limit p_limit
  )
  delete from public.chat_messages m
  using doomed d
  where m.id = d.id;

  get diagnostics n = row_count;
  return n;
end;
$$;

revoke all on function public.chat_purge_messages_past_retention(int) from public;
grant execute on function public.chat_purge_messages_past_retention(int) to service_role;

comment on function public.chat_purge_messages_past_retention(int) is
  'Deletes chat_messages past per-room retention_days; call from cron with service role. Batched by p_limit.';
