import { addDays, daysBetween, daysInMonth, fromISODate, toISODate } from "@/lib/date";
import { MONTHS } from "@/lib/expenses";
import type { Recurrence, RecurrenceCadence } from "@/lib/types";

// The scheduling maths behind recurring money entries and tasks. Pure and
// date-string based (`YYYY-MM-DD`, local calendar days) so it can be tested
// without a clock or a database. The sync in lib/api/recurrences.ts asks these
// functions what to create; the database's unique index makes creating safe.

/** The fields that decide when a rule fires. */
export type Schedule = Pick<
  Recurrence,
  "cadence" | "every" | "weekday" | "day_of_month" | "month" | "start_date" | "end_date"
>;

export const CADENCES: { value: RecurrenceCadence; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

/**
 * How far back the sync will create missed occurrences. Long enough to cover
 * a realistic gap away from the app; short enough that a forgotten rule
 * cannot flood a table with years of rows.
 */
export const MAX_BACKFILL_DAYS = 365;

const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** The `day`th of a month, clamped to the month's length. `monthIndex` may overflow the year. */
function clampedDate(year: number, monthIndex: number, day: number): string {
  // Normalise the overflowing month first so the clamp uses the right length.
  const probe = new Date(year, monthIndex, 1);
  const y = probe.getFullYear();
  const m = probe.getMonth();
  return toISODate(new Date(y, m, Math.min(day, daysInMonth(y, m))));
}

/**
 * The first occurrence on or after `date`, or null when the rule has ended
 * before then. Never earlier than the rule's start date.
 */
export function occurrenceOnOrAfter(schedule: Schedule, date: string): string | null {
  const from = date > schedule.start_date ? date : schedule.start_date;
  const every = Math.max(1, schedule.every);
  const start = fromISODate(schedule.start_date);
  let result: string;

  switch (schedule.cadence) {
    case "daily": {
      const steps = Math.ceil(daysBetween(schedule.start_date, from) / every);
      result = addDays(schedule.start_date, steps * every);
      break;
    }
    case "weekly": {
      // Anchor on the first date from the start with the right weekday, then
      // step whole weeks from there.
      const weekday = schedule.weekday ?? start.getDay();
      const anchor = addDays(schedule.start_date, (weekday - start.getDay() + 7) % 7);
      const gap = Math.max(0, daysBetween(anchor, from));
      const steps = Math.ceil(gap / (7 * every));
      result = addDays(anchor, steps * 7 * every);
      break;
    }
    case "monthly": {
      const day = schedule.day_of_month ?? start.getDate();
      const target = fromISODate(from);
      const months =
        (target.getFullYear() - start.getFullYear()) * 12 + (target.getMonth() - start.getMonth());
      // Snap down to the step, then walk forward until on or after `from`.
      let i = Math.max(0, Math.floor(months / every)) * every;
      result = clampedDate(start.getFullYear(), start.getMonth() + i, day);
      while (result < from) {
        i += every;
        result = clampedDate(start.getFullYear(), start.getMonth() + i, day);
      }
      break;
    }
    case "yearly": {
      const monthIndex = (schedule.month ?? start.getMonth() + 1) - 1;
      const day = schedule.day_of_month ?? start.getDate();
      const years = fromISODate(from).getFullYear() - start.getFullYear();
      let i = Math.max(0, Math.floor(years / every)) * every;
      result = clampedDate(start.getFullYear() + i, monthIndex, day);
      while (result < from) {
        i += every;
        result = clampedDate(start.getFullYear() + i, monthIndex, day);
      }
      break;
    }
  }

  if (schedule.end_date && result > schedule.end_date) return null;
  return result;
}

/** The first occurrence strictly after `date`, or null when the rule has ended. */
export function nextOccurrence(schedule: Schedule, date: string): string | null {
  return occurrenceOnOrAfter(schedule, addDays(date, 1));
}

/**
 * Every occurrence the sync should create as of `today`: from the rule's
 * `next_due` up to and including today, oldest first. A rule neglected for
 * longer than the backfill window starts from the window's edge instead.
 * Paused rules produce nothing.
 */
export function occurrencesDue(
  rule: Schedule & { next_due: string; active: boolean },
  today: string
): string[] {
  if (!rule.active) return [];
  const floor = addDays(today, -MAX_BACKFILL_DAYS);
  let cursor = occurrenceOnOrAfter(rule, rule.next_due > floor ? rule.next_due : floor);
  const due: string[] = [];
  while (cursor !== null && cursor <= today) {
    due.push(cursor);
    cursor = nextOccurrence(rule, cursor);
  }
  return due;
}

/**
 * What `next_due` should be once everything up to `today` has been created:
 * unchanged if it is still in the future, otherwise the first occurrence
 * after today. Null means the rule has run past its end date.
 */
export function advanceNextDue(rule: Schedule & { next_due: string }, today: string): string | null {
  if (rule.next_due > today) return rule.next_due;
  return nextOccurrence(rule, today);
}

/**
 * The natural schedule for a cadence anchored on a chosen date: weekly on
 * that weekday, monthly on that day, yearly on that day and month. This is
 * what the "Repeat" chips in a form produce.
 */
export function scheduleFromDate(cadence: RecurrenceCadence, date: string): Schedule {
  const d = fromISODate(date);
  return {
    cadence,
    every: 1,
    weekday: cadence === "weekly" ? d.getDay() : null,
    day_of_month: cadence === "monthly" || cadence === "yearly" ? d.getDate() : null,
    month: cadence === "yearly" ? d.getMonth() + 1 : null,
    start_date: date,
    end_date: null,
  };
}

/** 1 → "1st", 22 → "22nd", 13 → "13th". */
export function ordinal(n: number): string {
  const tens = n % 100;
  if (tens >= 11 && tens <= 13) return `${n}th`;
  const suffix = { 1: "st", 2: "nd", 3: "rd" }[n % 10] ?? "th";
  return `${n}${suffix}`;
}

/**
 * The rule in plain words: "Daily", "Weekly on Monday", "Monthly on the
 * 31st", "Yearly on 1 November", or "Every 2 weeks on Monday".
 */
export function describeSchedule(schedule: Schedule): string {
  const start = fromISODate(schedule.start_date);
  const every = Math.max(1, schedule.every);
  const unit = { daily: "day", weekly: "week", monthly: "month", yearly: "year" }[schedule.cadence];
  const lead =
    every === 1
      ? { daily: "Daily", weekly: "Weekly", monthly: "Monthly", yearly: "Yearly" }[schedule.cadence]
      : `Every ${every} ${unit}s`;

  switch (schedule.cadence) {
    case "daily":
      return lead;
    case "weekly":
      return `${lead} on ${WEEKDAY_NAMES[schedule.weekday ?? start.getDay()]}`;
    case "monthly":
      return `${lead} on the ${ordinal(schedule.day_of_month ?? start.getDate())}`;
    case "yearly": {
      const day = schedule.day_of_month ?? start.getDate();
      const month = MONTHS[(schedule.month ?? start.getMonth() + 1) - 1];
      return `${lead} on ${day} ${month}`;
    }
  }
}

/**
 * The next few things a set of rules will create, soonest first: active rules
 * only, ordered by `next_due`. For the "Upcoming" line on the Today page.
 */
export function upcomingRules<T extends { active: boolean; next_due: string }>(
  rules: T[],
  limit = 3
): T[] {
  return rules
    .filter((rule) => rule.active)
    .sort((a, b) => (a.next_due < b.next_due ? -1 : a.next_due > b.next_due ? 1 : 0))
    .slice(0, limit);
}
