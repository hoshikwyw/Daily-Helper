import { MOODS } from "@/lib/constants";
import { addDays, fromISODate, toISODate } from "@/lib/date";
import {
  filterByKind,
  fmt,
  getCategoryBreakdown,
  getTotals,
  type CategorySlice,
  type Totals,
} from "@/lib/expenses";
import { activeHabits, checksByHabit, computeStreak } from "@/lib/habits";
import { plural } from "@/lib/text";
import type { Expense, Habit, HabitCheck, JournalEntry, Mood, Task } from "@/lib/types";

// The weekly review: pure functions that turn a week's rows into the figures
// the Review page shows. Everything is keyed on local calendar days, like the
// rest of the app, and weeks run Monday to Sunday.

export type WeekRange = {
  /** Monday, `YYYY-MM-DD`. */
  from: string;
  /** Sunday, `YYYY-MM-DD`. */
  to: string;
};

/** The Monday-to-Sunday week containing `date`. */
export function weekOf(date: string): WeekRange {
  const day = fromISODate(date).getDay();
  // getDay is 0 for Sunday; shift so Monday is 0.
  const sinceMonday = (day + 6) % 7;
  const from = addDays(date, -sinceMonday);
  return { from, to: addDays(from, 6) };
}

export function previousWeek(week: WeekRange): WeekRange {
  return { from: addDays(week.from, -7), to: addDays(week.to, -7) };
}

export function nextWeek(week: WeekRange): WeekRange {
  return { from: addDays(week.from, 7), to: addDays(week.to, 7) };
}

/** The most recent week that has fully ended: the one before today's. */
export function lastCompletedWeek(today: string): WeekRange {
  return previousWeek(weekOf(today));
}

/** The seven days of a week, Monday first. */
export function weekDays(week: WeekRange): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(week.from, i));
}

export function inWeek(date: string | null | undefined, week: WeekRange): boolean {
  return !!date && date >= week.from && date <= week.to;
}

/** Local calendar day of a timestamp such as `completed_at`. */
function dayOf(timestamp: string): string {
  return toISODate(new Date(timestamp));
}

// ── Tasks ───────────────────────────────────────────────────────────────────

export type TaskReview = {
  /** Finished during the week, earliest first. */
  done: Task[];
  previousDoneCount: number;
  /** Still open with a due date on or before the week's end. */
  overdue: Task[];
};

export function reviewTasks(tasks: Task[], week: WeekRange): TaskReview {
  const previous = previousWeek(week);
  const finishedIn = (range: WeekRange) =>
    tasks
      .filter((t) => t.status === "done" && t.completed_at && inWeek(dayOf(t.completed_at), range))
      .sort((a, b) => (a.completed_at! < b.completed_at! ? -1 : 1));
  const overdue = tasks
    .filter((t) => t.status !== "done" && t.due_date && t.due_date <= week.to)
    .sort((a, b) => (a.due_date! < b.due_date! ? -1 : 1));
  return { done: finishedIn(week), previousDoneCount: finishedIn(previous).length, overdue };
}

// ── Mood ────────────────────────────────────────────────────────────────────

export type MoodDay = { date: string; mood: Mood | null };

export type MoodReview = {
  days: MoodDay[];
  /** The mood logged most often; the better one wins a tie. */
  mostCommon: Mood | null;
  /** How many days had a mood. */
  logged: number;
};

export function reviewMood(entries: JournalEntry[], week: WeekRange): MoodReview {
  const byDate = new Map(entries.map((e) => [e.date, e.mood]));
  const days = weekDays(week).map((date) => ({ date, mood: byDate.get(date) ?? null }));

  const counts = new Map<Mood, number>();
  for (const { mood } of days) if (mood) counts.set(mood, (counts.get(mood) ?? 0) + 1);

  let mostCommon: Mood | null = null;
  let top = 0;
  // MOODS runs best to worst, so the first to reach the top count wins a tie.
  for (const mood of MOODS) {
    const n = counts.get(mood) ?? 0;
    if (n > top) {
      top = n;
      mostCommon = mood;
    }
  }
  return { days, mostCommon, logged: days.filter((d) => d.mood).length };
}

// ── Habits ──────────────────────────────────────────────────────────────────

export type HabitWeek = {
  habit: Habit;
  /** Monday to Sunday: done or not. */
  days: boolean[];
  doneCount: number;
  /** The streak as of `today`, not the week shown. */
  streak: number;
};

export function reviewHabits(
  habits: Habit[],
  checks: HabitCheck[],
  week: WeekRange,
  today: string
): HabitWeek[] {
  const dates = checksByHabit(checks);
  const days = weekDays(week);
  return activeHabits(habits).map((habit) => {
    const own = new Set(dates[habit.id] ?? []);
    const done = days.map((d) => own.has(d));
    return {
      habit,
      days: done,
      doneCount: done.filter(Boolean).length,
      streak: computeStreak(own, today).current,
    };
  });
}

// ── Money ───────────────────────────────────────────────────────────────────

export type MoneyReview = {
  totals: Totals;
  previousTotals: Totals;
  /** Biggest spending categories of the week, at most three. */
  topCategories: CategorySlice[];
};

export function reviewMoney(entries: Expense[], week: WeekRange): MoneyReview {
  const previous = previousWeek(week);
  const thisWeek = entries.filter((e) => inWeek(e.date, week));
  const lastWeek = entries.filter((e) => inWeek(e.date, previous));
  return {
    totals: getTotals(thisWeek),
    previousTotals: getTotals(lastWeek),
    topCategories: getCategoryBreakdown(filterByKind(thisWeek, "expense")).slice(0, 3),
  };
}

// ── Highlights ──────────────────────────────────────────────────────────────

export type Highlight = { date: string; text: string };

/** Every highlight line written during the week, in date order. */
export function gatherHighlights(entries: JournalEntry[], week: WeekRange): Highlight[] {
  return entries
    .filter((e) => inWeek(e.date, week))
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .flatMap((e) => e.highlights.filter((h) => h.trim()).map((text) => ({ date: e.date, text })));
}

// ── Comparisons and the one-line summary ────────────────────────────────────

export type Delta = { diff: number; direction: "up" | "down" | "same" };

export function delta(current: number, previous: number): Delta {
  const diff = current - previous;
  return { diff, direction: diff > 0 ? "up" : diff < 0 ? "down" : "same" };
}

/**
 * The week in one line, e.g. "6 tasks done · mood mostly good · spent
 * K 240,000". Parts with nothing to say are left out; an empty week reads
 * as a gentle nudge instead.
 */
export function summarizeWeek(tasks: TaskReview, mood: MoodReview, money: MoneyReview): string {
  const parts: string[] = [];
  if (tasks.done.length > 0) parts.push(`${plural(tasks.done.length, "task")} done`);
  if (mood.mostCommon) parts.push(`mood mostly ${mood.mostCommon}`);
  if (money.totals.expense > 0) parts.push(`spent ${fmt(money.totals.expense)}`);
  if (money.totals.income > 0) parts.push(`earned ${fmt(money.totals.income)}`);
  return parts.length > 0 ? parts.join(" · ") : "Nothing logged this week.";
}
