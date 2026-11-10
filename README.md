# ✦ Orbit Dashboard

A personal productivity dashboard built with Next.js 16, Supabase, and a glassmorphism UI. Manage your tasks, projects, journal, and money — all in one place. Each person has their own login and sees only their own data; accounts are created by an admin.

Runs as a web app and, via Capacitor, as native Android and iOS apps from the same codebase. See [MOBILE.md](MOBILE.md) for the native builds.

---

## Features

| Module | Description |
|---|---|
| **Today** | Daily overview — tasks due today, active projects, mood check-in, daily habits with streaks, journal snapshot, this month's money stats by category, the tightest budget, and upcoming recurring entries |
| **Tasks** | Create, filter, and manage tasks with priority levels, project links, and repeating tasks |
| **Projects** | Track projects with status, tech stack, color labels, and linked tasks |
| **Journal** | Daily journal entries with mood tracking, highlights, and a date picker |
| **Review** | One page per week — tasks finished against the week before, mood by day, habit dots and streaks, spending and earning with where it went, and the journal highlights, with a Monday nudge on Today |
| **Money** | Income **and** expense tracker in MMK (K) with daily/monthly/yearly views, a calendar of logged days, what's-left totals, per-category stats for both ledgers, custom categories, monthly budgets per category, repeating entries, and PNG export |

### Accounts and the admin

Nobody can sign themselves up. An admin — any email in the `admins` table,
seeded with the superadmin — creates accounts from **Settings → Users**: enter
an email, type or generate a password, and hand both over. The person then
signs in on the normal login screen, on web or on the phone, and sees only
their own data.

How it stays safe without a privileged key in the app: creating an account
first puts the email on an invitation list (`allowed_users`, writable only by
admins), then performs an ordinary public sign-up; a trigger on `auth.users`
rejects any sign-up whose email is not on the list. The Users tab shows each
account as *Active*, *Awaiting email confirmation*, or *Invited, no account
yet*. Removing an invitation stops that email from signing up again; disabling
an existing account is done in the Supabase dashboard.

The trigger applies to the dashboard too: **Authentication → Users → Add
user** only works for an email already in `allowed_users` (add it in the SQL
editor first), while **Invite user** always works, since the invitation email
is the gate there. That is also how a fresh project gets its first admin:
insert the email into `allowed_users` in the SQL editor, create the account,
and it is an admin because the email is in `admins`.

Two dashboard settings under **Authentication → Providers → Email**:

- **Enable email sign-ups** must stay on; the trigger is what keeps sign-up
  closed to outsiders.
- **Confirm email** is your choice: on means a new user must click the
  confirmation email before signing in; off means the account works at once.
  The confirmation link goes to the project's **Site URL**, so set that to the
  web address of the app.

Existing projects need `supabase/migrations/006_admin_users.sql` applied once.
To add another admin, insert their email into `admins`.

### My World

A cozy room and a small character that grow with what you actually do. Open it from
the 🌱 item in the navigation or the card on Today.

- **XP is awarded by the database, never by the app.** Triggers on `habit_checks`,
  `tasks`, and `expenses` write one row into `game_rewards` per real event (a habit on
  a day, a task reaching done, a money entry filed under Savings), so a retry, an
  uncheck and re-check, a reopened task, or a refresh can never award twice. The browser can
  only read rewards; totals come from the `game_progress` view, so nothing drifts.
  Nothing is ever taken away: unchecking removes the check, not the reward.
- **What earns what.** A habit marked Learning is 10 XP, Fitness 15 XP, Everyday 5 XP
  (set in Manage habits). A finished task is 5 XP. A money entry in the **Savings**
  expense category is 10 XP, fixed, whatever the amount: money set aside is an outflow
  there, so "Money left" means free to spend. Entries created by a recurring rule do
  not earn; only one you add yourself does. The triggers never read, change, or
  delete a task or money row; a reward is a separate row that outlives its source.
- **Level** is a pure function of total XP in `lib/game.ts` (100 XP for level 2, then 25
  more each level) and is not stored anywhere. So are the room decorations that appear
  at levels 2, 3, and 5 (`lib/unlocks.ts`) and the achievements (`lib/achievements.ts`):
  all derived from the totals, nothing to store or forge.
- **Customise** on the page picks one of three starter avatars and names the world. That
  is the only thing the app writes, to `game_profiles`, one row per person.
- The room and avatars are original SVG drawn in code (see `ASSET_CREDITS.md`); the
  avatar sleeps from 21:00 to 06:00 and reacts to new rewards. All motion honours the
  system reduced-motion setting.

Existing projects need `supabase/migrations/007_game.sql`, `008_game_tasks_savings.sql`,
and `009_game_profiles.sql` applied once, in order.

### Weekly review

**Review** in the navigation opens the last completed week, Monday to Sunday,
with arrows back through earlier weeks. Everything on it is derived from the
existing tables — no schema change — and the maths lives in `lib/review.ts`
with tests. Mood tiles and highlight dates deep-link into the Journal
(`/dashboard/journal?date=YYYY-MM-DD`). On Mondays the Today page shows a
one-line nudge to open it.

### Habits

The Today page has a row of tappable habit chips — water, exercise, reading,
whatever you are trying to do daily. Tapping marks today done and saves at
once; each chip shows its running streak. An unchecked today does not break a
streak until the day is over. **Manage habits** edits emoji and names, reorders,
and archives (history is kept and a habit can be restored). Up to eight active
habits keep the row tappable on a phone. Streak maths lives in `lib/habits.ts`
and is covered by tests.

Existing projects need `supabase/migrations/004_habits.sql` applied once.

### Budgets

Each expense category can have a monthly limit: **◎ Budgets** on the Monthly
tab. A limit applies from that month onward until you change it (set rent once
and it stays), and a blank field switches it off. The Spent breakdown then shows
spending against the limit — green under 80%, amber up to 100%, rose over — and
the Today page leads with the tightest budget. The maths lives in
`lib/budgets.ts` and is covered by tests.

Existing projects need `supabase/migrations/003_budgets.sql` applied once.

### Recurring entries and tasks

Any money entry or task can repeat daily, on weekdays, weekly, monthly, yearly,
or on a custom set of days: pick a
**Repeat** option in the form. The rule is stored once in the `recurrences`
table, and real rows are created by a sync that runs when the dashboard opens
and whenever the app comes back on a later day (browser tab or native resume).
Rows are created only when due, missed occurrences are backfilled up to a year,
and a unique index on (rule, date) makes the sync safe to run from several
devices. The **⟳ Recurring** button on the Money and Tasks pages lists, pauses,
and deletes rules; deleting a rule keeps what it already created. The
scheduling maths lives in `lib/recurrence.ts` and is covered by tests.

Existing projects need `supabase/migrations/002_recurrences.sql` and
`005_recurrence_weekdays.sql` applied once.

---

## Tech Stack

- **Framework** — [Next.js 16](https://nextjs.org/) (App Router, static export)
- **Language** — TypeScript
- **Styling** — Tailwind CSS 4
- **UI Components** — [@kwyw/kayv-glass-ui](https://www.npmjs.com/package/@kwyw/kayv-glass-ui) (glassmorphism design system)
- **Backend / Auth / DB** — [Supabase](https://supabase.com/)
- **Native shell** — [Capacitor 8](https://capacitorjs.com/) (Android + iOS)
- **Auth strategy** — Email + password via Supabase Auth; invitation-only sign-up, accounts created by an admin (see Accounts below)

> **Static export.** `next.config.ts` sets `output: "export"`, so the build produces a folder of HTML/CSS/JS with **no Node server at runtime**. Every page is a client component, there is no middleware, and there are no server actions or route handlers — Capacitor packages the output directly.

---

## Architecture

The codebase is organised in layers. Each one only depends on the layers below it.

```
app/**/page.tsx        State, orchestration, layout. No SQL, no domain rules.
app/**/_components/    Presentational pieces for one feature.
components/ui/         Cross-feature primitives (PageHeader, EmptyState, …).
lib/<feature>.ts       Pure domain logic — filtering, formatting, drafts.
lib/api/<entity>.ts    All Supabase access. The ONLY place queries are written.
```

**Rules that keep it that way:**

- Nothing outside `lib/api/` and `lib/db.ts` imports `@/lib/supabase`. Pages call `listTasks()`, not `supabase.from("tasks")`.
- In `lib/api/*`, reads return `[]`/`null`, writes return the row or `null`, deletes return `boolean`. Errors are toasted inside the layer, so call sites read `if (!created) return;`.
- `lib/*.ts` domain modules are pure and React-free, so they are testable without a DOM — see `npm test`.
- Shared vocabulary — status colors, badge variants, select options — lives once in `lib/constants.ts` and is derived, never re-typed.

```
orbit-dashboard/
├── app/
│   ├── dashboard/
│   │   ├── layout.tsx              # AuthGuard + dashboard shell
│   │   ├── page.tsx                # Today
│   │   ├── _components/            # today-*.tsx cards
│   │   ├── tasks/                  # page.tsx + _components/
│   │   ├── journal/                # page.tsx + _components/
│   │   ├── projects/               # page.tsx + _components/
│   │   ├── project/                # single-project detail (?id=…)
│   │   ├── expenses/               # Money tracker: page.tsx + _components/
│   │   └── settings/               # page.tsx + _components/
│   ├── auth/callback/page.tsx      # Completes email links (PKCE / OTP)
│   ├── login/page.tsx              # Sign in + password reset
│   ├── update-password/page.tsx
│   ├── layout.tsx                  # Root layout
│   └── page.tsx                    # Redirects to /dashboard
├── components/
│   ├── auth-guard.tsx              # Client-side route guard
│   ├── providers.tsx               # Theme, toasts, native init
│   ├── deep-link-handler.tsx       # Native kayv:// links
│   ├── dashboard/shell.tsx         # Sidebar + mobile bottom nav
│   └── ui/                         # Shared primitives
├── hooks/
│   └── use-settings.ts             # Local preferences
├── lib/
│   ├── api/                        # tasks, projects, journal, expenses, auth
│   ├── constants.ts                # Shared status/mood/priority vocabulary
│   ├── date.ts                     # Local-time date helpers
│   ├── progress.ts                 # Completion math
│   ├── settings.ts                 # Preference storage
│   ├── supabase.ts                 # Browser client (singleton)
│   ├── types.ts                    # Row + Insert/Update types
│   └── tasks.ts, projects.ts, journal.ts, expenses.ts
└── supabase/
    ├── schema.sql                  # Full database schema with RLS
    └── migrations/                 # Incremental changes for existing databases
```

---

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/your-username/orbit-dashboard.git
cd orbit-dashboard
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the full contents of [`supabase/schema.sql`](supabase/schema.sql)
3. Go to **Authentication → Users → Add user** and create your account (email + password)

### 3. Configure environment variables

```bash
cp .env.example .env
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Find these values in your Supabase project under **Settings → API**.

> Both variables are required at **build** time, not just at runtime. The Supabase client is created when its module is first imported, so `npm run build` fails while prerendering `/auth/callback` if they are missing.

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you will be redirected to the login page.

---

## Database Schema

Five tables, all protected by Row Level Security (RLS). Every row is tied to the authenticated user via `user_id`.

| Table | Key Columns |
|---|---|
| `projects` | `name`, `status`, `color`, `tech_stack`, `repository_url`, `notes` |
| `tasks` | `title`, `status`, `priority`, `project_id`, `due_date`, `completed_at` |
| `journal_entries` | `date`, `content`, `mood`, `highlights` |
| `expenses` | `kind` (`expense`/`income`), `amount`, `category`, `description`, `date` |
| `expense_categories` | `kind`, `name`, `color` (custom categories per user, per ledger) |

RLS policies ensure every query automatically filters to the logged-in user's data — even if the anon key is exposed.

### Migrations

`schema.sql` is the current state, for fresh projects. If your database predates a change, apply the matching file from [`supabase/migrations/`](supabase/migrations) in the Supabase SQL editor instead of re-running the whole schema.

| Migration | What it does |
|---|---|
| `001_add_income.sql` | Adds `kind` to `expenses` and `expense_categories` so the tracker records income as well as spending. Also drops the old `category` CHECK, which only allowed the nine built-in names and rejected user-created categories. |

Each migration is guarded (`if not exists`, `drop constraint if exists`), so re-running one is harmless.

**If writes still fail with `PGRST204: Could not find the 'kind' column` after migrating**, PostgREST is serving a stale schema cache. `001_add_income.sql` ends with `notify pgrst, 'reload schema';` to prevent this; if you ran only part of the file, run that line on its own.

---

## Authentication Flow

There is no middleware — a static export has no server to run it. Guarding happens on the client.

1. `/dashboard/*` renders inside [`AuthGuard`](components/auth-guard.tsx), which subscribes to the Supabase session and redirects to `/login` when there isn't one.
2. Signing in stores the session in browser storage via `@supabase/ssr`; `AuthGuard` sees the change and renders the dashboard.
3. **Password reset** — `/login` emails a link through `resetPasswordForEmail`. On web it points at `/auth/callback`; on native it points at `kayv://auth/callback`, which [`DeepLinkHandler`](components/deep-link-handler.tsx) forwards into the app.
4. `/auth/callback` completes the PKCE code exchange or OTP verification, then routes to `?next=` (or back to `/login?error=…`).
5. Signing out clears the session and returns to `/login`.

All of this lives behind [`lib/api/auth.ts`](lib/api/auth.ts) — the auth screens never touch the Supabase client directly.

---

## Preferences

Display name, timezone, reminder toggles, and compact mode are stored in **localStorage**, per device — there is no `user_settings` table. The theme is persisted separately by the UI library's `ThemeProvider`.

The display name drives the Today page greeting. Timezone, compact mode, and the reminder toggles are **saved but not yet acted on** — the app formats dates in the device's local timezone, and browser notifications need a service worker that isn't registered yet.

---

## Available Scripts

```bash
npm run dev              # Start development server
npm run build            # Static export to out/
npm run start            # Serve a production build
npm run lint             # Run ESLint
npm test                 # Run the domain-logic test suite
npm run test:watch       # Same, in watch mode

npm run mobile:sync      # Build + sync into the native projects
npm run mobile:android   # Build, sync, open Android Studio
npm run mobile:ios       # Build, sync, open Xcode
npm run android:apk      # Build a debug APK
npm run android:install  # Build and install on a connected device
```

---

## Tests

`npm test` runs [Vitest](https://vitest.dev/) over the pure modules in `lib/` — the money maths, local-time date handling, and the draft/dirty comparisons behind the Save buttons. No DOM, no database, no network.

Coverage is deliberately narrow: it targets logic that is easy to get subtly wrong and expensive to notice, rather than chasing a percentage. Several cases exist because the bug happened — entries saved before the income migration have no `kind`, and using that as a lookup key took the whole page down.

Tests live beside the module they cover (`lib/expenses.test.ts`), so a module and its tests move together.

---

## Money Tracker

Every row in `expenses` is either money **out** or money **in**, decided by its `kind`. `amount` is always positive — the sign lives in `kind`, never in the number — so totals can never be corrupted by a stray negative.

- **Money left** is `income − expense`, shown on every tab and on the home page. Negative means you outspent what came in.
- **Collected by month** on the Yearly tab charts net per month, with bars scaled to the largest absolute net so a heavy loss reads as clearly as a heavy gain.
- **Category stats** are computed per ledger, so spending and earning each get their own breakdown.

Each ledger has its own categories: expenses default to Food & Drink, Transport, Shopping, etc.; income defaults to Salary, Freelance, Business, and so on. Because categories are scoped by `kind`, a name like "Other" can exist on both sides. Add your own with a custom color from the **⚙ Categories** menu.

Each tab exports its summary as a PNG — rendered on a canvas, with no external dependency.

---

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous (public) key |
