-- One active career simulation per user. Stored as JSONB (same pattern as
-- roadmaps.stages) since there's no need to query across users' days.
create table if not exists public.career_simulations (
  user_id uuid primary key references auth.users (id) on delete cascade,
  career_title text not null,
  days jsonb not null default '[]',
  compatibility_score int,
  strengths text[],
  challenges text[],
  recommendation text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.career_simulations enable row level security;

create policy "Users can view their own simulation"
  on public.career_simulations for select
  using (auth.uid() = user_id);

create policy "Users can create their own simulation"
  on public.career_simulations for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own simulation"
  on public.career_simulations for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own simulation"
  on public.career_simulations for delete
  using (auth.uid() = user_id);
