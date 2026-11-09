# Consistency Garden: audit and plan

Stage 1 of the brief in `DAILY_HELPER_CONSISTENCY_GAME_BRIEF.md`. Written 2026-11-09
against commit `b291123` plus the uncommitted Users-tab refactor. Nothing here has
been built yet.

## 1. What the app actually is

| Area | Finding |
|---|---|
| Framework | Next.js 16.2 app router, `output: "export"` (pure static site). React 19, TypeScript 5, Tailwind 4, pnpm. Every page is a client component. |
| Mobile | Capacitor 8 wraps the same static build into an Android APK (minSdk 24, target 36). Whatever ships on the web ships in the APK. |
| Backend | Supabase only. **There is no server of ours**: no API routes, no server actions, no middleware. The browser talks to PostgREST directly with the anon key and the user's JWT. |
| Auth | Supabase email + password, invitation-only (admin creates accounts). Client-side `AuthGuard` gates `/dashboard`. |
| Database | `supabase/schema.sql` for new projects, `supabase/migrations/001..006` for existing ones. Every table has `user_id` and one RLS policy "Own data only" (`auth.uid() = user_id`). Server-side logic already lives in Postgres: triggers (`enforce_invited_signup`, `update_updated_at`) and SECURITY DEFINER functions (`is_admin`, `admin_list_users`). |
| Data access | `lib/api/*.ts` thin wrappers over `supabase.from(...)`; pure domain logic in `lib/*.ts` with Vitest (251 tests). Hooks in `hooks/`. |
| UI | `@kwyw/kayv-glass-ui` (Card, Button, Badge, Progress, Tabs, Modal, toast, Confetti/ConfettiButton). Shared pieces in `components/ui/`. Dark glass theme, emoji icons. |
| Navigation | `components/dashboard/shell.tsx`: a `MenuBar` with six items (Today, Tasks, Journal, Projects, Money, Review) plus Settings and Sign out. On phones it becomes a bottom nav. |
| Animation / canvas deps | None. Confetti comes from the UI kit. No `prefers-reduced-motion` handling anywhere yet. |
| Checks | `tsc --noEmit`, `eslint .`, `vitest run`, `next build`. APK via Gradle (see `MOBILE.md`). |

### The three activity flows the game would read

- **Habits** (`habits`, `habit_checks`): the user's recurring daily things, with an emoji and
  a streak. Checking one calls `setHabitDone`, which upserts a row into `habit_checks`
  with `unique (habit_id, date)`. Unchecking deletes the row. This is the natural
  "consistency" source, and the unique key already makes a day's check idempotent.
- **Tasks** (`tasks`): `setTaskStatus` updates `status` to `done` and stamps
  `completed_at`. Reopening clears both. Recurring rules can create tasks.
- **Money** (`expenses`): one table, `kind in ('expense','income')`, `amount` positive,
  `category` text (defaults in `lib/expenses.ts`, custom ones per user). There is **no
  savings concept** today: no "saving" kind, no savings goal table, no "Savings"
  default category. Budgets are per expense category per month.

There is no "learning session" or "workout" model either. Those words do not exist in
the codebase; they have to be mapped onto habits or tasks.

## 2. Design decisions

### 2.1 Trust boundary: the database is the server

The brief asks for "a trusted server-side action that validates eligibility". In this
app the only trusted code path is Postgres. So rewards are produced by **triggers on the
existing tables**, not by the client:

- `AFTER INSERT ON habit_checks` → reward for that check.
- `AFTER UPDATE OF status ON tasks WHEN new.status = 'done' AND old.status <> 'done'` → reward.
- `AFTER INSERT ON expenses WHEN <savings marker>` → reward.

Each trigger inserts into `game_rewards (user_id, source_type, source_id, category,
xp, created_at)` with `unique (source_type, source_id)` and `on conflict do nothing`.
That gives:

- Idempotency for free (retry, refresh, re-check the same day, reopen-and-redo a task).
- No client input is trusted: the browser never writes XP. The policy on `game_rewards`
  is `select` only, `auth.uid() = user_id`. The trigger function is SECURITY DEFINER so
  it can insert.
- No negative XP by construction: unchecking a habit or reopening a task deletes or
  changes the source row, and the reward row stays.
- Ownership is inherited from the source row's `user_id`, which RLS already pinned.

XP totals are **derived, not stored**: a view `game_progress` sums `game_rewards` per
user and category. No profile row can drift from its events, and there is nothing to
update atomically. The only stored profile data is the avatar choice
(`game_profiles(user_id, avatar_id, world_name, created_at)`).

Level is a pure function of total XP in `lib/game.ts`, unit-tested at the boundaries
(0, 99, 100, across several levels). It is not duplicated in SQL.

### 2.2 Mapping real activities to categories

| Game category | Source | How the user opts in | XP |
|---|---|---|---|
| Learning | habit check | New `habits.category` column: `learning`, `fitness`, or `general` (default). Set in the habit editor with three chips. | 10 |
| Fitness | habit check | Same column, `fitness`. | 15 |
| Savings | money entry | An expense entry whose category is **Savings**, added to the default expense categories. Money moved into savings is an outflow from spending money, so this fits the ledger without a schema change. Fixed XP, never proportional to amount. | 10 |
| General | habit check with `general`, or a task reaching `done` | Nothing to set up. Included from the first reward release: the task trigger is three lines and task completion is the most frequent event in the app, so it is where most people will first see the game react. No daily cap in MVP; this is a personal, single-player layer with nothing to farm for. | 5 |

Why habits rather than tasks for learning and fitness: a habit is already a named,
recurring, once-per-day commitment with a unique key per day. A task is a one-off. The
brief's "learning session" and "planned workout" are habits in this app's vocabulary.

Savings alternatives considered and rejected for MVP: a third `kind = 'saving'` on
`expenses` (`lib/expenses.ts`, 470 lines of totals, charts, and exports, assumes two
kinds, and the brief says not to rework the finance module) and an `is_saving` flag on
each entry (needs a new control in the Add Entry form). The category match is
case-insensitive on `kind = 'expense'`; a custom category such as "Emergency fund" will
not earn XP in MVP, which is an accepted gap. The savings-goals feature already on the
backlog replaces the marker later; the trigger condition is the only thing that changes.

### 2.3 Rendering: DOM and CSS sprites, no engine (decided)

Measured on 2026-11-09:

| Option | Version | Minified | Gzipped |
|---|---|---|---|
| Phaser `phaser.min.js` | 4.1.0 (latest 4.2.1) | ~1.35 MB | ~345 KB (README figure) |
| pixi.js | 8.22.0 | 925 KB | 264 KB |
| This whole app's JavaScript | | ~1.4 MB | |

Phaser alone is the size of the entire application. Both engines must also be loaded
client-only (`next/dynamic`, `ssr: false`) and need a `requestAnimationFrame` loop that
must be paused when the WebView is hidden to save battery.

What the MVP scene actually is: a layered room (wall, floor, five or six furniture
sprites), one avatar, a prop that appears for reading or exercise, a few sparkles on a
reward, and a night variant. None of that needs a game loop. It is a stack of absolutely
positioned elements with `image-rendering: pixelated`, and the animations (idle bob,
blink, hop, squash, sparkle burst) are CSS keyframes toggled by a class.

Decision: **render the scene with React elements and CSS**, driven by one plain
`SceneState` object (`avatar`, `mood`, `timeOfDay`, `unlocked[]`, `playing`). Reasons:

- It is the same technology as the rest of the app, so Tailwind, the theme, safe areas,
  and the UI kit all apply without a bridge.
- `prefers-reduced-motion` is one media query that disables the keyframes; nothing to
  hand-roll.
- Every room object is a real element: focusable, labelled, clickable later for unlock
  details. Accessibility comes free instead of being a canvas overlay.
- Zero bytes of dependency, nothing to destroy on unmount, no WebGL context limits in the
  Android WebView, no CPU use while idle.

The page keeps a clean seam: the scene component takes `SceneState` and emits nothing.
If the game later needs free movement, collision, or a tile map, a Phaser 4 or canvas
scene can take the same `SceneState` behind the same props. The brief allows a CSS
implementation when the trade-off is documented; this section is that documentation.

### 2.4 Assets

Decided in part 2: the room and avatar are **original SVG drawn in code**, in one vector
style and the pastel palette (see `ASSET_CREDITS.md`). A 16×16 pixel pack next to the
vector sprout would have read as two styles, and inline SVG cannot fail to load, so no
fallback image is needed. The CC0 packs below stay on file as options.

CC0 first, per the brief. Candidates checked:

- Kenney **Roguelike Indoors** (CC0, 16×16: tables, chairs, sofas, kitchen) and Kenney
  **Roguelike/RPG pack** (CC0, 1,700+ tiles including bed, bookcase, windows, doors).
  Together they furnish the room.
- Kenney **Tiny Dungeon** (CC0): 130+ sprites including small characters usable as
  starter avatars.
- Characters in these packs are single-frame. Idle, hop, and celebrate are done in code
  (vertical bob, squash-and-stretch, sparkle particles). Reading and exercise are the
  same avatar with a prop sprite overlaid. That keeps one consistent style with no
  hand-drawn frames.
- Not CC0, so not used: DayOff (Lite is non-commercial only), Napping Cloud apartment
  pack (custom licence), Cozy People (no idle animation anyway).
- `ASSET_CREDITS.md` records every file, source URL, and licence. Target well under
  200 KB of images for the first room, PNG, loaded only on the game route.

### 2.5 Where it lives

- Route `app/dashboard/world/` ("My World" is the nav label; the room's display name is
  a setting so the garden name can change).
- Nav item in `shell.tsx` (icon 🌱). The phone bottom nav already carries seven items
  (six sections plus Settings), which is the ceiling for thumb-sized targets. Decision:
  **Review leaves the bottom nav** (`bottomNav={false}`, as Sign out already does) and
  My World takes its place. Review keeps its desktop sidebar entry and its existing
  entry point on the Today page (`review-nudge.tsx`), so nothing becomes unreachable.
- A small card on Today: avatar preview, level, and the last reward.
- Code layout, following the existing conventions rather than the brief's `src/features`
  tree: `lib/game.ts` (XP table, level curve, reward descriptions; tested),
  `lib/api/game.ts` (reads progress, rewards, profile; writes avatar choice),
  `hooks/use-game.ts`, `components/game/` (`RoomScene`, `Avatar`, `ProgressPanel`,
  `RewardToast`, `AvatarPicker`, `scene.css`), assets in `public/game/`.
- Reward feedback where the action happened: after `setHabitDone`, `setTaskStatus`, or
  `createExpense` succeeds, a small `useRewardFeedback` hook asks `game_rewards` once for
  that source id and toasts "+10 XP Learning" if a row came back. No polling, no
  Realtime subscription, and the toast cannot fire for a reward the database refused.
  The My World page itself plays the matching animation for rewards newer than the one
  last seen there (id kept in local storage); level-up reuses the UI kit's confetti.
  A new `useReducedMotion` hook turns all of this into static states, and the panel
  always states XP and level in text.

## 3. Schema (migration 007, draft)

```sql
alter table habits add column if not exists category text not null default 'general'
  check (category in ('learning', 'fitness', 'general'));

create table if not exists game_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  avatar_id text not null default 'sprout',
  world_name text not null default 'My World',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists game_rewards (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_type text not null check (source_type in ('habit_check', 'task', 'expense')),
  source_id uuid not null,
  category text not null check (category in ('learning', 'fitness', 'savings', 'general')),
  xp integer not null check (xp > 0),
  created_at timestamptz not null default now(),
  unique (source_type, source_id)
);

create view game_progress as
  select user_id,
         sum(xp) as total_xp,
         sum(xp) filter (where category = 'learning') as learning_xp,
         sum(xp) filter (where category = 'fitness')  as fitness_xp,
         sum(xp) filter (where category = 'savings')  as savings_xp,
         sum(xp) filter (where category = 'general')  as general_xp
  from game_rewards group by user_id;
-- RLS: game_profiles own-row read/write; game_rewards own-row select only;
-- the view runs with security_invoker so the same policy applies.
-- Triggers: reward_habit_check, reward_task_done, reward_savings_entry (SECURITY DEFINER).
```

XP values live in one SQL table-less place (the trigger functions read a `game_xp`
config table or constants in one function) and in one TypeScript constant for display.
Unlocks and achievements are deferred and would be two more small tables.

## 4. Stages, as parts with commit messages

Each part ends with `tsc`, `eslint`, `vitest`, `next build`, and an independent review,
then a commit message for the owner to commit.

1. **Shell** (brief Stage 2): route, nav item, Today card, page layout with a placeholder
   room image and a static avatar, loading/empty/error states, `useReducedMotion`.
   No database change. Existing pages untouched.
   `feat: My World page shell with placeholder room and avatar`
2. **Scene** (Stage 3): `SceneState` type, `RoomScene` and `Avatar` components, CSS
   keyframes for idle/blink/hop/celebrate, prop overlays for reading and exercise, night
   variant, static fallback when an image fails, reduced-motion handling, assets and
   `ASSET_CREDITS.md`.
   `feat: cozy room scene with an animated avatar in CSS`
3. **Progress, learning first** (Stage 4): migration 007 with tables, view, policies,
   and the habit-check trigger; habit `category` chips in the habit editor;
   `lib/game.ts` with level curve and tests; `ProgressPanel` and reward history fed by
   real data; reward toast on new rewards.
   `feat: game progress tables, learning XP from habit checks, level curve`
4. **Fitness, savings, tasks** (Stage 5): the other two triggers plus the task trigger;
   "Savings" default category; category breakdown in the panel; tests that a savings
   reward changes no money row and that duplicate completions do not double-award.
   `feat: fitness, savings, and task rewards through database triggers`
5. **Polish** (Stage 6): avatar picker persisted in `game_profiles`, one or two unlockable
   room items by level, first achievements, phone layout pass, APK rebuild.
   `feat: starter avatars, first unlocks, and achievements in My World`

## 5. Decisions taken (2026-11-09)

1. **Renderer**: React elements and CSS keyframes, no engine. Phaser 4 measured at
   ~1.35 MB minified, the size of the whole app; the MVP scene has no game loop to
   justify it. Seam kept through a `SceneState` prop so an engine can be swapped in.
2. **Savings marker**: "Savings" default expense category, matched by the trigger.
   Replaced by savings goals when that feature lands.
3. **Learning and fitness**: a category on habits. Tasks earn general XP from the first
   reward release through their own trigger, with no UI change.
4. **Phone nav**: My World replaces Review in the bottom nav; Review stays on desktop and
   via the Today page.

Also decided: XP totals are a view over reward events, never a stored counter; triggers
are the only writer of rewards; level is a pure TypeScript function with boundary tests;
no daily caps, no negative XP, no streak requirement in MVP.
