create extension if not exists "uuid-ossp";

create table if not exists projects (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  status text not null default 'active' check (status in ('active', 'paused', 'completed', 'archived')),
  color text not null default '#6366f1',
  tech_stack text[] not null default '{}',
  repository_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Recurring rules for money entries and tasks. The scheduling columns are
-- shared; the template columns are typed per target. See
-- migrations/002_recurrences.sql for the column-by-column notes.
create table if not exists recurrences (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  target text not null check (target in ('expense', 'task')),
  cadence text not null check (cadence in ('daily', 'weekly', 'monthly', 'yearly')),
  every integer not null default 1 check (every between 1 and 365),
  weekday smallint check (weekday between 0 and 6),
  day_of_month smallint check (day_of_month between 1 and 31),
  month smallint check (month between 1 and 12),
  start_date date not null,
  end_date date,
  next_due date not null,
  active boolean not null default true,
  kind text check (kind in ('expense', 'income')),
  amount decimal(10,2) check (amount > 0),
  category text,
  description text,
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

create index if not exists recurrences_user_active_idx on recurrences (user_id, active, next_due);

create table if not exists tasks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'done')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  project_id uuid references projects(id) on delete set null,
  due_date date,
  completed_at timestamptz,
  -- Set when a recurring rule created the task; the rule may be deleted later.
  recurrence_id uuid references recurrences(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One task per rule per due date, so the recurrence sync can never double up.
create unique index if not exists tasks_recurrence_due_key
  on tasks (recurrence_id, due_date);

create table if not exists journal_entries (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  content text not null default '',
  mood text check (mood in ('great', 'good', 'okay', 'bad', 'terrible')),
  highlights text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, date)
);

-- Money entries: one row is either money out ('expense') or money in
-- ('income'). `amount` is always positive; `kind` carries the sign.
--
-- `category` is intentionally unconstrained: the valid set is per-user and
-- lives in expense_categories, so a CHECK here would reject custom categories.
create table if not exists expenses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null default 'expense' check (kind in ('expense', 'income')),
  amount decimal(10,2) not null check (amount > 0),
  category text not null default 'Other',
  description text,
  date date not null default current_date,
  -- Set when a recurring rule created the entry; the rule may be deleted later.
  recurrence_id uuid references recurrences(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists expenses_user_date_idx on expenses (user_id, date);

-- One entry per rule per date, so the recurrence sync can never double up.
create unique index if not exists expenses_recurrence_date_key
  on expenses (recurrence_id, date);

-- A category belongs to one side of the ledger, so "Other" can exist as both
-- an expense and an income category.
create table if not exists expense_categories (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null default 'expense' check (kind in ('expense', 'income')),
  name text not null,
  color text not null default '#64748b',
  created_at timestamptz not null default now(),
  unique (user_id, kind, name)
);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists projects_updated_at on projects;
create trigger projects_updated_at before update on projects
  for each row execute function update_updated_at();

drop trigger if exists tasks_updated_at on tasks;
create trigger tasks_updated_at before update on tasks
  for each row execute function update_updated_at();

drop trigger if exists journal_entries_updated_at on journal_entries;
create trigger journal_entries_updated_at before update on journal_entries
  for each row execute function update_updated_at();

drop trigger if exists expenses_updated_at on expenses;
create trigger expenses_updated_at before update on expenses
  for each row execute function update_updated_at();

drop trigger if exists recurrences_updated_at on recurrences;
create trigger recurrences_updated_at before update on recurrences
  for each row execute function update_updated_at();

-- Row Level Security
alter table projects enable row level security;
alter table tasks enable row level security;
alter table journal_entries enable row level security;
alter table expenses enable row level security;
alter table expense_categories enable row level security;
alter table recurrences enable row level security;

create policy "Own data only" on projects for all using (auth.uid() = user_id);
create policy "Own data only" on tasks for all using (auth.uid() = user_id);
create policy "Own data only" on journal_entries for all using (auth.uid() = user_id);
create policy "Own data only" on expenses for all using (auth.uid() = user_id);
create policy "Own data only" on expense_categories for all using (auth.uid() = user_id);
create policy "Own data only" on recurrences for all using (auth.uid() = user_id);
