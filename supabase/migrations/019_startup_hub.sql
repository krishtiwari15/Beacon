-- Separate from career roadmaps.stages (which is a singleton per user) —
-- a student may want a career roadmap AND a startup plan simultaneously.
create table if not exists public.startup_roadmaps (
  user_id uuid primary key references auth.users (id) on delete cascade,
  idea_title text not null,
  stages jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.startup_roadmaps enable row level security;

create policy "Users can view their own startup plan"
  on public.startup_roadmaps for select
  using (auth.uid() = user_id);

create policy "Users can create their own startup plan"
  on public.startup_roadmaps for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own startup plan"
  on public.startup_roadmaps for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own startup plan"
  on public.startup_roadmaps for delete
  using (auth.uid() = user_id);
