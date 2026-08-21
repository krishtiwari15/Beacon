-- Informal, unproctored skill self-assessments. Explicitly never presented
-- as an official certification anywhere in the UI.
create table if not exists public.skill_assessments (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  skill text not null,
  score int not null check (score >= 0 and score <= 100),
  taken_at timestamptz not null default now()
);

create index if not exists skill_assessments_user_id_idx on public.skill_assessments (user_id);

alter table public.skill_assessments enable row level security;

create policy "Users can view their own assessment results"
  on public.skill_assessments for select
  using (auth.uid() = user_id);

create policy "Users can record their own assessment results"
  on public.skill_assessments for insert
  with check (auth.uid() = user_id);
