import { describe, expect, it } from "vitest";
import {
  addDays,
  daysBetween,
  daysInMonth,
  fromISODate,
  monthGrid,
  monthPrefix,
  monthRange,
  sameDayInMonth,
  toISODate,
  todayISO,
} from "@/lib/date";

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

describe("monthGrid", () => {
  it("pads the first row so the 1st lands on its weekday", () => {
    // 1 October 2026 is a Thursday; with Monday first that is three empty cells.
    const rows = monthGrid(2026, 9);
    expect(rows[0]).toEqual([null, null, null, "2026-10-01", "2026-10-02", "2026-10-03", "2026-10-04"]);
  });

  it("starts the week on Sunday when asked", () => {
    const rows = monthGrid(2026, 9, 0);
    expect(rows[0]).toEqual([null, null, null, null, "2026-10-01", "2026-10-02", "2026-10-03"]);
  });

  it("always produces full rows of seven", () => {
    for (let month = 0; month < 12; month++) {
      for (const row of monthGrid(2026, month)) expect(row).toHaveLength(7);
    }
  });

  it("lists every day of the month exactly once", () => {
    const days = monthGrid(2028, 1).flat().filter((d): d is string => d !== null);
    expect(days).toHaveLength(29);
    expect(days[0]).toBe("2028-02-01");
    expect(days[28]).toBe("2028-02-29");
  });

  it("needs six rows when a long month starts late in the week", () => {
    // August 2026 starts on a Saturday and has 31 days.
    expect(monthGrid(2026, 7)).toHaveLength(6);
  });

  it("fits a month that starts on the first weekday into fewer rows", () => {
    // June 2026 starts on a Monday and has 30 days: 5 rows.
    expect(monthGrid(2026, 5)).toHaveLength(5);
  });
});

describe("monthPrefix", () => {
  it("zero-pads the month and matches toISODate", () => {
    expect(monthPrefix(2026, 0)).toBe("2026-01");
    expect(toISODate(new Date(2026, 0, 9)).startsWith(monthPrefix(2026, 0))).toBe(true);
  });
});

describe("sameDayInMonth", () => {
  it("keeps the day number when the target month has it", () => {
    expect(sameDayInMonth("2026-10-24", 2026, 8)).toBe("2026-09-24");
  });

  it("clamps the 31st to a shorter month", () => {
    expect(sameDayInMonth("2026-10-31", 2026, 10)).toBe("2026-11-30");
  });

  it("clamps into February, respecting leap years", () => {
    expect(sameDayInMonth("2026-01-30", 2026, 1)).toBe("2026-02-28");
    expect(sameDayInMonth("2028-01-30", 2028, 1)).toBe("2028-02-29");
  });

  it("moves across a year boundary", () => {
    expect(sameDayInMonth("2026-01-15", 2025, 11)).toBe("2025-12-15");
  });
});

describe("daysInMonth", () => {
  it("knows the long, short, and February months", () => {
    expect(daysInMonth(2026, 0)).toBe(31);
    expect(daysInMonth(2026, 3)).toBe(30);
    expect(daysInMonth(2026, 1)).toBe(28);
    expect(daysInMonth(2028, 1)).toBe(29);
  });

  it("agrees with monthRange", () => {
    for (let month = 0; month < 12; month++) {
      const last = Number(monthRange(new Date(2026, month, 1)).to.slice(-2));
      expect(daysInMonth(2026, month)).toBe(last);
    }
  });
});

describe("addDays and daysBetween", () => {
  it("crosses month and year boundaries", () => {
    expect(addDays("2026-01-31", 1)).toBe("2026-02-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(addDays("2028-03-01", -1)).toBe("2028-02-29");
  });

  it("counts whole days in either direction", () => {
    expect(daysBetween("2026-01-01", "2026-01-31")).toBe(30);
    expect(daysBetween("2026-01-31", "2026-01-01")).toBe(-30);
    expect(daysBetween("2026-05-27", "2026-05-27")).toBe(0);
  });

  it("round-trips: addDays by the gap lands on the target", () => {
    expect(addDays("2026-02-10", daysBetween("2026-02-10", "2027-02-10"))).toBe("2027-02-10");
  });
});
