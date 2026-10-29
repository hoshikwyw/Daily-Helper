import { addDays, daysBetween } from "@/lib/date";
import type { Habit, HabitCheck } from "@/lib/types";

// Domain helpers for daily habits. Pure functions over the habit rows and
// their check dates; streaks are always computed here, never stored.

/** Active habits allowed at once, so the chip row stays tappable on a phone. */
export const MAX_ACTIVE_HABITS = 8;

/** How many days of checks the Today page loads: enough for any realistic streak. */
export const STREAK_WINDOW_DAYS = 400;

export const DEFAULT_HABIT_EMOJI = "✅";

export type Streak = {
  /** Consecutive days up to today (or yesterday, if today is not yet done). */
  current: number;
  /** The longest run on record. */
  best: number;
};

/**
 * Current and best streak from the dates a habit was done.
 *
 * An unchecked today does not break the streak: until the day is over there
 * is still time, so the count only drops once yesterday is also missing.
 */
export function computeStreak(dates: Iterable<string>, today: string): Streak {
  const done = new Set(dates);

  let current = 0;
  let cursor = done.has(today) ? today : addDays(today, -1);
  while (done.has(cursor)) {
    current++;
    cursor = addDays(cursor, -1);
  }

  let best = 0;
  let run = 0;
  let previous: string | null = null;
  for (const date of [...done].sort()) {
    run = previous !== null && daysBetween(previous, date) === 1 ? run + 1 : 1;
    if (run > best) best = run;
    previous = date;
  }

  return { current, best };
}

/** The dates each habit was done, keyed by habit id. */
export function checksByHabit(checks: HabitCheck[]): Record<string, string[]> {
  const byHabit: Record<string, string[]> = {};
  for (const check of checks) (byHabit[check.habit_id] ??= []).push(check.date);
  return byHabit;
}

/** Unarchived habits in chip order: by position, then name for ties. */
export function activeHabits(habits: Habit[]): Habit[] {
  return habits
    .filter((h) => !h.archived)
    .sort((a, b) => a.position - b.position || a.name.localeCompare(b.name));
}

export type HabitStatus = {
  habit: Habit;
  doneToday: boolean;
  streak: Streak;
};

/** Everything a habit chip shows, for each active habit in order. */
export function habitStatuses(habits: Habit[], checks: HabitCheck[], today: string): HabitStatus[] {
  const dates = checksByHabit(checks);
  return activeHabits(habits).map((habit) => {
    const own = dates[habit.id] ?? [];
    return { habit, doneToday: own.includes(today), streak: computeStreak(own, today) };
  });
}

/** How many of the active habits are done today. */
export function doneTodayCount(statuses: HabitStatus[]): number {
  return statuses.filter((s) => s.doneToday).length;
}
