-- Adds monthly spending budgets per expense category.
--
-- Run this once in the Supabase SQL editor, after 002_recurrences.sql. New
-- projects get all of this from schema.sql already. Safe to re-run: every
-- statement is guarded.

-- 1. One row per category per month the limit changes. A month with no row
--    inherits the most recent earlier one (carry-forward happens in the app,
--    in lib/budgets.ts, not by copying rows). An amount of 0 means "no budget
--    from this month on" and stops the carry-forward.
--
--    `month` is always the first day of the month (`YYYY-MM-01`).
create table if not exists budgets (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null,
  month date not null,
  amount decimal(10,2) not null check (amount >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, category, month)
);

-- 2. Housekeeping, matching the other tables.
drop trigger if exists budgets_updated_at on budgets;
create trigger budgets_updated_at before update on budgets
  for each row execute function update_updated_at();

alter table budgets enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where tablename = 'budgets' and policyname = 'Own data only'
  ) then
    create policy "Own data only" on budgets for all using (auth.uid() = user_id);
  end if;
end $$;

-- 3. PostgREST answers from a cached schema; reload it so the table is
--    reachable immediately.
notify pgrst, 'reload schema';

-- Verify (should return one row):
--   select table_name from information_schema.tables where table_name = 'budgets';
