import { describe, expect, it } from "vitest";
import {
  MAX_BACKFILL_DAYS,
  advanceNextDue,
  describeSchedule,
  nextOccurrence,
  occurrenceOnOrAfter,
  occurrencesDue,
  ordinal,
  scheduleFromDate,
  upcomingRules,
  type Schedule,
} from "@/lib/recurrence";
import { addDays } from "@/lib/date";

// Rules are built with the defaults a form would produce, then overridden.
function schedule(overrides: Partial<Schedule> & Pick<Schedule, "cadence" | "start_date">): Schedule {
  return {
    every: 1,
    weekday: null,
    day_of_month: null,
    month: null,
    end_date: null,
    ...overrides,
  };
}

describe("occurrenceOnOrAfter", () => {
  describe("daily", () => {
    const daily = schedule({ cadence: "daily", start_date: "2026-11-01" });

    it("is the date itself once the rule has started", () => {
      expect(occurrenceOnOrAfter(daily, "2026-11-05")).toBe("2026-11-05");
    });

    it("never fires before the start date", () => {
      expect(occurrenceOnOrAfter(daily, "2026-10-20")).toBe("2026-11-01");
    });

    it("honours a step of several days", () => {
      const everyThird = schedule({ cadence: "daily", start_date: "2026-11-01", every: 3 });
      expect(occurrenceOnOrAfter(everyThird, "2026-11-02")).toBe("2026-11-04");
      expect(occurrenceOnOrAfter(everyThird, "2026-11-04")).toBe("2026-11-04");
    });
  });

  describe("weekly", () => {
    // 2026-11-04 is a Wednesday; weekday 1 is Monday.
    const mondays = schedule({ cadence: "weekly", start_date: "2026-11-04", weekday: 1 });

    it("anchors on the first matching weekday after the start", () => {
      expect(occurrenceOnOrAfter(mondays, "2026-11-04")).toBe("2026-11-09");
    });

    it("lands on the weekday every week after that", () => {
      expect(occurrenceOnOrAfter(mondays, "2026-11-10")).toBe("2026-11-16");
      expect(occurrenceOnOrAfter(mondays, "2026-11-16")).toBe("2026-11-16");
    });

    it("uses the start date's weekday when none is given", () => {
      const wednesdays = schedule({ cadence: "weekly", start_date: "2026-11-04" });
      expect(occurrenceOnOrAfter(wednesdays, "2026-11-05")).toBe("2026-11-11");
    });

    it("steps whole fortnights", () => {
      const fortnightly = schedule({ cadence: "weekly", start_date: "2026-11-02", weekday: 1, every: 2 });
      expect(occurrenceOnOrAfter(fortnightly, "2026-11-03")).toBe("2026-11-16");
    });
  });

  describe("monthly", () => {
    it("fires on the given day each month", () => {
      const first = schedule({ cadence: "monthly", start_date: "2026-11-01", day_of_month: 1 });
      expect(occurrenceOnOrAfter(first, "2026-11-01")).toBe("2026-11-01");
      expect(occurrenceOnOrAfter(first, "2026-11-02")).toBe("2026-12-01");
      expect(occurrenceOnOrAfter(first, "2026-12-31")).toBe("2027-01-01");
    });

    it("skips to next month when the start is already past the day", () => {
      const first = schedule({ cadence: "monthly", start_date: "2026-11-15", day_of_month: 1 });
      expect(occurrenceOnOrAfter(first, "2026-11-15")).toBe("2026-12-01");
    });

    it("clamps the 31st to short months and springs back after", () => {
      const thirtyFirst = schedule({ cadence: "monthly", start_date: "2026-01-31", day_of_month: 31 });
      expect(occurrenceOnOrAfter(thirtyFirst, "2026-02-01")).toBe("2026-02-28");
      expect(occurrenceOnOrAfter(thirtyFirst, "2026-03-01")).toBe("2026-03-31");
      expect(occurrenceOnOrAfter(thirtyFirst, "2026-04-01")).toBe("2026-04-30");
      expect(occurrenceOnOrAfter(thirtyFirst, "2028-02-01")).toBe("2028-02-29");
    });

    it("steps several months at a time", () => {
      const quarterly = schedule({ cadence: "monthly", start_date: "2026-01-10", day_of_month: 10, every: 3 });
      expect(occurrenceOnOrAfter(quarterly, "2026-02-01")).toBe("2026-04-10");
      expect(occurrenceOnOrAfter(quarterly, "2026-04-11")).toBe("2026-07-10");
    });
  });

  describe("yearly", () => {
    const birthday = schedule({ cadence: "yearly", start_date: "2026-11-01", day_of_month: 1, month: 11 });

    it("fires once a year on the day and month", () => {
      expect(occurrenceOnOrAfter(birthday, "2026-11-01")).toBe("2026-11-01");
      expect(occurrenceOnOrAfter(birthday, "2026-11-02")).toBe("2027-11-01");
    });

    it("clamps 29 February to the 28th in a common year", () => {
      const leap = schedule({ cadence: "yearly", start_date: "2028-02-29", day_of_month: 29, month: 2 });
      expect(occurrenceOnOrAfter(leap, "2029-01-01")).toBe("2029-02-28");
      expect(occurrenceOnOrAfter(leap, "2032-01-01")).toBe("2032-02-29");
    });
  });

  it("returns null once the end date has passed", () => {
    const ended = schedule({ cadence: "daily", start_date: "2026-11-01", end_date: "2026-11-03" });
    expect(occurrenceOnOrAfter(ended, "2026-11-03")).toBe("2026-11-03");
    expect(occurrenceOnOrAfter(ended, "2026-11-04")).toBeNull();
  });
});

describe("nextOccurrence", () => {
  it("is strictly after the given date", () => {
    const daily = schedule({ cadence: "daily", start_date: "2026-11-01" });
    expect(nextOccurrence(daily, "2026-11-05")).toBe("2026-11-06");
    const monthly = schedule({ cadence: "monthly", start_date: "2026-11-01", day_of_month: 1 });
    expect(nextOccurrence(monthly, "2026-11-01")).toBe("2026-12-01");
  });
});

describe("occurrencesDue", () => {
  const rent = {
    ...schedule({ cadence: "monthly", start_date: "2026-11-01", day_of_month: 1 }),
    next_due: "2026-11-01",
    active: true,
  };

  it("creates nothing before the first occurrence", () => {
    expect(occurrencesDue(rent, "2026-10-30")).toEqual([]);
  });

  it("creates the one occurrence that fell due", () => {
    expect(occurrencesDue(rent, "2026-11-03")).toEqual(["2026-11-01"]);
  });

  it("backfills every occurrence missed while the app was closed", () => {
    expect(occurrencesDue(rent, "2027-02-15")).toEqual([
      "2026-11-01",
      "2026-12-01",
      "2027-01-01",
      "2027-02-01",
    ]);
  });

  it("includes an occurrence falling on today", () => {
    expect(occurrencesDue(rent, "2026-12-01")).toEqual(["2026-11-01", "2026-12-01"]);
  });

  it("produces nothing for a paused rule", () => {
    expect(occurrencesDue({ ...rent, active: false }, "2027-02-15")).toEqual([]);
  });

  it("stops at the end date", () => {
    const shortLived = { ...rent, end_date: "2026-12-15" };
    expect(occurrencesDue(shortLived, "2027-03-01")).toEqual(["2026-11-01", "2026-12-01"]);
  });

  it("limits backfill to the window for a long-neglected rule", () => {
    const daily = {
      ...schedule({ cadence: "daily", start_date: "2020-01-01" }),
      next_due: "2020-01-01",
      active: true,
    };
    const today = "2026-11-01";
    const due = occurrencesDue(daily, today);
    expect(due).toHaveLength(MAX_BACKFILL_DAYS + 1);
    expect(due[0]).toBe(addDays(today, -MAX_BACKFILL_DAYS));
    expect(due[due.length - 1]).toBe(today);
  });
});

describe("advanceNextDue", () => {
  const rent = {
    ...schedule({ cadence: "monthly", start_date: "2026-11-01", day_of_month: 1 }),
    next_due: "2026-11-01",
  };

  it("leaves a future next_due alone", () => {
    expect(advanceNextDue(rent, "2026-10-20")).toBe("2026-11-01");
  });

  it("moves to the first occurrence after today once due", () => {
    expect(advanceNextDue(rent, "2026-11-03")).toBe("2026-12-01");
    expect(advanceNextDue(rent, "2027-02-15")).toBe("2027-03-01");
  });

  it("is null when the rule has ended", () => {
    expect(advanceNextDue({ ...rent, end_date: "2026-11-30" }, "2026-11-03")).toBeNull();
  });
});

describe("scheduleFromDate", () => {
  // 2026-11-04 is a Wednesday.
  it("anchors each cadence on the chosen date", () => {
    expect(scheduleFromDate("daily", "2026-11-04")).toMatchObject({
      cadence: "daily",
      weekday: null,
      day_of_month: null,
      month: null,
      start_date: "2026-11-04",
    });
    expect(scheduleFromDate("weekly", "2026-11-04")).toMatchObject({ weekday: 3 });
    expect(scheduleFromDate("monthly", "2026-11-04")).toMatchObject({ day_of_month: 4, month: null });
    expect(scheduleFromDate("yearly", "2026-11-04")).toMatchObject({ day_of_month: 4, month: 11 });
  });

  it("fires first on the chosen date itself", () => {
    for (const cadence of ["daily", "weekly", "monthly", "yearly"] as const) {
      const s = scheduleFromDate(cadence, "2026-11-04");
      expect(occurrenceOnOrAfter(s, "2026-11-04")).toBe("2026-11-04");
    }
  });
});

describe("ordinal", () => {
  it("handles the teens and the usual suffixes", () => {
    expect([1, 2, 3, 4, 11, 12, 13, 21, 22, 23, 31].map(ordinal)).toEqual([
      "1st", "2nd", "3rd", "4th", "11th", "12th", "13th", "21st", "22nd", "23rd", "31st",
    ]);
  });
});

describe("describeSchedule", () => {
  it("reads naturally for each cadence", () => {
    expect(describeSchedule(scheduleFromDate("daily", "2026-11-04"))).toBe("Daily");
    expect(describeSchedule(scheduleFromDate("weekly", "2026-11-04"))).toBe("Weekly on Wednesday");
    expect(describeSchedule(scheduleFromDate("monthly", "2026-11-01"))).toBe(
      "Monthly on the 1st"
    );
    expect(describeSchedule(scheduleFromDate("yearly", "2026-11-04"))).toBe("Yearly on 4 November");
  });

  it("spells out a step greater than one", () => {
    expect(describeSchedule({ ...scheduleFromDate("weekly", "2026-11-02"), every: 2 })).toBe(
      "Every 2 weeks on Monday"
    );
  });
});

describe("upcomingRules", () => {
  const rules = [
    { id: "salary", active: true, next_due: "2026-12-05" },
    { id: "rent", active: true, next_due: "2026-12-01" },
    { id: "gym", active: false, next_due: "2026-11-30" },
    { id: "phone", active: true, next_due: "2026-12-10" },
    { id: "insurance", active: true, next_due: "2027-01-01" },
  ];

  it("lists active rules soonest first, up to the limit", () => {
    expect(upcomingRules(rules).map((r) => r.id)).toEqual(["rent", "salary", "phone"]);
  });

  it("skips paused rules even when they are soonest", () => {
    expect(upcomingRules(rules, 10).map((r) => r.id)).not.toContain("gym");
  });

  it("is empty when nothing is active", () => {
    expect(upcomingRules(rules.map((r) => ({ ...r, active: false })))).toEqual([]);
  });
});
