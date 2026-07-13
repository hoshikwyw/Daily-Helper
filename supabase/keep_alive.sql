-- Keep-alive heartbeat
-- ---------------------------------------------------------------------------
-- Supabase pauses free-tier projects after ~7 days of no database activity.
-- This exposes a public RPC endpoint that performs a real DB write, which
-- counts as activity and keeps the project awake. Point an external scheduler
-- (e.g. cron-job.org) at it on a recurring schedule.
--
-- Public endpoint (PostgREST RPC):
--   POST https://<project-ref>.supabase.co/rest/v1/rpc/keep_alive
--   headers:
--     apikey: <anon key>
--     Authorization: Bearer <anon key>
--     Content-Type: application/json
--   body: {}
--
-- Apply: paste this file into the Supabase SQL editor and run it.
-- ---------------------------------------------------------------------------

-- Single-row heartbeat table. `id` is pinned to 1 so there is only ever one row.
create table if not exists keep_alive (
  id smallint primary key default 1,
  last_ping timestamptz not null default now(),
  ping_count bigint not null default 0,
  constraint keep_alive_singleton check (id = 1)
);

insert into keep_alive (id) values (1)
  on conflict (id) do nothing;

-- Lock the table down. The function below is SECURITY DEFINER and runs as the
-- owner, so the anon role never needs direct table privileges.
alter table keep_alive enable row level security;

-- The keep-alive endpoint: bumps the heartbeat and returns the new timestamp.
-- VOLATILE (it writes), so PostgREST exposes it as POST /rest/v1/rpc/keep_alive.
create or replace function keep_alive()
returns timestamptz
language sql
security definer
set search_path = public
as $$
  update keep_alive
     set last_ping = now(),
         ping_count = ping_count + 1
   where id = 1
  returning last_ping;
$$;

-- Expose the function to unauthenticated callers (the cron job uses the anon key).
grant execute on function keep_alive() to anon;

-- Refresh the PostgREST schema cache so the RPC is reachable immediately.
notify pgrst, 'reload schema';
