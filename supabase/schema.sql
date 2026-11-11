-- Full schema for a NEW Supabase project: paste the whole file into the SQL
-- editor once. Every statement is safe to re-run.
--
-- For an EXISTING project do not use this file to catch up: `create table if
-- not exists` leaves existing tables as they are, so columns added later
-- (recurrence_id, weekdays, …) would be missing. Apply the numbered files in
-- supabase/migrations/ in order instead; each is guarded and re-runnable.

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
  -- Several days a week; replaces `weekday` on a weekly rule when set.
  weekdays smallint[] check (
    weekdays is null
    or (
      cardinality(weekdays) between 1 and 7
      and array_position(weekdays, null) is null
      and weekdays <@ array[0, 1, 2, 3, 4, 5, 6]::smallint[]
    )
  ),
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

-- Monthly spending limits per expense category. A month with no row inherits
-- the most recent earlier one; an amount of 0 switches the budget off from
-- that month on. `month` is always the first of the month. See
-- migrations/003_budgets.sql.
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

-- Daily habits and the days they were done. Archiving a habit keeps its
-- history; streaks are computed in the app from the check dates. See
-- migrations/004_habits.sql.
create table if not exists habits (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  emoji text not null default '✅',
  position integer not null default 0,
  archived boolean not null default false,
  -- Which part of My World the habit feeds (migration 007).
  category text not null default 'general' check (category in ('learning', 'fitness', 'general')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists habit_checks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  habit_id uuid not null references habits(id) on delete cascade,
  date date not null,
  created_at timestamptz not null default now(),
  unique (habit_id, date)
);

create index if not exists habit_checks_user_date_idx on habit_checks (user_id, date);

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

drop trigger if exists budgets_updated_at on budgets;
create trigger budgets_updated_at before update on budgets
  for each row execute function update_updated_at();

drop trigger if exists habits_updated_at on habits;
create trigger habits_updated_at before update on habits
  for each row execute function update_updated_at();

-- Row Level Security
alter table projects enable row level security;
alter table tasks enable row level security;
alter table journal_entries enable row level security;
alter table expenses enable row level security;
alter table expense_categories enable row level security;
alter table recurrences enable row level security;
alter table budgets enable row level security;
alter table habits enable row level security;
alter table habit_checks enable row level security;

drop policy if exists "Own data only" on projects;
create policy "Own data only" on projects for all using (auth.uid() = user_id);
drop policy if exists "Own data only" on tasks;
create policy "Own data only" on tasks for all using (auth.uid() = user_id);
drop policy if exists "Own data only" on journal_entries;
create policy "Own data only" on journal_entries for all using (auth.uid() = user_id);
drop policy if exists "Own data only" on expenses;
create policy "Own data only" on expenses for all using (auth.uid() = user_id);
drop policy if exists "Own data only" on expense_categories;
create policy "Own data only" on expense_categories for all using (auth.uid() = user_id);
drop policy if exists "Own data only" on recurrences;
create policy "Own data only" on recurrences for all using (auth.uid() = user_id);
drop policy if exists "Own data only" on budgets;
create policy "Own data only" on budgets for all using (auth.uid() = user_id);
drop policy if exists "Own data only" on habits;
create policy "Own data only" on habits for all using (auth.uid() = user_id);
-- A check must also point at one of the caller's own habits; see 004_habits.sql.
drop policy if exists "Own data only" on habit_checks;
create policy "Own data only" on habit_checks for all
  using (
    auth.uid() = user_id
    and exists (select 1 from habits h where h.id = habit_id and h.user_id = auth.uid())
  )
  with check (
    auth.uid() = user_id
    and exists (select 1 from habits h where h.id = habit_id and h.user_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- Admin-created accounts. The admin invites an email, the app signs it up,
-- and a trigger rejects any sign-up that was not invited. See
-- migrations/006_admin_users.sql for the full notes and the dashboard setting.
-- ---------------------------------------------------------------------------
create table if not exists admins (
  email text primary key,
  created_at timestamptz not null default now()
);

insert into admins (email) values ('khaingwutyiwin1712@gmail.com')
  on conflict (email) do nothing;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admins a
    where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

grant execute on function public.is_admin() to authenticated;

alter table admins enable row level security;
drop policy if exists "Admins can read admins" on admins;
create policy "Admins can read admins" on admins for select using (public.is_admin());

create table if not exists allowed_users (
  email text primary key,
  note text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table allowed_users enable row level security;
drop policy if exists "Admins manage allowed users" on allowed_users;
create policy "Admins manage allowed users" on allowed_users
  for all using (public.is_admin()) with check (public.is_admin());

create or replace function public.enforce_invited_signup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Invited through the app or the SQL editor.
  if new.email is not null
     and exists (select 1 from public.allowed_users u where lower(u.email) = lower(new.email)) then
    return new;
  end if;
  -- Invited from the Supabase dashboard ("Invite user"): the invitation email
  -- is the gate there, and GoTrue stamps invited_at on those rows.
  if new.invited_at is not null then
    return new;
  end if;
  raise exception 'Sign-ups are by invitation only. Ask the admin to create your account.'
    using errcode = 'P0001';
end;
$$;

drop trigger if exists enforce_invited_signup on auth.users;
create trigger enforce_invited_signup
  before insert on auth.users
  for each row execute function public.enforce_invited_signup();

create or replace function public.admin_list_users()
returns table (
  email text,
  note text,
  invited_at timestamptz,
  signed_up_at timestamptz,
  confirmed_at timestamptz,
  last_sign_in_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select u.email, u.note, u.created_at, au.created_at, au.email_confirmed_at, au.last_sign_in_at
  from public.allowed_users u
  left join auth.users au on lower(au.email) = lower(u.email)
  where public.is_admin()
  order by u.created_at desc;
$$;

revoke all on function public.admin_list_users() from public;
grant execute on function public.admin_list_users() to authenticated;

-- ---------------------------------------------------------------------------
-- My World (migration 007). XP is awarded by triggers; the app only reads.
-- ---------------------------------------------------------------------------

-- 2. One row per rewarded event. No foreign key to the source: a deleted
--    habit takes its checks with it, and the XP already earned stays.
create table if not exists game_rewards (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_type text not null check (source_type in ('habit_check', 'task', 'expense')),
  -- What makes the event unique in the real world, e.g. "<habit id>:<date>".
  source_key text not null,
  category text not null check (category in ('learning', 'fitness', 'savings', 'general')),
  xp integer not null check (xp > 0),
  -- A short label for the history list, captured at award time.
  note text,
  created_at timestamptz not null default now(),
  unique (source_type, source_key)
);

create index if not exists game_rewards_user_created_idx on game_rewards (user_id, created_at desc);

-- Users read their own rewards. There is no insert policy on purpose: only
-- the SECURITY DEFINER trigger functions below write here.
alter table game_rewards enable row level security;
drop policy if exists "Own rewards, read only" on game_rewards;
create policy "Own rewards, read only" on game_rewards for select using (auth.uid() = user_id);

-- 3. Totals, derived. security_invoker makes the policy above apply to the
--    view, so a person sees one row: their own.
create or replace view game_progress with (security_invoker = true) as
  select
    user_id,
    coalesce(sum(xp), 0)::integer as total_xp,
    coalesce(sum(xp) filter (where category = 'learning'), 0)::integer as learning_xp,
    coalesce(sum(xp) filter (where category = 'fitness'), 0)::integer as fitness_xp,
    coalesce(sum(xp) filter (where category = 'savings'), 0)::integer as savings_xp,
    coalesce(sum(xp) filter (where category = 'general'), 0)::integer as general_xp
  from game_rewards
  group by user_id;

grant select on game_progress to authenticated;

-- 4. The reward table. The same numbers live in lib/game.ts for display.
create or replace function public.game_xp_for(category text)
returns integer
language sql
immutable
as $$
  select case category
    when 'learning' then 10
    when 'fitness' then 15
    when 'savings' then 10
    else 5
  end;
$$;

-- 5. A habit check earns its habit's category. AFTER INSERT only: the app's
--    upsert of an existing check is an update and awards nothing, and a
--    check deleted then re-made hits the unique key and awards nothing.
create or replace function public.reward_habit_check()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  h record;
begin
  select name, category into h from habits where id = new.habit_id;
  if h is null then
    return new;
  end if;
  insert into game_rewards (user_id, source_type, source_key, category, xp, note)
  values (
    new.user_id,
    'habit_check',
    new.habit_id::text || ':' || new.date::text,
    h.category,
    game_xp_for(h.category),
    h.name
  )
  on conflict (source_type, source_key) do nothing;
  return new;
end;
$$;

drop trigger if exists reward_habit_check on habit_checks;
create trigger reward_habit_check
  after insert on habit_checks
  for each row execute function public.reward_habit_check();

notify pgrst, 'reload schema';

-- Tasks and savings earn too (migration 008).

-- 1. A task earns when it reaches "done". Keyed by the task id, so reopening
--    and finishing it again awards nothing more. Created-as-done counts too.
create or replace function public.reward_task_done()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status <> 'done' then
    return new;
  end if;
  if tg_op = 'UPDATE' and old.status = 'done' then
    return new;
  end if;
  insert into game_rewards (user_id, source_type, source_key, category, xp, note)
  values (new.user_id, 'task', new.id::text, 'general', game_xp_for('general'), new.title)
  on conflict (source_type, source_key) do nothing;
  return new;
end;
$$;

drop trigger if exists reward_task_done on tasks;
create trigger reward_task_done
  after insert or update of status on tasks
  for each row execute function public.reward_task_done();

-- 2. A money entry in the "Savings" category earns a fixed amount, whatever
--    the sum moved. Keyed by the entry id, so editing the amount or the note
--    later awards nothing more, and editing an older entry into Savings
--    awards once. Only the expense side counts: income named "Savings"
--    (interest, say) is money arriving, not money set aside. Entries made
--    by a recurring rule do not count either; see the function.
create or replace function public.reward_savings_entry()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.kind <> 'expense' or lower(trim(new.category)) <> 'savings' then
    return new;
  end if;
  -- Entries a recurring rule generates are not a decision made today, and
  -- they would otherwise earn on every sync with nobody present.
  if new.recurrence_id is not null then
    return new;
  end if;
  insert into game_rewards (user_id, source_type, source_key, category, xp, note)
  values (
    new.user_id,
    'expense',
    new.id::text,
    'savings',
    game_xp_for('savings'),
    coalesce(nullif(trim(new.description), ''), 'Savings')
  )
  on conflict (source_type, source_key) do nothing;
  return new;
end;
$$;

drop trigger if exists reward_savings_entry on expenses;
create trigger reward_savings_entry
  after insert or update of kind, category on expenses
  for each row execute function public.reward_savings_entry();

notify pgrst, 'reload schema';

-- What a person chooses about their world (migration 009).

-- 1. One row per person, created the first time they customise. A person with
--    no row has the defaults: the sprout, in a world called "My World".
--    avatar_id is not constrained here: the app knows which avatars exist and
--    shows the sprout for any id it does not recognise, so adding an avatar
--    later is an app change, not a migration.
create table if not exists game_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  avatar_id text not null default 'sprout',
  world_name text not null default 'My World'
    check (char_length(trim(world_name)) between 1 and 40),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Housekeeping, matching the other tables.
drop trigger if exists game_profiles_updated_at on game_profiles;
create trigger game_profiles_updated_at before update on game_profiles
  for each row execute function update_updated_at();

alter table game_profiles enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where tablename = 'game_profiles' and policyname = 'Own data only'
  ) then
    create policy "Own data only" on game_profiles for all using (auth.uid() = user_id);
  end if;
end $$;


-- Savings goals (migration 010). A contribution is a Savings entry with goal_id set.

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
