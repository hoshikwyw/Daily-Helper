-- Lets a weekly rule fire on several days of the week ("Weekdays", or a
-- custom pick such as Mon/Wed/Fri).
--
-- Run this once in the Supabase SQL editor, after 004_habits.sql. New projects
-- get it from schema.sql already. Safe to re-run: the constraint is replaced,
-- so an earlier, looser version of this file is upgraded too.

-- 0 = Sunday … 6 = Saturday. When set on a weekly rule it replaces the single
-- `weekday` column; existing rules keep working unchanged with it null.
alter table recurrences
  add column if not exists weekdays smallint[];

-- One to seven distinct days, each 0-6, no nulls inside the array. The
-- cardinality check also rejects '{}' (array_length of which is null, which a
-- plain BETWEEN would let through).
alter table recurrences drop constraint if exists recurrences_weekdays_check;
alter table recurrences
  add constraint recurrences_weekdays_check
  check (
    weekdays is null
    or (
      cardinality(weekdays) between 1 and 7
      and array_position(weekdays, null) is null
      and weekdays <@ array[0, 1, 2, 3, 4, 5, 6]::smallint[]
    )
  );

notify pgrst, 'reload schema';

-- Verify (should return one row):
--   select column_name from information_schema.columns
--   where table_name = 'recurrences' and column_name = 'weekdays';
