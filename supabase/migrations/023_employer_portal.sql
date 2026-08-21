-- Employer Portal (Beacon Phase 3, Stage 1): companies, recruiters, job
-- postings, and applications. A user becomes "employer-side" once they have
-- a recruiters row -- independent of whether they also have a student
-- profiles row, since the same Supabase Auth account space is reused.

create table if not exists public.companies (
  id bigint generated always as identity primary key,
  name text not null,
  website text,
  industry text,
  size text,
  logo_url text,
  description text,
  verification_status text not null default 'unverified' check (verification_status in ('unverified', 'pending', 'verified')),
  verification_notes text,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.companies enable row level security;

create table if not exists public.recruiters (
  id bigint generated always as identity primary key,
  user_id uuid not null unique references auth.users (id) on delete cascade,
  company_id bigint not null references public.companies (id) on delete cascade,
  role text not null default 'recruiter' check (role in ('owner', 'recruiter')),
  full_name text,
  title text,
  created_at timestamptz not null default now()
);

create index if not exists recruiters_company_id_idx on public.recruiters (company_id);

alter table public.recruiters enable row level security;

create policy "Recruiters can view colleagues at their own company"
  on public.recruiters for select
  using (exists (select 1 from public.recruiters r2 where r2.company_id = recruiters.company_id and r2.user_id = auth.uid()));

create policy "Users can create their own recruiter row"
  on public.recruiters for insert
  with check (auth.uid() = user_id);

-- Company existence/verification badge is meant to be visible to students
-- browsing jobs, so read access is open to any signed-in user -- not just
-- the recruiters who belong to it.
create policy "Signed-in users can view companies"
  on public.companies for select
  to authenticated
  using (true);

create policy "Recruiters can update their own company"
  on public.companies for update
  using (exists (select 1 from public.recruiters r where r.company_id = companies.id and r.user_id = auth.uid()))
  with check (exists (select 1 from public.recruiters r where r.company_id = companies.id and r.user_id = auth.uid()));

-- Company rows are only ever created via /api/employer/onboarding (which
-- also creates the owner's recruiters row in the same request), so insert
-- just requires the caller to be the creator -- never a bare open insert.
create policy "Signed-in users can create a company they will own"
  on public.companies for insert
  with check (auth.uid() = created_by);

create table if not exists public.jobs (
  id bigint generated always as identity primary key,
  company_id bigint not null references public.companies (id) on delete cascade,
  posted_by uuid not null references auth.users (id) on delete cascade,
  title text not null,
  type text not null check (type in ('internship', 'job', 'apprenticeship')),
  description text not null,
  required_skills text[] not null default '{}',
  preferred_skills text[] not null default '{}',
  eligibility text,
  experience_level text,
  location text,
  work_mode text,
  compensation text,
  application_deadline date,
  status text not null default 'draft' check (status in ('draft', 'active', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists jobs_company_id_idx on public.jobs (company_id);
create index if not exists jobs_status_idx on public.jobs (status);

alter table public.jobs enable row level security;

-- Active jobs are visible to any signed-in student; a company's own
-- recruiters can also see their draft/closed jobs.
create policy "Signed-in users can view active jobs, or their own company's jobs"
  on public.jobs for select
  to authenticated
  using (status = 'active' or exists (select 1 from public.recruiters r where r.company_id = jobs.company_id and r.user_id = auth.uid()));

create policy "Recruiters can create jobs for their own company"
  on public.jobs for insert
  with check (exists (select 1 from public.recruiters r where r.company_id = jobs.company_id and r.user_id = auth.uid()));

create policy "Recruiters can update their own company's jobs"
  on public.jobs for update
  using (exists (select 1 from public.recruiters r where r.company_id = jobs.company_id and r.user_id = auth.uid()))
  with check (exists (select 1 from public.recruiters r where r.company_id = jobs.company_id and r.user_id = auth.uid()));

create policy "Recruiters can delete their own company's jobs"
  on public.jobs for delete
  using (exists (select 1 from public.recruiters r where r.company_id = jobs.company_id and r.user_id = auth.uid()));

create table if not exists public.job_applications (
  id bigint generated always as identity primary key,
  job_id bigint not null references public.jobs (id) on delete cascade,
  student_user_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'applied' check (status in ('applied', 'shortlisted', 'interview', 'rejected', 'offered', 'hired')),
  recruiter_notes text,
  applied_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (job_id, student_user_id)
);

create index if not exists job_applications_job_id_idx on public.job_applications (job_id);
create index if not exists job_applications_student_idx on public.job_applications (student_user_id);

alter table public.job_applications enable row level security;

create policy "Students can view their own applications"
  on public.job_applications for select
  using (auth.uid() = student_user_id);

create policy "Recruiters can view applications to their own company's jobs"
  on public.job_applications for select
  using (exists (select 1 from public.jobs j join public.recruiters r on r.company_id = j.company_id where j.id = job_applications.job_id and r.user_id = auth.uid()));

create policy "Students can apply as themselves"
  on public.job_applications for insert
  with check (auth.uid() = student_user_id);

create policy "Recruiters can update applications to their own company's jobs"
  on public.job_applications for update
  using (exists (select 1 from public.jobs j join public.recruiters r on r.company_id = j.company_id where j.id = job_applications.job_id and r.user_id = auth.uid()))
  with check (exists (select 1 from public.jobs j join public.recruiters r on r.company_id = j.company_id where j.id = job_applications.job_id and r.user_id = auth.uid()));

create policy "Students can withdraw their own application"
  on public.job_applications for delete
  using (auth.uid() = student_user_id);

-- Consent-by-application: a recruiter may read a student's profile ONLY
-- once that student has applied to one of their company's jobs -- never a
-- blind search over the whole student base. This is an additional
-- permissive policy, OR'd with the existing owner-only / opted-in-public
-- policies on public.profiles from earlier migrations.
create policy "Recruiters can view profiles of students who applied to their jobs"
  on public.profiles for select
  using (
    exists (
      select 1 from public.job_applications ja
      join public.jobs j on j.id = ja.job_id
      join public.recruiters r on r.company_id = j.company_id
      where ja.student_user_id = profiles.user_id and r.user_id = auth.uid()
    )
  );

-- Cached AI candidate-match scores per job, mirrors opportunity_matches.
create table if not exists public.job_candidate_matches (
  id bigint generated always as identity primary key,
  job_id bigint not null references public.jobs (id) on delete cascade,
  student_user_id uuid not null references auth.users (id) on delete cascade,
  score int not null check (score >= 0 and score <= 100),
  explanation text,
  computed_at timestamptz not null default now(),
  unique (job_id, student_user_id)
);

create index if not exists job_candidate_matches_job_id_idx on public.job_candidate_matches (job_id);

alter table public.job_candidate_matches enable row level security;

create policy "Recruiters can view candidate matches for their own company's jobs"
  on public.job_candidate_matches for select
  using (exists (select 1 from public.jobs j join public.recruiters r on r.company_id = j.company_id where j.id = job_candidate_matches.job_id and r.user_id = auth.uid()));

create policy "Recruiters can upsert candidate matches for their own company's jobs"
  on public.job_candidate_matches for insert
  with check (exists (select 1 from public.jobs j join public.recruiters r on r.company_id = j.company_id where j.id = job_candidate_matches.job_id and r.user_id = auth.uid()));

create policy "Recruiters can update candidate matches for their own company's jobs"
  on public.job_candidate_matches for update
  using (exists (select 1 from public.jobs j join public.recruiters r on r.company_id = j.company_id where j.id = job_candidate_matches.job_id and r.user_id = auth.uid()))
  with check (exists (select 1 from public.jobs j join public.recruiters r on r.company_id = j.company_id where j.id = job_candidate_matches.job_id and r.user_id = auth.uid()));

-- One Recruiter Copilot conversation thread per recruiter (not per
-- company), same JSONB-message-array pattern as ai_conversations.
create table if not exists public.recruiter_conversations (
  user_id uuid primary key references auth.users (id) on delete cascade,
  messages jsonb not null default '[]',
  updated_at timestamptz not null default now()
);

alter table public.recruiter_conversations enable row level security;

create policy "Recruiters can view their own copilot conversation"
  on public.recruiter_conversations for select
  using (auth.uid() = user_id);

create policy "Recruiters can create their own copilot conversation"
  on public.recruiter_conversations for insert
  with check (auth.uid() = user_id);

create policy "Recruiters can update their own copilot conversation"
  on public.recruiter_conversations for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
