import { describe, expect, it } from "vitest";
import {
  bucketByMonth,
  buildColorMap,
  categoryColor,
  categoryFilterOptions,
  countActiveDays,
  filterByCategory,
  filterByKind,
  fmt,
  fmtCompactSigned,
  fmtEntry,
  fmtSigned,
  getCategoryBreakdown,
  getCategoryMonthlyTotals,
  getCategoryOverview,
  getCategoryStats,
  getDayActivity,
  getMonthActivity,
  getMonthlyTotals,
  getTotals,
  mergeCategories,
  normalizeKind,
  savingsRate,
  totalSpent,
} from "@/lib/expenses";
import type { EntryKind, Expense } from "@/lib/types";

// Rows are built by hand rather than fetched; only the fields the pure helpers
// read are supplied.
function entry(kind: EntryKind, amount: number, category: string, date: string): Expense {
  return { kind, amount, category, date } as Expense;
}

const SEPTEMBER: Expense[] = [
  entry("income", 500_000, "Salary", "2026-09-01"),
  entry("income", 120_000, "Freelance", "2026-09-10"),
  entry("expense", 80_000, "Food & Drink", "2026-09-02"),
  entry("expense", 45_000, "Transport", "2026-09-03"),
  entry("expense", 20_000, "Food & Drink", "2026-09-11"),
];

describe("getTotals", () => {
  it("splits income from expense and reports what is left", () => {
    expect(getTotals(SEPTEMBER)).toEqual({ income: 620_000, expense: 145_000, net: 475_000 });
  });

  it("is all zeroes for no entries", () => {
    expect(getTotals([])).toEqual({ income: 0, expense: 0, net: 0 });
  });

  it("goes negative when spending outruns income", () => {
    const totals = getTotals([
      entry("income", 100, "Salary", "2026-09-01"),
      entry("expense", 350, "Housing", "2026-09-02"),
    ]);
    expect(totals.net).toBe(-250);
  });
});

describe("amount formatting", () => {
  // `amount` is always stored positive; the sign comes from `kind`. A negative
  // reaching fmt() would mean the sign got into the number somewhere.
  it("never renders a sign of its own", () => {
    expect(fmt(-1200)).toBe("K 1,200");
  });

  it("signs a net figure explicitly", () => {
    expect(fmtSigned(1200)).toBe("+K 1,200");
    expect(fmtSigned(-1200)).toBe("−K 1,200");
    expect(fmtSigned(0)).toBe("K 0");
  });

  describe("fmtCompactSigned", () => {
    it("leaves small amounts whole", () => {
      expect(fmtCompactSigned(850)).toBe("+850");
      expect(fmtCompactSigned(-850)).toBe("−850");
      expect(fmtCompactSigned(0)).toBe("0");
    });

    it("keeps one decimal below ten of a unit and none above", () => {
      expect(fmtCompactSigned(1200)).toBe("+1.2k");
      expect(fmtCompactSigned(-45_000)).toBe("−45k");
      expect(fmtCompactSigned(500_000)).toBe("+500k");
      expect(fmtCompactSigned(-1_250_000)).toBe("−1.3M");
      expect(fmtCompactSigned(2_000_000_000)).toBe("+2B");
    });

    it("drops a trailing .0", () => {
      expect(fmtCompactSigned(1000)).toBe("+1k");
      expect(fmtCompactSigned(3_000_000)).toBe("+3M");
    });

    it("rolls into the next unit instead of showing 1000k", () => {
      expect(fmtCompactSigned(999_600)).toBe("+1M");
      expect(fmtCompactSigned(9_960)).toBe("+10k");
      expect(fmtCompactSigned(999.7)).toBe("+1k");
    });
  });

  it("takes an entry's sign from its kind", () => {
    expect(fmtEntry(entry("expense", 500, "Food", "2026-09-01"))).toBe("−K 500");
    expect(fmtEntry(entry("income", 500, "Salary", "2026-09-01"))).toBe("+K 500");
  });
});

describe("savingsRate", () => {
  it("is the share of income kept", () => {
    expect(savingsRate(getTotals(SEPTEMBER))).toBe(77);
  });

  it("is 0 rather than Infinity when nothing came in", () => {
    expect(savingsRate({ income: 0, expense: 500, net: -500 })).toBe(0);
  });
});

describe("normalizeKind", () => {
  // Rows written before the income migration have no `kind`. An undefined kind
  // used as a lookup key crashed the whole page, so it defaults to "expense".
  it("defaults anything that is not exactly \"income\" to expense", () => {
    expect(normalizeKind(undefined)).toBe("expense");
    expect(normalizeKind(null)).toBe("expense");
    expect(normalizeKind("INCOME")).toBe("expense");
    expect(normalizeKind("nonsense")).toBe("expense");
  });

  it("passes income through", () => {
    expect(normalizeKind("income")).toBe("income");
  });

  it("counts a legacy row without a kind as spending", () => {
    const legacy = { amount: 5_000, category: "Shopping", date: "2026-09-01" } as Expense;
    expect(getTotals([legacy])).toEqual({ income: 0, expense: 5_000, net: -5_000 });
    expect(filterByKind([legacy], "expense")).toHaveLength(1);
  });
});

describe("category colours", () => {
  const colorMap = buildColorMap(
    mergeCategories([{ kind: "income", name: "Bonus", color: "#123456" }])
  );

  it("keeps the two ledgers' categories apart", () => {
    // "Other" exists on both sides; a flat name->colour map would collide.
    expect(categoryColor(colorMap, "expense", "Other")).toBe("#64748b");
    expect(categoryColor(colorMap, "income", "Salary")).toBe("#22c55e");
    expect(colorMap.expense["Bonus"]).toBeUndefined();
  });

  it("resolves a custom category", () => {
    expect(categoryColor(colorMap, "income", "Bonus")).toBe("#123456");
  });

  it("falls back instead of throwing on an unknown category or kind", () => {
    expect(categoryColor(colorMap, "expense", "Nope")).toBe("#64748b");
    expect(categoryColor(colorMap, "nonsense" as EntryKind, "Shopping")).toBe("#8b5cf6");
  });
});

describe("getCategoryBreakdown", () => {
  it("reports totals, share, count, average and largest per category", () => {
    expect(getCategoryBreakdown(filterByKind(SEPTEMBER, "expense"))).toEqual([
      {
        category: "Food & Drink",
        amount: 100_000,
        pct: 69,
        count: 2,
        average: 50_000,
        largest: 80_000,
      },
      {
        category: "Transport",
        amount: 45_000,
        pct: 31,
        count: 1,
        average: 45_000,
        largest: 45_000,
      },
    ]);
  });

  it("sorts by total, biggest first", () => {
    const slices = getCategoryBreakdown(filterByKind(SEPTEMBER, "expense"));
    expect(slices.map((s) => s.category)).toEqual(["Food & Drink", "Transport"]);
  });

  it("distinguishes one large entry from many small ones", () => {
    // Same total either way; count, average and largest are what tell them apart.
    const oneBig = getCategoryBreakdown([entry("expense", 90_000, "Housing", "2026-09-01")])[0];
    const manySmall = getCategoryBreakdown([
      entry("expense", 30_000, "Housing", "2026-09-01"),
      entry("expense", 30_000, "Housing", "2026-09-02"),
      entry("expense", 30_000, "Housing", "2026-09-03"),
    ])[0];

    expect(oneBig.amount).toBe(manySmall.amount);
    expect(oneBig).toMatchObject({ count: 1, average: 90_000, largest: 90_000 });
    expect(manySmall).toMatchObject({ count: 3, average: 30_000, largest: 30_000 });
  });

  it("has no percentages to divide by when empty", () => {
    expect(getCategoryBreakdown([])).toEqual([]);
  });
});

describe("getCategoryStats", () => {
  it("summarises one side of the ledger", () => {
    expect(getCategoryStats(filterByKind(SEPTEMBER, "expense"))).toMatchObject({
      categories: 2,
      entries: 3,
      total: 145_000,
      average: 48_333,
    });
  });

  it("names the biggest category", () => {
    expect(getCategoryStats(filterByKind(SEPTEMBER, "expense")).top?.category).toBe(
      "Food & Drink"
    );
  });

  it("is empty rather than NaN with nothing recorded", () => {
    expect(getCategoryStats([])).toEqual({
      categories: 0,
      entries: 0,
      total: 0,
      average: 0,
      top: null,
    });
  });
});

describe("getMonthlyTotals", () => {
  const year: Expense[] = [
    entry("income", 1000, "Salary", "2026-01-05"),
    entry("expense", 400, "Food & Drink", "2026-01-06"),
    entry("expense", 900, "Housing", "2026-02-01"),
    entry("income", 300, "Gift", "2026-02-02"),
    entry("income", 50, "Refund", "2025-01-01"),
  ];
  const months = getMonthlyTotals(year, 2026);

  it("always returns twelve months", () => {
    expect(months).toHaveLength(12);
  });

  it("ignores entries from another year", () => {
    expect(months.reduce((sum, m) => sum + m.income, 0)).toBe(1300);
  });

  it("carries a negative net for an overspent month", () => {
    expect(months[1].net).toBe(-600);
  });

  it("scales bars by absolute net, so a loss reads as loudly as a gain", () => {
    expect(months[0].pct).toBe(100);
    expect(months[1].pct).toBe(100);
  });

  it("leaves untouched months at zero rather than inventing a break-even", () => {
    expect(months[2]).toMatchObject({ income: 0, expense: 0, net: 0, month: "Mar", pct: 0 });
  });
});

describe("getDayActivity", () => {
  it("marks which ledger sides each day has and how many entries", () => {
    const activity = getDayActivity(SEPTEMBER);
    expect(activity["2026-09-01"]).toEqual({ income: true, expense: false, count: 1, net: 500_000 });
    expect(activity["2026-09-02"]).toEqual({ income: false, expense: true, count: 1, net: -80_000 });
  });

  it("omits days with no entries", () => {
    expect(getDayActivity(SEPTEMBER)["2026-09-05"]).toBeUndefined();
    expect(getDayActivity([])).toEqual({});
  });

  it("flags both sides when income and expense share a day", () => {
    const activity = getDayActivity([
      entry("income", 300, "Salary", "2026-09-20"),
      entry("expense", 100, "Food & Drink", "2026-09-20"),
    ]);
    expect(activity["2026-09-20"]).toEqual({ income: true, expense: true, count: 2, net: 200 });
  });

  it("treats a missing kind as expense", () => {
    const legacy = { amount: 50, category: "Other", date: "2026-09-21" } as Expense;
    expect(getDayActivity([legacy])["2026-09-21"].expense).toBe(true);
  });
});

describe("countActiveDays", () => {
  it("counts only days inside the given month", () => {
    const activity = getDayActivity([
      ...SEPTEMBER,
      entry("expense", 10, "Other", "2026-10-01"),
    ]);
    expect(countActiveDays(activity, "2026-09")).toBe(5);
    expect(countActiveDays(activity, "2026-10")).toBe(1);
    expect(countActiveDays(activity, "2026-11")).toBe(0);
  });
});

describe("getMonthActivity", () => {
  it("rolls days up into their month, ignoring other years", () => {
    const activity = getDayActivity([
      ...SEPTEMBER,
      entry("expense", 10, "Other", "2026-10-01"),
      entry("income", 999, "Salary", "2025-09-01"),
    ]);
    const months = getMonthActivity(activity, 2026);
    expect(months).toHaveLength(12);
    expect(months[8]).toEqual({ income: true, expense: true, days: 5, count: 5, net: 475_000 });
    expect(months[9]).toEqual({ income: false, expense: true, days: 1, count: 1, net: -10 });
    expect(months[0]).toEqual({ income: false, expense: false, days: 0, count: 0, net: 0 });
  });

  it("counts days, not entries, when several share a day", () => {
    const activity = getDayActivity([
      entry("expense", 1, "Other", "2026-03-05"),
      entry("expense", 2, "Other", "2026-03-05"),
    ]);
    expect(getMonthActivity(activity, 2026)[2]).toMatchObject({ days: 1, count: 2 });
  });
});

describe("one category at a time", () => {
  const entries = [
    ...SEPTEMBER,
    entry("expense", 30_000, "Food & Drink", "2026-10-02"),
    entry("expense", 5_000, "Gym", "2026-09-20"),
  ];

  it("filters spending in one category and never income", () => {
    const food = filterByCategory(entries, "Food & Drink");
    expect(food.map((e) => e.amount)).toEqual([80_000, 20_000, 30_000]);
    expect(filterByCategory(entries, "Salary")).toEqual([]);
  });

  it("offers configured categories plus ones that only exist in the data", () => {
    const options = categoryFilterOptions([{ name: "Food & Drink", color: "#f97316" }], entries);
    expect(options.map((o) => o.name)).toEqual(["Food & Drink", "Transport", "Gym"]);
    expect(options[2].color).toBe("#64748b");
  });

  it("summarises a category against the period's spending", () => {
    const overview = getCategoryOverview(SEPTEMBER, "Food & Drink");
    expect(overview).toEqual({
      category: "Food & Drink",
      total: 100_000,
      count: 2,
      average: 50_000,
      largest: 80_000,
      share: 69,
    });
  });

  it("is all zeroes for a category with nothing in the period", () => {
    expect(getCategoryOverview(SEPTEMBER, "Housing")).toMatchObject({ total: 0, count: 0, average: 0, largest: 0, share: 0 });
  });

  it("gives a category's spending per month, scaled to its biggest month", () => {
    const months = getCategoryMonthlyTotals(entries, 2026, "Food & Drink");
    expect(months).toHaveLength(12);
    expect(months[8]).toEqual({ month: "Sep", amount: 100_000, pct: 100 });
    expect(months[9]).toEqual({ month: "Oct", amount: 30_000, pct: 30 });
    expect(months[0]).toEqual({ month: "Jan", amount: 0, pct: 0 });
  });
});

describe("bucketByMonth and totalSpent", () => {
  it("drops entries into their month and ignores other years", () => {
    const buckets = bucketByMonth([...SEPTEMBER, entry("expense", 1, "Other", "2025-09-01")], 2026);
    expect(buckets).toHaveLength(12);
    expect(buckets[8]).toHaveLength(5);
    expect(buckets[0]).toHaveLength(0);
  });

  it("sums one category's spending only", () => {
    expect(totalSpent(SEPTEMBER, "Food & Drink")).toBe(100_000);
    expect(totalSpent(SEPTEMBER, "Salary")).toBe(0);
  });
});
