# ✦ Orbit Dashboard

A personal productivity dashboard built with Next.js 16, Supabase, and a glassmorphism UI. Manage your tasks, projects, journal, and money — all in one place, secured behind a single-user login.

Runs as a web app and, via Capacitor, as native Android and iOS apps from the same codebase. See [MOBILE.md](MOBILE.md) for the native builds.

---

## Features

| Module | Description |
|---|---|
| **Today** | Daily overview — tasks due today, active projects, mood check-in, journal snapshot, and this month's money stats by category |
| **Tasks** | Create, filter, and manage tasks with priority levels and project links |
| **Projects** | Track projects with status, tech stack, color labels, and linked tasks |
| **Journal** | Daily journal entries with mood tracking, highlights, and a date picker |
| **Money** | Income **and** expense tracker in MMK (K) with daily/monthly/yearly views, what's-left totals, per-category stats for both ledgers, custom categories, and PNG export |

---

## Tech Stack

- **Framework** — [Next.js 16](https://nextjs.org/) (App Router, static export)
- **Language** — TypeScript
- **Styling** — Tailwind CSS 4
- **UI Components** — [@kwyw/kayv-glass-ui](https://www.npmjs.com/package/@kwyw/kayv-glass-ui) (glassmorphism design system)
- **Backend / Auth / DB** — [Supabase](https://supabase.com/)
- **Native shell** — [Capacitor 8](https://capacitorjs.com/) (Android + iOS)
- **Auth strategy** — Single user, email + password via Supabase Auth

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
- `lib/*.ts` domain modules are pure and React-free, so they are trivially testable.
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
cp .env.local.example .env.local
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

npm run mobile:sync      # Build + sync into the native projects
npm run mobile:android   # Build, sync, open Android Studio
npm run mobile:ios       # Build, sync, open Xcode
npm run android:apk      # Build a debug APK
npm run android:install  # Build and install on a connected device
```

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
