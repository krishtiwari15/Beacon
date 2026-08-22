-- Smart Onboarding state. Reuses the existing profiles table rather than a
-- new one, per the "don't create duplicate profile systems" rule -- a user
-- has no profiles row at all until onboarding creates one, so
-- onboarding_status only matters once that row exists.
alter table public.profiles
  add column if not exists onboarding_status text not null default 'not_started'
    check (onboarding_status in ('not_started', 'resume_uploaded', 'profile_generated', 'opportunities_shown', 'tutorial_completed', 'completed')),
  add column if not exists onboarding_completed_at timestamptz;

-- Backfill: anyone who already has a profile row existed before Smart
-- Onboarding shipped, so they've effectively already "completed"
-- onboarding by virtue of using Beacon already -- they must never be
-- shown the new flow. Only rows created AFTER this migration runs should
-- ever see the 'not_started' default.
update public.profiles set onboarding_status = 'completed' where onboarding_status = 'not_started';
