-- One active AI-generated career roadmap per user. Stages/tasks are stored
-- as JSONB rather than a separate milestones table — there's no need to
-- query across users' tasks, so a normalized table would just add joins
-- without buying anything.

create table if not exists public.roadmaps (
  id bigint generated always as identity primary key,
  user_id uuid not null unique references auth.users (id) on delete cascade,
  career_title text not null,
  stages jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.roadmaps enable row level security;

create policy "Users can view their own roadmap"
  on public.roadmaps for select
  using (auth.uid() = user_id);

create policy "Users can create their own roadmap"
  on public.roadmaps for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own roadmap"
  on public.roadmaps for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own roadmap"
  on public.roadmaps for delete
  using (auth.uid() = user_id);
