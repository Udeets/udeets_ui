-- Core hubs table. Must run before any migration that references public.hubs
-- (deets, hub_members, backfill, later hub_* tables).

create table if not exists public.hubs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  category text not null,
  tagline text,
  description text,
  city text,
  state text,
  country text,
  cover_image_url text,
  dp_image_url text,
  gallery_image_urls text[] not null default '{}',
  website_url text,
  facebook_url text,
  instagram_url text,
  youtube_url text,
  phone_number text,
  visibility text not null default 'public',
  created_by text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint hubs_slug_key unique (slug)
);

create index if not exists hubs_created_by_idx on public.hubs (created_by);
create index if not exists hubs_slug_idx on public.hubs (lower(slug));

alter table public.hubs enable row level security;

-- Public hub pages need readable hub rows.
create policy "hubs_select_public"
  on public.hubs for select
  to anon, authenticated
  using (true);

create policy "hubs_insert_own"
  on public.hubs for insert
  to authenticated
  with check (auth.uid()::text = created_by);

create policy "hubs_update_own"
  on public.hubs for update
  to authenticated
  using (auth.uid()::text = created_by)
  with check (auth.uid()::text = created_by);
