-- Lightweight, non-sensitive interaction log (apply clicks, skill views,
-- career picks) used to bias match scoring toward what a student has
-- actually shown interest in. Users can view and clear this from Profile.

create table if not exists public.user_interactions (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in ('apply_click', 'skill_view', 'career_view')),
  target text not null,
  created_at timestamptz not null default now()
);

create index if not exists user_interactions_user_id_idx on public.user_interactions (user_id);

alter table public.user_interactions enable row level security;

create policy "Users can view their own interactions"
  on public.user_interactions for select
  using (auth.uid() = user_id);

create policy "Users can log their own interactions"
  on public.user_interactions for insert
  with check (auth.uid() = user_id);

create policy "Users can clear their own interactions"
  on public.user_interactions for delete
  using (auth.uid() = user_id);
