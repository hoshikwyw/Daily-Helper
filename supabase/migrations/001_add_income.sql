-- Adds income tracking to the money tracker.
--
-- Run this once in the Supabase SQL editor if your project was created before
-- income support. New projects get all of this from schema.sql already.
--
-- Safe to re-run: every statement is guarded.

-- 1. The `category` CHECK only ever allowed the nine built-in expense
--    categories, so inserting a row under a user-created category failed. It
--    also can't accommodate income categories. Categories are validated in the
--    app against `expense_categories`, so the constraint goes.
alter table expenses drop constraint if exists expenses_category_check;

-- 2. Each row is now either money out or money in. Existing rows are expenses.
alter table expenses
  add column if not exists kind text not null default 'expense'
  check (kind in ('expense', 'income'));

-- 3. Categories belong to one side of the ledger, so "Other" can exist for
--    both without colliding.
alter table expense_categories
  add column if not exists kind text not null default 'expense'
  check (kind in ('expense', 'income'));

alter table expense_categories drop constraint if exists expense_categories_user_id_name_key;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'expense_categories_user_kind_name_key'
  ) then
    alter table expense_categories
      add constraint expense_categories_user_kind_name_key unique (user_id, kind, name);
  end if;
end $$;

-- 4. Every screen filters by user + date range, and now by kind.
create index if not exists expenses_user_date_idx on expenses (user_id, date);
