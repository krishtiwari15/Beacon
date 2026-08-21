-- Opportunity-level (not per-user) intelligence: Quality Score is computed
-- once per opportunity by AI and cached here, since it doesn't depend on
-- who's looking at it — unlike Match Score, which is per-student.

alter table public.opportunities
  add column if not exists quality_score int check (quality_score is null or (quality_score >= 0 and quality_score <= 100)),
  add column if not exists quality_summary text,
  add column if not exists quality_reasons jsonb,
  add column if not exists quality_computed_at timestamptz;
