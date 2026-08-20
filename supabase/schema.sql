-- Renewal Tracker schema for Supabase.
-- Run this once in the Supabase SQL editor (or via `supabase db push`).
-- Accounts are handled entirely by Supabase Auth (auth.users) — no custom
-- users table is needed.

create table if not exists public.renewals (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  category text not null,
  expiry date not null,
  notes text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists renewals_user_id_idx on public.renewals (user_id);

alter table public.renewals enable row level security;

create policy "Users can view their own renewals"
  on public.renewals for select
  using (auth.uid() = user_id);

create policy "Users can insert their own renewals"
  on public.renewals for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own renewals"
  on public.renewals for delete
  using (auth.uid() = user_id);
