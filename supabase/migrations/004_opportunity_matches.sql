-- Cached AI match scores, one row per (user, opportunity). Computed on
-- demand (see /api/match-scores) rather than recalculated on every page
-- load, so Discover/Tracker can just read this table instead of calling
-- the AI every render.

create table if not exists public.opportunity_matches (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  opportunity_id bigint not null references public.opportunities (id) on delete cascade,
  score int not null check (score >= 0 and score <= 100),
  computed_at timestamptz not null default now(),
  unique (user_id, opportunity_id)
);

create index if not exists opportunity_matches_user_id_idx on public.opportunity_matches (user_id);

alter table public.opportunity_matches enable row level security;

create policy "Users can view their own match scores"
  on public.opportunity_matches for select
  using (auth.uid() = user_id);

create policy "Users can upsert their own match scores"
  on public.opportunity_matches for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own match scores"
  on public.opportunity_matches for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
