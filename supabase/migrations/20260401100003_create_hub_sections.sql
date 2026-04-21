-- Custom content sections for hubs
-- Each hub can have multiple custom sections with a title and bullet point items
create table if not exists public.hub_sections (
  id uuid primary key default gen_random_uuid(),
  hub_id uuid not null references public.hubs(id) on delete cascade,
  title text not null,
  position integer not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Items within a custom section (bullet points with optional tag)
create table if not exists public.hub_section_items (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.hub_sections(id) on delete cascade,
  label text not null,
  tag text,  -- predefined tag like 'info', 'hours', 'menu', 'pricing', 'rule', 'highlight', 'link'
  value text, -- optional value or URL
  position integer not null default 0,
  created_at timestamptz not null default now()
);

-- RLS
alter table public.hub_sections enable row level security;
alter table public.hub_section_items enable row level security;

-- Anyone can read sections
create policy "Anyone can read hub sections"
  on public.hub_sections for select using (true);

create policy "Anyone can read section items"
  on public.hub_section_items for select using (true);

-- Only hub creator can insert/update/delete sections
create policy "Hub creator can manage sections"
  on public.hub_sections for all
  using (
    exists (
      select 1 from public.hubs
      where hubs.id = hub_sections.hub_id
        and hubs.created_by = auth.uid()::text
    )
  );

create policy "Hub creator can manage section items"
  on public.hub_section_items for all
  using (
    exists (
      select 1 from public.hub_sections s
      join public.hubs h on h.id = s.hub_id
      where s.id = hub_section_items.section_id
        and h.created_by = auth.uid()::text
    )
  );
