-- Lets students list projects they've actually built, so the Application
-- Strategist can recommend which ones to highlight based on real input
-- instead of inventing project history.
alter table public.profiles
  add column if not exists projects text[] not null default '{}';
