-- User-controlled preferences for which in-app opportunity alert
-- categories to show, so the alert engine never spams a category the
-- student doesn't want.
alter table public.profiles
  add column if not exists alert_preferences jsonb not null default '{"high_match": true, "deadline": true, "new": true, "funded": true, "remote": true}';
