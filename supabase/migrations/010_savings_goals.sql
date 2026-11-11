-- Savings goals: something to save toward, and which Savings entries count
-- toward it. A contribution is an ordinary money entry in the Savings
-- expense category with `goal_id` set, so the Money ledger stays the single
-- record of what moved, "Money left" still means free to spend, and the My
-- World trigger from 008 awards it exactly as before.
--
-- Run this once in the Supabase SQL editor, after 009. Safe to re-run.

-- 1. One row per goal. Reached goals stay until the person deletes them;
--    deleting one keeps its entries and simply unlinks them (below).
create table if not exists savings_goals (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 60),
  emoji text not null default '🎯',
  target decimal(12,2) not null check (target > 0),
  deadline date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists savings_goals_updated_at on savings_goals;
create trigger savings_goals_updated_at before update on savings_goals
  for each row execute function update_updated_at();

alter table savings_goals enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where tablename = 'savings_goals' and policyname = 'Own data only'
  ) then
    create policy "Own data only" on savings_goals for all using (auth.uid() = user_id);
  end if;
end $$;

-- 2. Which goal a Savings entry feeds. Null for savings with no goal, and
--    for every entry outside the Savings category. The app only counts an
--    entry toward a goal while it is a Savings expense; the column itself
--    is not constrained so retagging an entry can never be refused.
alter table expenses add column if not exists goal_id uuid references savings_goals(id) on delete set null;

create index if not exists expenses_goal_idx on expenses (goal_id) where goal_id is not null;

notify pgrst, 'reload schema';

-- Verify (should return two rows):
--   select table_name, column_name from information_schema.columns
--   where (table_name, column_name) in (('savings_goals', 'target'), ('expenses', 'goal_id'));
