# ✦ Orbit Dashboard

A personal productivity dashboard built with Next.js 16, Supabase, and a glassmorphism UI. Manage your tasks, projects, journal, and expenses — all in one place, secured behind a single-user login.

---

## Features

| Module | Description |
|---|---|
| **Today** | Daily overview — tasks due today, active projects, mood check-in, journal snapshot |
| **Tasks** | Create, filter, and manage tasks with priority levels and project links |
| **Projects** | Track projects with status, tech stack, color labels, and linked tasks |
| **Journal** | Daily journal entries with mood tracking, highlights, and a date picker |
| **Expenses** | Expense tracker in MMK (K) with daily/monthly/yearly views, custom categories, and category breakdown charts |

---

## Tech Stack

- **Framework** — [Next.js 16](https://nextjs.org/) (App Router)
- **Language** — TypeScript
- **Styling** — Tailwind CSS 4
- **UI Components** — [@kwyw/kayv-glass-ui](https://www.npmjs.com/package/@kwyw/kayv-glass-ui) (glassmorphism design system)
- **Backend / Auth / DB** — [Supabase](https://supabase.com/)
- **Auth strategy** — Single user, email + password via Supabase Auth

---

## Project Structure

```
orbit-dashboard/
├── app/
│   ├── actions/
│   │   └── auth.ts              # Server action: logout
│   ├── dashboard/
│   │   ├── layout.tsx           # Dashboard shell layout
│   │   ├── page.tsx             # Today page
│   │   ├── tasks/page.tsx
│   │   ├── journal/page.tsx
│   │   ├── projects/page.tsx
│   │   ├── expenses/page.tsx
│   │   └── settings/page.tsx
│   ├── login/
│   │   └── page.tsx             # Login form
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Redirects to /dashboard
├── components/
│   ├── providers.tsx
│   └── dashboard/
│       └── shell.tsx            # Sidebar navigation + sign out
├── lib/
│   ├── supabase.ts              # Browser Supabase client
│   ├── supabase-server.ts       # Server-side Supabase client
│   └── types.ts                 # TypeScript interfaces
├── supabase/
│   └── schema.sql               # Full database schema with RLS
├── proxy.ts                     # Route guard (Next.js 16)
└── .env.local                   # Environment variables (not committed)
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

Copy the example file and fill in your Supabase credentials:

```bash
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Find these values in your Supabase project under **Settings → API**.

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
| `projects` | `name`, `status`, `color`, `tech_stack`, `repository_url` |
| `tasks` | `title`, `status`, `priority`, `project_id`, `due_date` |
| `journal_entries` | `date`, `content`, `mood`, `highlights` |
| `expenses` | `amount`, `category`, `description`, `date` |
| `expense_categories` | `name`, `color` (custom categories per user) |

RLS policies ensure every query automatically filters to the logged-in user's data — even if the anon key is exposed.

---

## Authentication Flow

1. Unauthenticated request to `/dashboard` → `proxy.ts` redirects to `/login`
2. User submits email + password → Supabase Auth validates and sets a session cookie
3. Session is stored in a secure `HttpOnly` cookie via `@supabase/ssr`
4. `proxy.ts` refreshes the session token on every request
5. Sign out clears the cookie and redirects to `/login`

---

## Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

---

## Expense Categories

Default categories ship with the app (Food & Drink, Transport, Shopping, etc.). You can add custom categories with a custom color from the **⚙ Categories** menu on the Expenses page. Custom categories are saved to Supabase and persist across sessions.

---

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous (public) key |
