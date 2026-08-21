-- Student Community: posts, comments, reactions, saves, reports. Real
-- moderation levers, not decorative buttons: posting goes through a
-- server-enforced rate limit (see /api/community/posts), and a post is
-- automatically hidden once it accumulates enough reports.

create table if not exists public.community_posts (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  category text not null check (category in ('careers', 'coding', 'data', 'design', 'business', 'research', 'entrepreneurship', 'study_abroad', 'scholarships', 'hackathons')),
  title text not null,
  body text not null,
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists community_posts_category_idx on public.community_posts (category);

alter table public.community_posts enable row level security;

create policy "Signed-in users can view visible posts, or their own hidden ones"
  on public.community_posts for select
  to authenticated
  using (not hidden or auth.uid() = user_id);

create policy "Users can create their own posts"
  on public.community_posts for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own posts"
  on public.community_posts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own posts"
  on public.community_posts for delete
  using (auth.uid() = user_id);

create table if not exists public.community_comments (
  id bigint generated always as identity primary key,
  post_id bigint not null references public.community_posts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists community_comments_post_id_idx on public.community_comments (post_id);

alter table public.community_comments enable row level security;

create policy "Signed-in users can view comments"
  on public.community_comments for select
  to authenticated
  using (true);

create policy "Users can create their own comments"
  on public.community_comments for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own comments"
  on public.community_comments for delete
  using (auth.uid() = user_id);

create table if not exists public.community_reactions (
  id bigint generated always as identity primary key,
  post_id bigint not null references public.community_posts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

alter table public.community_reactions enable row level security;

create policy "Signed-in users can view reactions"
  on public.community_reactions for select
  to authenticated
  using (true);

create policy "Users can react as themselves"
  on public.community_reactions for insert
  with check (auth.uid() = user_id);

create policy "Users can remove their own reaction"
  on public.community_reactions for delete
  using (auth.uid() = user_id);

create table if not exists public.community_saves (
  id bigint generated always as identity primary key,
  post_id bigint not null references public.community_posts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

alter table public.community_saves enable row level security;

create policy "Users can view their own saves"
  on public.community_saves for select
  using (auth.uid() = user_id);

create policy "Users can save posts as themselves"
  on public.community_saves for insert
  with check (auth.uid() = user_id);

create policy "Users can remove their own save"
  on public.community_saves for delete
  using (auth.uid() = user_id);

create table if not exists public.community_reports (
  id bigint generated always as identity primary key,
  post_id bigint not null references public.community_posts (id) on delete cascade,
  reporter_id uuid not null references auth.users (id) on delete cascade,
  reason text,
  created_at timestamptz not null default now(),
  unique (post_id, reporter_id)
);

alter table public.community_reports enable row level security;

create policy "Users can view their own reports"
  on public.community_reports for select
  using (auth.uid() = reporter_id);

create policy "Users can report as themselves"
  on public.community_reports for insert
  with check (auth.uid() = reporter_id);
