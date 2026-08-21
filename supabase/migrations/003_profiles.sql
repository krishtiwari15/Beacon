-- Student profile ("Beacon Career Twin" foundation). One row per user,
-- persists what used to be re-typed into the Eligibility/Copilot/Resume
-- forms on every single use.

create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  education text,
  skills text[] not null default '{}',
  interests text,
  career_goal text,
  location text,
  work_mode text,
  age text,
  cgpa text,
  country text,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = user_id);

create policy "Users can create their own profile"
  on public.profiles for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
