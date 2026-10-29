// Date helpers shared across the dashboard. All formatting is LOCAL-time on
// purpose: `Date.toISOString()` converts to UTC and can shift the calendar day
// backward for users in positive-offset timezones (e.g. UTC+8), which would
// file an expense or journal entry under the wrong date.

/** Local-time `YYYY-MM-DD` for a given date. */
export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Local-time `YYYY-MM-DD` for today. */
export function todayISO(): string {
  return toISODate(new Date());
}

/** Human-readable date, e.g. "Jul 14, 2026". Local-time, like every format here. */
export function formatDate(iso: string): string {
  return fromISODate(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Parses a `YYYY-MM-DD` string into a Date at LOCAL midnight. The explicit
 * `T00:00:00` matters: `new Date("2026-05-27")` is parsed as UTC midnight and
 * renders as the previous day west of Greenwich.
 */
export function fromISODate(iso: string): Date {
  return new Date(`${iso}T00:00:00`);
}

// The display formats below take a Date or a `YYYY-MM-DD` string, and format in
// the VIEWER's locale (`undefined`) rather than a hardcoded one.
function asDate(value: Date | string): Date {
  return typeof value === "string" ? fromISODate(value) : value;
}

/** "May 27, 2026" — full month name. */
export function formatLongDate(value: Date | string): string {
  return asDate(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** "Wednesday" — the day of the week on its own. */
export function formatWeekday(value: Date | string): string {
  return asDate(value).toLocaleDateString(undefined, { weekday: "long" });
}

/** "Wednesday, May 27" — the current-day heading, no year. */
export function formatDayLabel(value: Date | string): string {
  return asDate(value).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

/** "Wednesday, May 27, 2026" — same, with the year, for other days. */
export function formatFullDayLabel(value: Date | string): string {
  return asDate(value).toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** First and last day of the month containing `date`, as `YYYY-MM-DD`. */
export function monthRange(date: Date): { from: string; to: string } {
  const y = date.getFullYear();
  const m = date.getMonth();
  // Day 0 of the next month is the last day of this one.
  return { from: toISODate(new Date(y, m, 1)), to: toISODate(new Date(y, m + 1, 0)) };
}

/** "September" — the month name on its own. */
export function formatMonthName(value: Date | string): string {
  return asDate(value).toLocaleDateString(undefined, { month: "long" });
}

/**
 * The calendar grid for one month: rows of seven, each cell a `YYYY-MM-DD`
 * string or `null` where the row is padding before the 1st or after the last
 * day. `month` is zero-based like `Date.getMonth()`. Weeks start on Monday by
 * default (`firstDayOfWeek = 1`); pass `0` for Sunday.
 */
export function monthGrid(
  year: number,
  month: number,
  firstDayOfWeek: 0 | 1 = 1
): (string | null)[][] {
  let lead = new Date(year, month, 1).getDay() - firstDayOfWeek;
  if (lead < 0) lead += 7;
  const length = daysInMonth(year, month);

  const cells: (string | null)[] = Array(lead).fill(null);
  for (let day = 1; day <= length; day++) {
    cells.push(toISODate(new Date(year, month, day)));
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const rows: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return rows;
}

/** `YYYY-MM` — the prefix every date in a given month shares. */
export function monthPrefix(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

/**
 * The same day-of-month as `iso`, moved into another month and clamped to
 * that month's length: the 31st becomes the 30th in June and the 28th or
 * 29th in February. Used when the calendar flips months so the selected
 * day travels with it instead of pointing at a month that is off screen.
 */
export function sameDayInMonth(iso: string, year: number, month: number): string {
  const day = Number(iso.slice(-2));
  return toISODate(new Date(year, month, Math.min(day, daysInMonth(year, month))));
}

/** How many days a month has; `month` is zero-based. Day 0 of the next month is the last of this one. */
export function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/** `iso` moved by `days` (negative to go back), as `YYYY-MM-DD`. */
export function addDays(iso: string, days: number): string {
  const date = fromISODate(iso);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

/** Whole days from `from` to `to`; negative when `to` is earlier. */
export function daysBetween(from: string, to: string): number {
  const ms = fromISODate(to).getTime() - fromISODate(from).getTime();
  // Round, not floor: a DST change makes one day 23 or 25 hours long.
  return Math.round(ms / 86_400_000);
}

/** "Nov 2" — month and day only, for the start of a range whose end carries the year. */
export function formatMonthDay(value: Date | string): string {
  return asDate(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
