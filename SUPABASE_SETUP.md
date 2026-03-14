# DeedsMaxing Supabase Setup

This file contains everything needed to set up Supabase for this app.

## 1. Run This SQL In Supabase SQL Editor

```sql
-- Extensions
create extension if not exists pgcrypto;

-- USERS TABLE
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  emoji text not null default '🌙',
  city text not null default '',
  total_points integer not null default 0,
  current_streak integer not null default 0,
  best_streak integer not null default 0,
  daily_tasks jsonb,
  quran_progress jsonb,
  last_nights jsonb,
  badges jsonb,
  reflections jsonb,
  niyyah jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- DAILY STATS TABLE
create table if not exists public.daily_stats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  date date not null,
  points_earned integer not null default 0,
  tasks_completed integer not null default 0,
  total_tasks integer not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

-- INDEXES
create index if not exists users_total_points_idx on public.users (total_points desc);
create index if not exists users_city_idx on public.users (city);
create index if not exists daily_stats_user_date_idx on public.daily_stats (user_id, date);

-- updated_at TRIGGER
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_users_updated_at on public.users;
create trigger trg_users_updated_at
before update on public.users
for each row
execute function public.set_updated_at();

-- RLS
alter table public.users enable row level security;
alter table public.daily_stats enable row level security;

-- USERS POLICIES
drop policy if exists "users_select_all" on public.users;
create policy "users_select_all"
on public.users
for select
using (true);

drop policy if exists "users_insert_own" on public.users;
create policy "users_insert_own"
on public.users
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "users_update_own" on public.users;
create policy "users_update_own"
on public.users
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "users_delete_own" on public.users;
create policy "users_delete_own"
on public.users
for delete
to authenticated
using (auth.uid() = id);

-- DAILY_STATS POLICIES
drop policy if exists "daily_stats_select_own" on public.daily_stats;
create policy "daily_stats_select_own"
on public.daily_stats
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "daily_stats_insert_own" on public.daily_stats;
create policy "daily_stats_insert_own"
on public.daily_stats
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "daily_stats_update_own" on public.daily_stats;
create policy "daily_stats_update_own"
on public.daily_stats
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "daily_stats_delete_own" on public.daily_stats;
create policy "daily_stats_delete_own"
on public.daily_stats
for delete
to authenticated
using (auth.uid() = user_id);

-- REALTIME (leaderboard updates)
alter publication supabase_realtime add table public.users;
```

## 2. Auth Provider Settings

- Go to Authentication > Providers
- Enable Email
- Enable Google only if you use Google login

## 3. Add Environment Variables

Copy .env.example to .env and fill:

```env
EXPO_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-google-web-client-id.apps.googleusercontent.com
```

## 4. Quick Verification Queries

Run these to verify setup:

```sql
select tablename
from pg_tables
where schemaname = 'public'
  and tablename in ('users', 'daily_stats');

select policyname, tablename
from pg_policies
where schemaname = 'public'
  and tablename in ('users', 'daily_stats')
order by tablename, policyname;

select * from pg_publication_tables
where pubname = 'supabase_realtime'
  and schemaname = 'public'
  and tablename = 'users';
```
