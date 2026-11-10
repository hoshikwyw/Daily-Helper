-- My World, part three: the one thing a person chooses about their world,
-- stored. Everything else (XP, level, unlocks, achievements) is derived from
-- game_rewards and never written by the app.
--
-- Run this once in the Supabase SQL editor, after 008. Safe to re-run.

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

notify pgrst, 'reload schema';

-- Verify (should return one row):
--   select table_name from information_schema.tables where table_name = 'game_profiles';
