-- Real, user-created team requests (hackathons/projects/competitions/
-- startups/research). Interest is expressed via a message first — no
-- contact info is auto-revealed; only the request owner sees who's
-- interested and what they said.

create table if not exists public.team_requests (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  description text,
  purpose text not null check (purpose in ('hackathon', 'project', 'competition', 'startup', 'research')),
  looking_for text[] not null default '{}',
  skills_offered text[] not null default '{}',
  status text not null default 'open' check (status in ('open', 'closed')),
  created_at timestamptz not null default now()
);

alter table public.team_requests enable row level security;

create policy "Signed-in users can view open team requests"
  on public.team_requests for select
  to authenticated
  using (true);

create policy "Users can create their own team requests"
  on public.team_requests for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own team requests"
  on public.team_requests for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own team requests"
  on public.team_requests for delete
  using (auth.uid() = user_id);

create table if not exists public.team_interests (
  id bigint generated always as identity primary key,
  request_id bigint not null references public.team_requests (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  message text,
  created_at timestamptz not null default now(),
  unique (request_id, user_id)
);

alter table public.team_interests enable row level security;

-- Visible to whoever expressed interest (their own row) and to the
-- request's owner (to see who's interested) — nobody else.
create policy "Interest visible to the interested user and the request owner"
  on public.team_interests for select
  using (
    auth.uid() = user_id
    or auth.uid() = (select tr.user_id from public.team_requests tr where tr.id = team_interests.request_id)
  );

create policy "Users can express interest as themselves"
  on public.team_interests for insert
  with check (auth.uid() = user_id);

create policy "Users can withdraw their own interest"
  on public.team_interests for delete
  using (auth.uid() = user_id);
