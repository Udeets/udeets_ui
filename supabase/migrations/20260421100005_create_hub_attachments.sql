-- Hub-level attachments table: tracks every image (and later, file) attached
-- to a hub regardless of where it came from (DP upload, cover upload, gallery
-- upload, admin doc upload). The UI reads from this table to populate the
-- hub's Photos section and the DP/cover album picker.
--
-- Historically the app code in useHubMediaFlow.ts:66-71 and HubClient.tsx:295
-- already assumed this table existed. Without it, DP/cover uploads never
-- appeared in Photos.

create table if not exists public.attachments (
  id uuid primary key default gen_random_uuid(),
  hub_id uuid not null references public.hubs(id) on delete cascade,
  file_url text not null,
  file_type text not null default 'image'
    check (file_type in ('image', 'file')),
  source text
    check (source in ('dp', 'cover', 'gallery', 'deet', 'admin_upload', 'other')),
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists attachments_hub_id_created_idx
  on public.attachments(hub_id, created_at desc);

create index if not exists attachments_hub_id_type_idx
  on public.attachments(hub_id, file_type);

alter table public.attachments enable row level security;

-- Anyone can read attachments (needed for public hub photo galleries).
drop policy if exists "Anyone can read hub attachments" on public.attachments;
create policy "Anyone can read hub attachments"
  on public.attachments
  for select
  using (true);

-- Hub creators/admins can insert attachments for their hub.
drop policy if exists "Hub admins insert attachments" on public.attachments;
create policy "Hub admins insert attachments"
  on public.attachments
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.hub_members m
      where m.hub_id = attachments.hub_id
        and m.user_id = auth.uid()
        and m.role in ('creator', 'admin')
        and m.status = 'active'
    )
  );

-- Hub creators/admins can delete attachments for their hub.
drop policy if exists "Hub admins delete attachments" on public.attachments;
create policy "Hub admins delete attachments"
  on public.attachments
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.hub_members m
      where m.hub_id = attachments.hub_id
        and m.user_id = auth.uid()
        and m.role in ('creator', 'admin')
        and m.status = 'active'
    )
  );

-- Backfill: seed existing hub DP, cover, and gallery URLs into attachments so
-- the Photos section reflects current state on first load after this migration.
insert into public.attachments (hub_id, file_url, file_type, source)
select h.id, h.dp_image_url, 'image', 'dp'
from public.hubs h
where h.dp_image_url is not null
  and not exists (
    select 1 from public.attachments a
    where a.hub_id = h.id and a.file_url = h.dp_image_url
  );

insert into public.attachments (hub_id, file_url, file_type, source)
select h.id, h.cover_image_url, 'image', 'cover'
from public.hubs h
where h.cover_image_url is not null
  and not exists (
    select 1 from public.attachments a
    where a.hub_id = h.id and a.file_url = h.cover_image_url
  );

insert into public.attachments (hub_id, file_url, file_type, source)
select h.id, unnest(h.gallery_image_urls), 'image', 'gallery'
from public.hubs h
where h.gallery_image_urls is not null
  and cardinality(h.gallery_image_urls) > 0
on conflict do nothing;
