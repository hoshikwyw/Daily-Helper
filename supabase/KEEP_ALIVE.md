# Keep-alive (prevent Supabase free-tier pause)

Supabase pauses free-tier projects after ~7 days of **database** inactivity. The
web app is a static export (no server), so we keep the project awake by having an
external scheduler hit a public Supabase RPC that performs a tiny DB write.

## 1. Apply the SQL (one time)

Open the Supabase dashboard → **SQL Editor** → paste the contents of
[`keep_alive.sql`](./keep_alive.sql) → **Run**.

This creates a single-row `keep_alive` table and a public `keep_alive()` RPC.

Verify it works:

```bash
curl -X POST 'https://mgzvoonpnbjxjytpamsl.supabase.co/rest/v1/rpc/keep_alive' \
  -H 'apikey: <ANON_KEY>' \
  -H 'Content-Type: application/json' \
  -d '{}'
```

A `200` with a timestamp in the body means it's live. `<ANON_KEY>` is the
`NEXT_PUBLIC_SUPABASE_ANON_KEY` from `.env`.

The endpoint is effectively public — no `Authorization` header or logged-in user
is required. The `apikey` header is the only one needed, and it stays: Supabase's
API gateway rejects any `/rest/v1/*` request without it (`401 "No API key found
in request"`). That key is the **anon** key, which is public by design (already
shipped in the app bundle and protected by RLS), so it isn't access control —
just a routing key.

## 2. Configure cron-job.org

Create a new cron job at https://cron-job.org with:

| Field | Value |
|-------|-------|
| **URL** | `https://mgzvoonpnbjxjytpamsl.supabase.co/rest/v1/rpc/keep_alive` |
| **Request method** | `POST` |
| **Schedule** | Every 2 days (e.g. at 09:00) — well within the ~7-day window |
| **Request body** | `{}` |

Under **Advanced → Headers**, add just:

```
apikey: <ANON_KEY>
Content-Type: application/json
```

Enable **"Notify on failure"** so you hear about it if the endpoint ever stops
responding.

## 3. Confirm it's ticking

In the Supabase SQL editor:

```sql
select last_ping, ping_count from keep_alive;
```

`last_ping` should update on every cron run and `ping_count` should climb.
