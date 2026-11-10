-- My World, part two: tasks and savings earn XP, the same way habit checks do
-- in 007. Both triggers only ever insert into game_rewards; they never read
-- back into, change, or delete a task or a money entry.
--
-- Run this once in the Supabase SQL editor, after 007. Safe to re-run.

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

-- Verify: finish a task, or add an expense in the Savings category, then
--   select source_type, source_key, category, xp, note from game_rewards order by created_at desc limit 5;
