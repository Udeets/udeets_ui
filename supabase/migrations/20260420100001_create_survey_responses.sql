-- Survey responses: one row per (deet, user, question); full replace on each submit.
create table if not exists public.survey_responses (
  id uuid primary key default gen_random_uuid(),
  deet_id uuid not null references public.deets(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  question_index int not null,
  option_index int not null,
  fingerprint text not null,
  created_at timestamptz not null default now(),
  unique (deet_id, user_id, question_index)
);

create index if not exists idx_survey_responses_deet_id on public.survey_responses(deet_id);
create index if not exists idx_survey_responses_user_deet on public.survey_responses(user_id, deet_id);

alter table public.survey_responses enable row level security;

create policy "Anyone can read survey responses"
  on public.survey_responses for select
  using (true);

create policy "Users can insert own survey responses"
  on public.survey_responses for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own survey responses"
  on public.survey_responses for delete
  using (auth.uid() = user_id);
