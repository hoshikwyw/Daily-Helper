-- My World: XP for real activity, awarded by the database, never by the app.
--
-- How it works: a trigger on habit_checks (and, in a later migration, on
-- tasks and expenses) inserts one row into game_rewards per completed thing.
-- The row's key is the real-world event (habit + day), so retrying, unchecking
-- and re-checking, or refreshing can never award twice. The browser can only
-- read rewards; totals are a view over them, so nothing can drift. Nothing is
-- ever subtracted: unchecking a habit deletes the check, not the reward.
--
-- Run this once in the Supabase SQL editor, after 006. Safe to re-run.

-- 1. Habits say which part of life they belong to. Default keeps every
--    existing habit as an everyday one.
alter table habits add column if not exists category text not null default 'general';
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'habits_category_check'
  ) then
    alter table habits add constraint habits_category_check
      check (category in ('learning', 'fitness', 'general'));
  end if;
end $$;

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

-- Verify (signed in as yourself, from the app, or in the SQL editor):
--   select * from game_progress;
--   select source_key, category, xp, note from game_rewards order by created_at desc limit 5;
