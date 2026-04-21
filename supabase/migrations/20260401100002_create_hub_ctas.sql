-- Create hub_ctas table for editable CTA buttons on hub pages
create table if not exists public.hub_ctas (
  id uuid primary key default gen_random_uuid(),
  hub_id text not null,
  label text not null,
  action_type text not null default 'url',
  action_value text not null default '',
  position integer not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for fast lookup by hub
create index if not exists idx_hub_ctas_hub_id on public.hub_ctas(hub_id);

-- Enable RLS
alter table public.hub_ctas enable row level security;

-- Anyone can read CTAs (they're displayed publicly on hub pages)
drop policy if exists "hub_ctas_select" on public.hub_ctas;
create policy "hub_ctas_select" on public.hub_ctas
  for select using (true);

-- Only the hub creator can insert/update/delete CTAs
drop policy if exists "hub_ctas_insert" on public.hub_ctas;
create policy "hub_ctas_insert" on public.hub_ctas
  for insert with check (
    exists (
      select 1 from public.hubs
      where hubs.id::text = hub_ctas.hub_id
        and hubs.created_by = auth.uid()::text
    )
  );

drop policy if exists "hub_ctas_update" on public.hub_ctas;
create policy "hub_ctas_update" on public.hub_ctas
  for update using (
    exists (
      select 1 from public.hubs
      where hubs.id::text = hub_ctas.hub_id
        and hubs.created_by = auth.uid()::text
    )
  );

drop policy if exists "hub_ctas_delete" on public.hub_ctas;
create policy "hub_ctas_delete" on public.hub_ctas
  for delete using (
    exists (
      select 1 from public.hubs
      where hubs.id::text = hub_ctas.hub_id
        and hubs.created_by = auth.uid()::text
    )
  );
