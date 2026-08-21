-- Public opportunity count for the logged-out landing page.
-- Row-level security on public.opportunities requires `authenticated`, so an
-- anonymous visitor can't SELECT it directly. This function returns only a
-- count (no row data), bypassing RLS safely via SECURITY DEFINER, and is
-- callable by anon so the landing hero can show a real, honest number.

create or replace function public.opportunity_count()
returns bigint
language sql
security definer
set search_path = public
stable
as $$
  select count(*) from public.opportunities;
$$;

grant execute on function public.opportunity_count() to anon, authenticated;
