import { describe, expect, it } from "vitest";
import {
  budgetHeadline,
  budgetMonth,
  budgetProgress,
  budgetStatus,
  effectiveBudgets,
} from "@/lib/budgets";
import type { Budget, EntryKind, Expense } from "@/lib/types";

function budget(category: string, month: string, amount: number): Budget {
  return { category, month, amount } as Budget;
}

function entry(kind: EntryKind, amount: number, category: string): Expense {
  return { kind, amount, category, date: "2026-11-10" } as Expense;
}

describe("budgetMonth", () => {
  it("is the first day of the month", () => {
    expect(budgetMonth("2026-11")).toBe("2026-11-01");
  });
});

describe("effectiveBudgets", () => {
  const rows = [
    budget("Food & Drink", "2026-09-01", 80_000),
    budget("Food & Drink", "2026-11-01", 90_000),
    budget("Transport", "2026-10-01", 30_000),
    budget("Shopping", "2026-08-01", 50_000),
    budget("Shopping", "2026-10-01", 0),
  ];

  it("uses the most recent row on or before the month", () => {
    expect(effectiveBudgets(rows, "2026-11")["Food & Drink"]).toBe(90_000);
    expect(effectiveBudgets(rows, "2026-10")["Food & Drink"]).toBe(80_000);
  });

  it("carries a budget forward across months with no row", () => {
    expect(effectiveBudgets(rows, "2027-03")["Transport"]).toBe(30_000);
  });

  it("ignores rows dated after the month", () => {
    expect(effectiveBudgets(rows, "2026-09")["Transport"]).toBeUndefined();
  });

  it("switches a budget off from a zero row on", () => {
    expect(effectiveBudgets(rows, "2026-09")["Shopping"]).toBe(50_000);
    expect(effectiveBudgets(rows, "2026-10")["Shopping"]).toBeUndefined();
    expect(effectiveBudgets(rows, "2026-12")["Shopping"]).toBeUndefined();
  });

  it("is empty with no rows", () => {
    expect(effectiveBudgets([], "2026-11")).toEqual({});
  });
});

describe("budgetStatus", () => {
  it("bands by share of the limit", () => {
    expect(budgetStatus(10, 100)).toBe("under");
    expect(budgetStatus(79, 100)).toBe("under");
    expect(budgetStatus(80, 100)).toBe("near");
    expect(budgetStatus(99, 100)).toBe("near");
    expect(budgetStatus(100, 100)).toBe("over");
    expect(budgetStatus(150, 100)).toBe("over");
  });
});

describe("budgetProgress", () => {
  const limits = { "Food & Drink": 100_000, Transport: 30_000 };
  const entries = [
    entry("expense", 60_000, "Food & Drink"),
    entry("expense", 25_000, "Food & Drink"),
    entry("income", 500_000, "Salary"),
    entry("expense", 10_000, "Entertainment"),
  ];

  it("sums only expense entries in each budgeted category", () => {
    const progress = budgetProgress(limits, entries);
    expect(progress["Food & Drink"]).toEqual({
      category: "Food & Drink",
      limit: 100_000,
      spent: 85_000,
      left: 15_000,
      pct: 85,
      status: "near",
    });
  });

  it("includes a budgeted category with nothing spent", () => {
    expect(budgetProgress(limits, entries)["Transport"]).toMatchObject({
      spent: 0,
      left: 30_000,
      pct: 0,
      status: "under",
    });
  });

  it("leaves unbudgeted categories out", () => {
    expect(budgetProgress(limits, entries)["Entertainment"]).toBeUndefined();
  });

  it("goes negative and past 100% when over", () => {
    const progress = budgetProgress({ Transport: 20_000 }, [entry("expense", 25_000, "Transport")]);
    expect(progress["Transport"]).toMatchObject({ left: -5_000, pct: 125, status: "over" });
  });
});

describe("budgetHeadline", () => {
  it("is null without budgets", () => {
    expect(budgetHeadline({})).toBeNull();
  });

  it("picks the most overspent budget when any is over", () => {
    const progress = budgetProgress(
      { Food: 100, Transport: 100, Shopping: 100 },
      [
        entry("expense", 120, "Food"),
        entry("expense", 150, "Transport"),
        entry("expense", 95, "Shopping"),
      ]
    );
    expect(budgetHeadline(progress)?.category).toBe("Transport");
  });

  it("otherwise picks the one closest to its limit", () => {
    const progress = budgetProgress(
      { Food: 100, Transport: 100 },
      [entry("expense", 40, "Food"), entry("expense", 70, "Transport")]
    );
    expect(budgetHeadline(progress)?.category).toBe("Transport");
  });
});
