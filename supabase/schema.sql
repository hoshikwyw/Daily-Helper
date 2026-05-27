create extension if not exists "uuid-ossp";

create table if not exists projects (
  id uuid primary key default uuid_generate_v4(),
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

create table if not exists tasks (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'done')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  project_id uuid references projects(id) on delete set null,
  due_date date,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists journal_entries (
  id uuid primary key default uuid_generate_v4(),
  date date not null unique,
  content text not null default '',
  mood text check (mood in ('great', 'good', 'okay', 'bad', 'terrible')),
  highlights text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists expenses (
  id uuid primary key default uuid_generate_v4(),
  amount decimal(10,2) not null check (amount > 0),
  category text not null default 'Other' check (category in (
    'Food & Drink', 'Transport', 'Shopping', 'Entertainment',
    'Health', 'Utilities', 'Education', 'Housing', 'Other'
  )),
  description text,
  date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger projects_updated_at before update on projects
  for each row execute function update_updated_at();

create trigger tasks_updated_at before update on tasks
  for each row execute function update_updated_at();

create trigger journal_entries_updated_at before update on journal_entries
  for each row execute function update_updated_at();

create trigger expenses_updated_at before update on expenses
  for each row execute function update_updated_at();
