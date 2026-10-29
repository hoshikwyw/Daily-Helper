import { addDays, daysBetween, daysInMonth, fromISODate, mondayOf, toISODate } from "@/lib/date";
import { MONTHS } from "@/lib/expenses";
import type { Recurrence, RecurrenceCadence } from "@/lib/types";

// The scheduling maths behind recurring money entries and tasks. Pure and
// date-string based (`YYYY-MM-DD`, local calendar days) so it can be tested
// without a clock or a database. The sync in lib/api/recurrences.ts asks these
// functions what to create; the database's unique index makes creating safe.

/** The fields that decide when a rule fires. */
export type Schedule = Pick<
  Recurrence,
  "cadence" | "every" | "weekday" | "weekdays" | "day_of_month" | "month" | "start_date" | "end_date"
>;

/** Monday to Friday, in the 0 = Sunday numbering. */
export const WEEKDAYS_MON_FRI = [1, 2, 3, 4, 5];

export const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Sorted, unique, and only real weekdays 0-6; anything else (NaN, 7, null) is dropped. */
export function normaliseDays(days: readonly (number | null)[]): number[] {
  const valid = days.filter((d): d is number => Number.isInteger(d) && d! >= 0 && d! <= 6);
  return [...new Set(valid)].sort((a, b) => a - b);
}

/** The days a weekly rule fires on; the start weekday when none is set. */
export function weeklyDays(schedule: Schedule): number[] {
  const days = schedule.weekdays ? normaliseDays(schedule.weekdays) : [];
  if (days.length > 0) return days;
  return [schedule.weekday ?? fromISODate(schedule.start_date).getDay()];
}

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
  let result: string | null = null;

  switch (schedule.cadence) {
    case "daily": {
      const steps = Math.ceil(daysBetween(schedule.start_date, from) / every);
      result = addDays(schedule.start_date, steps * every);
      break;
    }
    case "weekly": {
      // The first firing week is the one holding the first chosen day on or
      // after the start; with a step of N, every Nth week from there fires.
      // Anchoring on that first occurrence (not the start date) keeps the
      // phase of a single-day rule that starts mid-week, e.g. "Mondays,
      // fortnightly" created on a Wednesday fires the coming Monday first.
      // Within a firing week any chosen day counts, so walk day by day; the
      // bound guarantees a hit: a full step of weeks plus one more week.
      const days = weeklyDays(schedule);
      let anchor = schedule.start_date;
      while (!days.includes(fromISODate(anchor).getDay())) anchor = addDays(anchor, 1);
      const anchorMonday = mondayOf(anchor);
      let cursor = from > anchor ? from : anchor;
      for (let i = 0; i < 7 * every + 7; i++) {
        const weeksFromAnchor = Math.floor(daysBetween(anchorMonday, cursor) / 7);
        if (days.includes(fromISODate(cursor).getDay()) && weeksFromAnchor % every === 0) {
          result = cursor;
          break;
        }
        cursor = addDays(cursor, 1);
      }
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

  if (result === null) return null;
  if (schedule.end_date && result > schedule.end_date) return null;
  return result;
}

/** The first occurrence strictly after `date`, or null when the rule has ended. */
export function nextOccurrence(schedule: Schedule, date: string): string | null {
  return occurrenceOnOrAfter(schedule, addDays(date, 1));
}

/**
 * The first date a new rule fires: what its `next_due` should be stored as.
 * Not simply the start date — a weekdays rule started on a Saturday first
 * fires on Monday. Falls back to the start date for a rule that can never
 * fire, so the sync retires it instead of a bad row being written.
 */
export function firstOccurrence(schedule: Schedule): string {
  return occurrenceOnOrAfter(schedule, schedule.start_date) ?? schedule.start_date;
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
    weekdays: null,
    day_of_month: cadence === "monthly" || cadence === "yearly" ? d.getDate() : null,
    month: cadence === "yearly" ? d.getMonth() + 1 : null,
    start_date: date,
    end_date: null,
  };
}

/** A weekly schedule on a chosen set of days, from `date` onwards. */
export function scheduleOnWeekdays(days: number[], date: string): Schedule {
  return {
    ...scheduleFromDate("weekly", date),
    weekday: null,
    weekdays: normaliseDays(days),
  };
}

// ── What a form's "Repeat" chips produce ────────────────────────────────────

export type RepeatMode = "never" | "daily" | "weekdays" | "weekly" | "monthly" | "yearly" | "custom";

/** The user's pick; `days` only matters for "custom". */
export type RepeatChoice = { mode: RepeatMode; days: number[] };

export const NO_REPEAT: RepeatChoice = { mode: "never", days: [] };

export const REPEAT_MODES: { value: RepeatMode; label: string }[] = [
  { value: "never", label: "Never" },
  { value: "daily", label: "Daily" },
  { value: "weekdays", label: "Weekdays" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
  { value: "custom", label: "Custom days" },
];

/** False only for "custom" with no real day picked, which cannot become a rule. */
export function isRepeatComplete(choice: RepeatChoice): boolean {
  return choice.mode !== "custom" || normaliseDays(choice.days).length > 0;
}

/**
 * The schedule for a choice anchored on `date`, or null for "never" and for
 * an incomplete custom pick. "Weekdays" is a weekly rule on Monday to Friday.
 */
export function buildSchedule(choice: RepeatChoice, date: string): Schedule | null {
  switch (choice.mode) {
    case "never":
      return null;
    case "weekdays":
      return scheduleOnWeekdays(WEEKDAYS_MON_FRI, date);
    case "custom":
      return normaliseDays(choice.days).length > 0 ? scheduleOnWeekdays(choice.days, date) : null;
    default:
      return scheduleFromDate(choice.mode, date);
  }
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
    case "weekly": {
      const days = weeklyDays(schedule);
      if (days.length === 1) return `${lead} on ${WEEKDAY_NAMES[days[0]]}`;
      if (every === 1 && days.length === 7) return "Every day";
      if (every === 1 && days.join() === WEEKDAYS_MON_FRI.join()) return "Weekdays";
      return `${lead} on ${days.map((d) => WEEKDAY_SHORT[d]).join(", ")}`;
    }
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
