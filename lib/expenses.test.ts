import { describe, expect, it } from "vitest";
import {
  buildColorMap,
  categoryColor,
  filterByKind,
  fmt,
  fmtEntry,
  fmtSigned,
  getCategoryBreakdown,
  getMonthlyTotals,
  getTotals,
  mergeCategories,
  normalizeKind,
  savingsRate,
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
  it("groups by category, largest first, with percentages", () => {
    expect(getCategoryBreakdown(filterByKind(SEPTEMBER, "expense"))).toEqual([
      { category: "Food & Drink", amount: 100_000, pct: 69 },
      { category: "Transport", amount: 45_000, pct: 31 },
    ]);
  });

  it("has no percentages to divide by when empty", () => {
    expect(getCategoryBreakdown([])).toEqual([]);
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
