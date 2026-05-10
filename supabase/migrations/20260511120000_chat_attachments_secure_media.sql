-- Secure chat attachments: storage_key naming, lifecycle columns, larger bucket for video,
-- storage RLS aligned with renamed column.

-- -----------------------------------------------------------------------------
-- Bucket: private, larger limit, video MIME types
-- -----------------------------------------------------------------------------
update storage.buckets
set
  file_size_limit = 104857600,
  allowed_mime_types = array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/webm',
    'video/quicktime',
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
where id = 'chat-media';

-- -----------------------------------------------------------------------------
-- chat_message_attachments: rename path column, timestamps, soft-delete, media pipeline placeholders
-- -----------------------------------------------------------------------------
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'chat_message_attachments'
      and column_name = 'storage_path'
  ) then
    alter table public.chat_message_attachments rename column storage_path to storage_key;
  end if;
end $$;

alter table public.chat_message_attachments
  add column if not exists created_at timestamptz not null default now();

alter table public.chat_message_attachments
  add column if not exists deleted_at timestamptz;

alter table public.chat_message_attachments
  add column if not exists thumbnail_key text;

alter table public.chat_message_attachments
  add column if not exists video_preview_key text;

alter table public.chat_message_attachments
  add column if not exists exif_stripped_at timestamptz;

comment on column public.chat_message_attachments.storage_key is 'Private object path in chat-media bucket; never returned to API consumers.';
comment on column public.chat_message_attachments.thumbnail_key is 'Future: derivative image key after async thumbnail generation.';
comment on column public.chat_message_attachments.video_preview_key is 'Future: poster or short preview object key.';
comment on column public.chat_message_attachments.exif_stripped_at is 'Future: set when EXIF/metadata strip job completes for images.';

create index if not exists chat_message_attachments_message_deleted_idx
  on public.chat_message_attachments (message_id)
  where deleted_at is null;

-- -----------------------------------------------------------------------------
-- Storage policy: reference storage_key column
-- -----------------------------------------------------------------------------
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
        where a.storage_key = objects.name
          and a.deleted_at is null
          and m.deleted_at is null
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
        where a2.storage_key = objects.name
          and a2.deleted_at is null
          and m2.deleted_at is null
      )
    )
  );
