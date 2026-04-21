-- Hub cover, hub profile (DP), and gallery uploads (see lib/services/hubs/upload-hub-media.ts).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'hub-media',
  'hub-media',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Paths are `{auth.uid()}/{hub-slug}/{dp|cover|gallery}-...` — restrict writes to the uploader's folder.
drop policy if exists "Users can upload hub media to own folder" on storage.objects;
create policy "Users can upload hub media to own folder"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'hub-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can update hub media in own folder" on storage.objects;
create policy "Users can update hub media in own folder"
on storage.objects for update
to authenticated
using (
  bucket_id = 'hub-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Public hub media read access" on storage.objects;
create policy "Public hub media read access"
on storage.objects for select
to public
using (bucket_id = 'hub-media');
