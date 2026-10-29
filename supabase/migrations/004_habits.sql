-- Adds daily habits with per-day checks.
--
-- Run this once in the Supabase SQL editor, after 003_budgets.sql. New
-- projects get all of this from schema.sql already. Safe to re-run: every
-- statement is guarded.

-- 1. What the user is trying to do every day. Archiving keeps the history;
--    `position` is the order of the chips on the Today page.
create table if not exists habits (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  emoji text not null default '✅',
  position integer not null default 0,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. One row per habit per day it was done. Checking inserts, unchecking
--    deletes, so there is no state to reconcile. Streaks are computed from
--    these dates in the app (lib/habits.ts), never stored.
create table if not exists habit_checks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  habit_id uuid not null references habits(id) on delete cascade,
  date date not null,
  created_at timestamptz not null default now(),
  unique (habit_id, date)
);

-- The Today page reads "my checks in the last N days".
create index if not exists habit_checks_user_date_idx on habit_checks (user_id, date);

-- 3. Housekeeping, matching the other tables.
drop trigger if exists habits_updated_at on habits;
create trigger habits_updated_at before update on habits
  for each row execute function update_updated_at();

alter table habits enable row level security;
alter table habit_checks enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where tablename = 'habits' and policyname = 'Own data only'
  ) then
    create policy "Own data only" on habits for all using (auth.uid() = user_id);
  end if;
  if not exists (
    select 1 from pg_policies where tablename = 'habit_checks' and policyname = 'Own data only'
  ) then
    create policy "Own data only" on habit_checks for all using (auth.uid() = user_id);
  end if;
end $$;

-- 4. PostgREST answers from a cached schema; reload it so the tables are
--    reachable immediately.
notify pgrst, 'reload schema';

-- Verify (should return two rows):
--   select table_name from information_schema.tables
--   where table_name in ('habits', 'habit_checks');
