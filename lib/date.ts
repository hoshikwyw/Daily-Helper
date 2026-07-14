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
