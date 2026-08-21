-- Career Health snapshots over time, so the Weekly Review can show a real
-- before/after delta instead of inventing one. One row is inserted at most
-- once per day per user (see WeeklyReview component logic).
create table if not exists public.career_health_history (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  score int not null,
  recorded_at timestamptz not null default now()
);

create index if not exists career_health_history_user_id_idx on public.career_health_history (user_id, recorded_at);

alter table public.career_health_history enable row level security;

create policy "Users can view their own health history"
  on public.career_health_history for select
  using (auth.uid() = user_id);

create policy "Users can record their own health history"
  on public.career_health_history for insert
  with check (auth.uid() = user_id);
