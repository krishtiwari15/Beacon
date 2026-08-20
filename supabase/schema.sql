-- Beacon schema for Supabase.
-- Run this once in the Supabase SQL editor (or via `supabase db push`).
-- Accounts are handled entirely by Supabase Auth (auth.users) — no custom
-- users table is needed; password hashing/sessions are Supabase's job now.

-- Drop the leftover table from an earlier, unrelated experiment in this
-- same Supabase project.
drop table if exists public.renewals cascade;

-- ---------- opportunities ----------
-- Public listings (internships, scholarships, jobs, etc). Populated by the
-- collector job. Readable by any signed-in user; only writable by the
-- service role (the collector), never by the client.
create table if not exists public.opportunities (
  id bigint generated always as identity primary key,
  title text not null,
  type text,
  category text,
  organization text,
  location text,
  eligibility text,
  deadline date,
  source_url text,
  tags text[] not null default '{}',
  stipend text,
  difficulty text,
  work_mode text,
  logo_url text,
  created_at timestamptz not null default now()
);

create index if not exists opportunities_type_idx on public.opportunities (type);
create index if not exists opportunities_deadline_idx on public.opportunities (deadline);
create index if not exists opportunities_difficulty_idx on public.opportunities (difficulty);
create index if not exists opportunities_work_mode_idx on public.opportunities (work_mode);

alter table public.opportunities enable row level security;

create policy "Signed-in users can view opportunities"
  on public.opportunities for select
  to authenticated
  using (true);

-- No insert/update/delete policy for opportunities: only the service role
-- (used by the collector, never exposed to the browser) can write here.

-- ---------- saved_opportunities ----------
-- One row per (user, opportunity) the user has bookmarked/tracked.
create table if not exists public.saved_opportunities (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  opportunity_id bigint not null references public.opportunities (id) on delete cascade,
  status text not null default 'saved'
    check (status in ('saved', 'applied', 'interview', 'rejected', 'accepted')),
  saved_at timestamptz not null default now(),
  unique (user_id, opportunity_id)
);

create index if not exists saved_opportunities_user_id_idx on public.saved_opportunities (user_id);

alter table public.saved_opportunities enable row level security;

create policy "Users can view their own saved opportunities"
  on public.saved_opportunities for select
  using (auth.uid() = user_id);

create policy "Users can save opportunities for themselves"
  on public.saved_opportunities for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own saved opportunities"
  on public.saved_opportunities for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can remove their own saved opportunities"
  on public.saved_opportunities for delete
  using (auth.uid() = user_id);

-- ---------- sample data ----------
-- A handful of seed rows so Discover has something to show before the
-- collector (Vercel Cron, added in a later phase) is wired up.
insert into public.opportunities
  (title, type, category, organization, location, eligibility, deadline, source_url, tags, stipend, difficulty, work_mode, logo_url)
values
  ('Frontend Engineering Intern', 'internship', 'Tech', 'Vercel', 'Remote', 'Open to students and recent grads', current_date + interval '21 days', 'https://vercel.com/careers', '{react,typescript,nextjs}', '$3,000/mo', 'Intermediate', 'Remote', 'https://www.google.com/s2/favicons?domain=vercel.com&sz=64'),
  ('Data Science Fellowship', 'fellowship', 'Data', 'Fictional Labs', 'Bengaluru, India', 'Final-year or graduate students in a quantitative field', current_date + interval '10 days', 'https://example.com/fellowship', '{python,ml,statistics}', '₹25,000/mo stipend', 'Advanced', 'Hybrid', ''),
  ('Open Source Hackathon', 'hackathon', 'Tech', 'DevWeekend', 'Remote', 'Open to everyone', current_date + interval '5 days', 'https://example.com/hackathon', '{opensource,teams,weekend}', 'Not specified', 'Beginner', 'Remote', ''),
  ('UX Research Scholarship', 'scholarship', 'Design', 'Design Forward Foundation', 'Global', 'Undergraduate design students', current_date + interval '45 days', 'https://example.com/scholarship', '{ux,research,design}', '$2,000 award', 'Beginner', 'Remote', '')
on conflict do nothing;
