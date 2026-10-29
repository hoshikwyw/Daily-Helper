-- Lets a weekly rule fire on several days of the week ("Weekdays", or a
-- custom pick such as Mon/Wed/Fri).
--
-- Run this once in the Supabase SQL editor, after 004_habits.sql. New projects
-- get it from schema.sql already. Safe to re-run.

-- 0 = Sunday … 6 = Saturday. When set on a weekly rule it replaces the single
-- `weekday` column; existing rules keep working unchanged with it null.
alter table recurrences
  add column if not exists weekdays smallint[];

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'recurrences_weekdays_check'
  ) then
    alter table recurrences
      add constraint recurrences_weekdays_check
      check (weekdays is null or (array_length(weekdays, 1) between 1 and 7));
  end if;
end $$;

notify pgrst, 'reload schema';

-- Verify (should return one row):
--   select column_name from information_schema.columns
--   where table_name = 'recurrences' and column_name = 'weekdays';
