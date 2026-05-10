-- Keyset pagination for chat_messages (created_at desc, id desc). RLS applies (security invoker).

create or replace function public.chat_messages_page(
  p_room_id uuid,
  p_limit int,
  p_cursor_id uuid default null
)
returns setof public.chat_messages
language sql
stable
security invoker
set search_path = public
as $$
  with boundary as (
    select created_at as c_at, id as c_id
    from public.chat_messages
    where p_cursor_id is not null
      and id = p_cursor_id
      and room_id = p_room_id
  )
  select m.*
  from public.chat_messages m
  where m.room_id = p_room_id
    and (
      p_cursor_id is null
      or exists (
        select 1 from boundary b
        where m.created_at < b.c_at
           or (m.created_at = b.c_at and m.id < b.c_id)
      )
    )
  order by m.created_at desc, m.id desc
  limit greatest(1, least(coalesce(p_limit, 30), 100));
$$;

grant execute on function public.chat_messages_page(uuid, int, uuid) to authenticated;
