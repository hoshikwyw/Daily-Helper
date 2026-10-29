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
  /**
   * The longest run within the dates given. Callers load the last
   * `STREAK_WINDOW_DAYS`, so this is "best in about a year", not all time.
   */
  best: number;
};

/**
 * Current and best streak from the dates a habit was done. Dates after
 * `today` are ignored: a check filed under tomorrow (a device clock ahead of
 * this one) must not extend either figure.
 *
 * An unchecked today does not break the streak: until the day is over there
 * is still time, so the count only drops once yesterday is also missing.
 */
export function computeStreak(dates: Iterable<string>, today: string): Streak {
  const done = new Set([...dates].filter((date) => date <= today));

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

/** Whether one more habit may become active without passing the limit. */
export function canActivate(habits: Habit[]): boolean {
  return activeHabits(habits).length < MAX_ACTIVE_HABITS;
}

/**
 * The active habits in their current order with `index` moved by `delta`,
 * as a list of ids. Positions are then rewritten to match the list index, so
 * a reorder also repairs any duplicate or gapped positions.
 */
export function reorderedIds(habits: Habit[], index: number, delta: -1 | 1): string[] {
  const ids = activeHabits(habits).map((h) => h.id);
  const target = index + delta;
  if (index < 0 || index >= ids.length || target < 0 || target >= ids.length) return ids;
  [ids[index], ids[target]] = [ids[target], ids[index]];
  return ids;
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
