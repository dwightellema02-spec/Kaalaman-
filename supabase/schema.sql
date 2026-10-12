-- Run once in the Supabase SQL editor. Each learner can read and write only their own progress.
create table if not exists public.progress (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.progress enable row level security;

create policy "own progress" on public.progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
