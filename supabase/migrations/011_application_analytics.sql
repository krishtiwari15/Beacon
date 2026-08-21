-- Expands the application pipeline to a real funnel (Applications ->
-- Assessments -> Interviews -> Shortlists -> Offers), and adds optional
-- rejection-analysis fields the student can fill in themselves. Beacon
-- never infers a rejection reason on its own — only what the student
-- actually reports.

alter table public.saved_opportunities
  drop constraint if exists saved_opportunities_status_check;

alter table public.saved_opportunities
  add constraint saved_opportunities_status_check
  check (status in ('saved', 'applied', 'assessment', 'interview', 'shortlisted', 'accepted', 'rejected'));

alter table public.saved_opportunities
  add column if not exists rejection_stage text check (rejection_stage is null or rejection_stage in ('applied', 'assessment', 'interview', 'shortlisted')),
  add column if not exists rejection_reason text,
  add column if not exists interview_feedback text,
  add column if not exists recruiter_feedback text;
