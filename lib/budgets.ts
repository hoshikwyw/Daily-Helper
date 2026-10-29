import { filterByKind } from "@/lib/expenses";
import type { Budget, Expense } from "@/lib/types";

// Domain helpers for category budgets. Pure functions: the page passes in the
// budget rows and the month's entries, and gets back what to draw.

/** Share of a limit at which a budget starts to read as "near". */
export const NEAR_THRESHOLD = 0.8;

export type BudgetStatus = "under" | "near" | "over";

/** The `month` value for a budget row: the first day of a `YYYY-MM` month. */
export function budgetMonth(prefix: string): string {
  return `${prefix}-01`;
}

/**
 * The limits in force for one month, keyed by category.
 *
 * A category's limit is its most recent budget row dated on or before the
 * month, so a budget set once carries forward until it is changed. A row
 * with amount 0 switches the budget off from its month on, and categories
 * with no budget are simply absent.
 */
export function effectiveBudgets(budgets: Budget[], prefix: string): Record<string, number> {
  const cutoff = budgetMonth(prefix);
  const latest = new Map<string, Budget>();
  for (const budget of budgets) {
    if (budget.month > cutoff) continue;
    const current = latest.get(budget.category);
    if (!current || budget.month > current.month) latest.set(budget.category, budget);
  }
  const limits: Record<string, number> = {};
  for (const [category, budget] of latest) {
    if (budget.amount > 0) limits[category] = budget.amount;
  }
  return limits;
}

export type BudgetProgress = {
  category: string;
  limit: number;
  spent: number;
  /** Limit minus spent; negative when over. */
  left: number;
  /** Spent as a share of the limit, 0-100 and beyond; not capped. */
  pct: number;
  status: BudgetStatus;
};

export function budgetStatus(spent: number, limit: number): BudgetStatus {
  if (spent >= limit) return "over";
  if (spent >= limit * NEAR_THRESHOLD) return "near";
  return "under";
}

/**
 * Spending against each limit for one month's entries, keyed by category.
 * Every budgeted category is present, even with nothing spent, so a quiet
 * month still shows its headroom.
 */
export function budgetProgress(
  limits: Record<string, number>,
  entries: Expense[]
): Record<string, BudgetProgress> {
  const spentBy: Record<string, number> = {};
  for (const entry of filterByKind(entries, "expense")) {
    spentBy[entry.category] = (spentBy[entry.category] ?? 0) + entry.amount;
  }
  const progress: Record<string, BudgetProgress> = {};
  for (const [category, limit] of Object.entries(limits)) {
    const spent = spentBy[category] ?? 0;
    progress[category] = {
      category,
      limit,
      spent,
      left: limit - spent,
      pct: Math.round((spent / limit) * 100),
      status: budgetStatus(spent, limit),
    };
  }
  return progress;
}

/**
 * The one budget worth a sentence on the Today page: the most overspent one
 * if any is over, otherwise the one closest to its limit. Null without budgets.
 */
export function budgetHeadline(progress: Record<string, BudgetProgress>): BudgetProgress | null {
  const all = Object.values(progress);
  if (all.length === 0) return null;
  const over = all.filter((p) => p.status === "over");
  if (over.length > 0) return over.reduce((worst, p) => (p.left < worst.left ? p : worst));
  return all.reduce((tightest, p) => (p.pct > tightest.pct ? p : tightest));
}
