create table if not exists public.deets (
  id uuid primary key default gen_random_uuid(),
  hub_id uuid not null references public.hubs(id) on delete cascade,
  author_name text not null,
  title text not null,
  body text not null,
  kind text not null check (kind in ('Posts', 'Notices', 'Photos')),
  preview_image_url text,
  preview_image_urls text[] not null default '{}',
  attachments jsonb not null default '[]'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists deets_hub_id_created_at_idx on public.deets (hub_id, created_at desc);
create index if not exists deets_created_at_idx on public.deets (created_at desc);

create or replace function public.set_deets_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists deets_set_updated_at on public.deets;
create trigger deets_set_updated_at
before update on public.deets
for each row
execute function public.set_deets_updated_at();
