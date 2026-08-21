-- Opt-in public profile page. Off by default — a student must explicitly
-- enable it before any of their profile data is visible to non-owners.
alter table public.profiles
  add column if not exists public_profile boolean not null default false;

-- Additional permissive policy (OR'd with the existing owner-only one):
-- anyone (including signed-out visitors) can read a profile row ONLY when
-- the owner has opted in.
create policy "Anyone can view opted-in public profiles"
  on public.profiles for select
  using (public_profile = true);
