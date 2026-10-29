-- Adds recurring money entries and tasks.
--
-- Run this once in the Supabase SQL editor. New projects get all of this from
-- schema.sql already. Safe to re-run: every statement is guarded.

-- 1. A rule describes what to create and when. The scheduling columns are
--    shared; the template columns are typed per target, and the CHECK at the
--    bottom makes sure the right set is filled in.
--
--    `every` is the step: 1 = each period, 2 = every second period. The first
--    version of the app always writes 1, but the column is here so "every two
--    weeks" needs no migration later.
create table if not exists recurrences (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  target text not null check (target in ('expense', 'task')),
  cadence text not null check (cadence in ('daily', 'weekly', 'monthly', 'yearly')),
  every integer not null default 1 check (every between 1 and 365),
  -- 0 = Sunday … 6 = Saturday; weekly rules only.
  weekday smallint check (weekday between 0 and 6),
  -- Clamped to the month's length when it is short; monthly and yearly rules.
  day_of_month smallint check (day_of_month between 1 and 31),
  -- 1 = January … 12 = December; yearly rules only.
  month smallint check (month between 1 and 12),
  start_date date not null,
  end_date date,
  -- The next occurrence that has not been created yet. Advanced by the sync.
  next_due date not null,
  active boolean not null default true,

  -- Money template.
  kind text check (kind in ('expense', 'income')),
  amount decimal(10,2) check (amount > 0),
  category text,
  description text,

  -- Task template.
  title text,
  priority text check (priority in ('low', 'medium', 'high', 'urgent')),
  project_id uuid references projects(id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint recurrences_template_check check (
    (target = 'expense' and kind is not null and amount is not null and category is not null)
    or (target = 'task' and title is not null)
  )
);

-- The sync reads "my active rules, earliest next_due first".
create index if not exists recurrences_user_active_idx on recurrences (user_id, active, next_due);

-- 2. Generated rows remember their rule. Deleting a rule keeps the rows and
--    just drops the link.
alter table expenses
  add column if not exists recurrence_id uuid references recurrences(id) on delete set null;

alter table tasks
  add column if not exists recurrence_id uuid references recurrences(id) on delete set null;

-- 3. One row per rule per date. This is what makes the sync safe to run twice,
--    or from two devices at once: the second insert hits the index and is
--    ignored (`on conflict do nothing`).
create unique index if not exists expenses_recurrence_date_key
  on expenses (recurrence_id, date) where recurrence_id is not null;

create unique index if not exists tasks_recurrence_due_key
  on tasks (recurrence_id, due_date) where recurrence_id is not null;

-- 4. Housekeeping, matching the other tables.
drop trigger if exists recurrences_updated_at on recurrences;
create trigger recurrences_updated_at before update on recurrences
  for each row execute function update_updated_at();

alter table recurrences enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where tablename = 'recurrences' and policyname = 'Own data only'
  ) then
    create policy "Own data only" on recurrences for all using (auth.uid() = user_id);
  end if;
end $$;

-- 5. PostgREST answers from a cached schema; reload it so the new table and
--    columns are reachable immediately.
notify pgrst, 'reload schema';

-- Verify (should return three rows):
--   select table_name, column_name
--   from information_schema.columns
--   where column_name = 'recurrence_id' or (table_name = 'recurrences' and column_name = 'next_due');
