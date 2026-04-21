alter table public.deets enable row level security;

drop policy if exists "Authenticated users can read deets" on public.deets;
create policy "Authenticated users can read deets"
on public.deets
for select
to authenticated
using (auth.uid() is not null);

drop policy if exists "Authenticated users can insert their own deets" on public.deets;
create policy "Authenticated users can insert their own deets"
on public.deets
for insert
to authenticated
with check (
  auth.uid() is not null
  and created_by = auth.uid()
);
