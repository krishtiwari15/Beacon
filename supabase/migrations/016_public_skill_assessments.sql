-- Lets anonymous visitors to a public profile page see that student's
-- skill assessment scores — scoped strictly to profiles that have opted
-- into public_profile, never exposed otherwise.
create policy "Anyone can view assessment scores for opted-in public profiles"
  on public.skill_assessments for select
  using (
    exists (
      select 1 from public.profiles p
      where p.user_id = skill_assessments.user_id
        and p.public_profile = true
    )
  );
