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

/** Human-readable date, e.g. "Jul 14, 2026". */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
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
