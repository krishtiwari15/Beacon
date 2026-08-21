-- Real mentor directory. Any signed-in Beacon user can register as a
-- mentor via a form; other users can browse/match against real mentors
-- instead of the earlier demo dataset. contact_email is optional and only
-- shown if the mentor chooses to share it, so students can genuinely
-- reach out (no in-app messaging system exists yet).

create table if not exists public.mentors (
  user_id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  role text not null,
  industry text not null,
  skills text[] not null default '{}',
  experience text,
  location text,
  bio text,
  contact_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.mentors enable row level security;

create policy "Signed-in users can view the mentor directory"
  on public.mentors for select
  to authenticated
  using (true);

create policy "Users can create their own mentor listing"
  on public.mentors for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own mentor listing"
  on public.mentors for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own mentor listing"
  on public.mentors for delete
  using (auth.uid() = user_id);
