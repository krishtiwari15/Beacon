-- The app used to enforce "at most one snapthot per day" by reading the
-- latest row and comparing dates before inserting — a check-then-insert
-- race that two concurrent loads (two tabs, a fast re-render) can both pass
-- before either insert lands, producing duplicate same-day rows and skewing
-- the Weekly Review's before/after delta. A real unique constraint plus an
-- upsert makes this atomic instead.
alter table public.career_health_history
  add column if not exists recorded_date date not null default (now()::date);

create unique index if not exists career_health_history_user_day_idx
  on public.career_health_history (user_id, recorded_date);
