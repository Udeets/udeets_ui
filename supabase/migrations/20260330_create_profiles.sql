create table if not exists public.profiles (
  id         uuid        primary key references auth.users(id) on delete cascade,
  full_name  text,
  avatar_url text,
  email      text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can read all profiles"
  on public.profiles for select
  to authenticated using (true);

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  to authenticated with check (auth.uid() = id);