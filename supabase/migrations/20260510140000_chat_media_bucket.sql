-- Private bucket for chat attachments; object path prefix must be auth.uid() (see storage policies).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'chat-media',
  'chat-media',
  false,
  15728640,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'application/zip'
  ]::text[]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "chat_media_insert_own_prefix" on storage.objects;
create policy "chat_media_insert_own_prefix"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'chat-media'
    and split_part(name, '/', 1) = auth.uid()::text
  );

drop policy if exists "chat_media_select_own_prefix" on storage.objects;
drop policy if exists "chat_media_select_room_member" on storage.objects;
create policy "chat_media_select_room_member"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'chat-media'
    and (
      exists (
        select 1
        from public.chat_message_attachments a
        join public.chat_messages m on m.id = a.message_id
        join public.chat_room_memberships crm
          on crm.room_id = m.room_id
         and crm.user_id = auth.uid()
         and crm.status = 'active'
        where a.storage_path = objects.name
      )
      or exists (
        select 1
        from public.chat_message_attachments a2
        join public.chat_messages m2 on m2.id = a2.message_id
        join public.chat_rooms r on r.id = m2.room_id
        join public.hub_members hm
          on hm.hub_id = r.hub_id
         and hm.user_id = auth.uid()
         and hm.status = 'active'
         and hm.role in ('creator', 'admin')
        where a2.storage_path = objects.name
      )
    )
  );

drop policy if exists "chat_media_delete_own_prefix" on storage.objects;
create policy "chat_media_delete_own_prefix"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'chat-media'
    and split_part(name, '/', 1) = auth.uid()::text
  );
