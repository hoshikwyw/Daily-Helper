import { describe, expect, it } from "vitest";
import { fromISODate, monthRange, toISODate, todayISO } from "@/lib/date";

// Every helper here formats in LOCAL time on purpose. `Date.toISOString()` and
// `new Date("2026-05-27")` both work in UTC, which shifts the calendar day
// backwards for anyone east of Greenwich — filing an expense or a journal entry
// under the wrong date. These tests pin that behaviour down.
describe("local-time date handling", () => {
  it("formats a Date as its LOCAL calendar day", () => {
    // Late evening local time — toISOString() would report the next day for
    // anyone behind UTC, and the previous day is the risk going the other way.
    const evening = new Date(2026, 4, 27, 23, 30);
    expect(toISODate(evening)).toBe("2026-05-27");
  });

  it("formats an early-morning Date as the same local day", () => {
    const earlyMorning = new Date(2026, 4, 27, 0, 30);
    expect(toISODate(earlyMorning)).toBe("2026-05-27");
  });

  it("pads single-digit months and days", () => {
    expect(toISODate(new Date(2026, 0, 5))).toBe("2026-01-05");
  });

  it("parses a date string to LOCAL midnight, not UTC midnight", () => {
    const parsed = fromISODate("2026-05-27");
    expect(parsed.getFullYear()).toBe(2026);
    expect(parsed.getMonth()).toBe(4);
    expect(parsed.getDate()).toBe(27);
    expect(parsed.getHours()).toBe(0);
  });

  it("round-trips a date string unchanged", () => {
    for (const iso of ["2026-01-01", "2026-05-27", "2026-12-31"]) {
      expect(toISODate(fromISODate(iso))).toBe(iso);
    }
  });

  it("agrees with the current local day", () => {
    expect(todayISO()).toBe(toISODate(new Date()));
  });
});

describe("monthRange", () => {
  it("spans the first to the last day of the month", () => {
    expect(monthRange(new Date(2026, 8, 15))).toEqual({
      from: "2026-09-01",
      to: "2026-09-30",
    });
  });

  it("handles a 31-day month", () => {
    expect(monthRange(new Date(2026, 0, 20))).toEqual({
      from: "2026-01-01",
      to: "2026-01-31",
    });
  });

  it("handles February in a leap year", () => {
    expect(monthRange(new Date(2028, 1, 10))).toEqual({
      from: "2028-02-01",
      to: "2028-02-29",
    });
  });

  it("handles February in a non-leap year", () => {
    expect(monthRange(new Date(2026, 1, 10))).toEqual({
      from: "2026-02-01",
      to: "2026-02-28",
    });
  });

  it("includes a date that sits on the last day of the month", () => {
    const range = monthRange(new Date(2026, 8, 30));
    expect(range.to).toBe("2026-09-30");
  });
});
