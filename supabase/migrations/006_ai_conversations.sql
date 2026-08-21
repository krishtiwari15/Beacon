-- One conversation thread per user with the Career Copilot. Stored as a
-- JSONB message array (same pattern as roadmaps.stages) since there's no
-- need to query across users' messages.

create table if not exists public.ai_conversations (
  user_id uuid primary key references auth.users (id) on delete cascade,
  messages jsonb not null default '[]',
  updated_at timestamptz not null default now()
);

alter table public.ai_conversations enable row level security;

create policy "Users can view their own conversation"
  on public.ai_conversations for select
  using (auth.uid() = user_id);

create policy "Users can create their own conversation"
  on public.ai_conversations for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own conversation"
  on public.ai_conversations for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can clear their own conversation"
  on public.ai_conversations for delete
  using (auth.uid() = user_id);
