# Keep-alive (prevent Supabase free-tier pause)

Supabase pauses free-tier projects after ~7 days of **database** inactivity. The
web app is a static export (no server), so we keep the project awake by having an
external scheduler hit a public Supabase RPC that performs a tiny DB write.

## 1. Apply the SQL (one time)

Open the Supabase dashboard → **SQL Editor** → paste the contents of
[`keep_alive.sql`](./keep_alive.sql) → **Run**.

This creates a single-row `keep_alive` table and a public `keep_alive()` RPC.

Verify it works — pass the key in the URL, no headers needed:

```bash
curl -X POST 'https://mgzvoonpnbjxjytpamsl.supabase.co/rest/v1/rpc/keep_alive?apikey=<ANON_KEY>'
```

A `200` with a timestamp in the body means it's live. `<ANON_KEY>` is the
`NEXT_PUBLIC_SUPABASE_ANON_KEY` from `.env`.

The `apikey` is required (Supabase's gateway rejects any `/rest/v1/*` request
without it — that's the `401 "No API key found in request"` you saw in a test
run), but it can travel as a **URL query param** instead of a header, which keeps
the cron-job.org setup header-free. That key is the **anon** key — public by
design (already shipped in the app bundle and protected by RLS), so putting it in
the URL is fine; it isn't a secret and RLS is the real security boundary.

## 2. Configure cron-job.org

Create a new cron job at https://cron-job.org with:

| Field | Value |
|-------|-------|
| **URL** | `https://mgzvoonpnbjxjytpamsl.supabase.co/rest/v1/rpc/keep_alive?apikey=<ANON_KEY>` |
| **Request method** | `POST` — **must** be POST; the function writes, so `GET` returns `405` |
| **Schedule** | Every 2 days (e.g. at 09:00) — well within the ~7-day window |

No custom headers and no request body are required. Enable **"Notify on failure"**
so you hear about it if the endpoint ever stops responding.

> The 401 in the test run had two causes: the request had no `apikey`, and
> cron-job.org defaulted to `GET`. Putting `?apikey=…` in the URL and switching
> the method to **POST** fixes both.

## 3. Confirm it's ticking

In the Supabase SQL editor:

```sql
select last_ping, ping_count from keep_alive;
```

`last_ping` should update on every cron run and `ping_count` should climb.
