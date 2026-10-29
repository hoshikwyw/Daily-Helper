import { Progress } from "@kwyw/kayv-glass-ui";
import { plural } from "@/lib/text";
import {
  categoryColor,
  filterByKind,
  fmt,
  getCategoryBreakdown,
  type ColorMap,
} from "@/lib/expenses";
import { EmptyState } from "@/components/ui/empty-state";
import type { BudgetProgress, BudgetStatus } from "@/lib/budgets";
import type { EntryKind, Expense } from "@/lib/types";

type CategoryBreakdownProps = {
  entries: Expense[];
  kind: EntryKind;
  colorMap: ColorMap;
  /** Caps the list; the rest are folded into a "+N more" line. */
  limit?: number;
  emptyLabel?: string;
  /**
   * Spending against limits, keyed by category. A budgeted category's bar
   * shows spent-of-limit instead of share-of-total, and budgeted categories
   * with nothing spent are listed too, so the headroom is visible.
   */
  budgets?: Record<string, BudgetProgress>;
};

const BUDGET_BAR: Record<BudgetStatus, "success" | "warning" | "danger"> = {
  under: "success",
  near: "warning",
  over: "danger",
};

const BUDGET_TEXT: Record<BudgetStatus, string> = {
  under: "text-slate-500",
  near: "text-amber-400",
  over: "text-rose-400",
};

/**
 * Per-category statistics with share-of-total bars.
 *
 * Each row carries the count and per-entry average as well as the total,
 * because those are what give a number meaning: K 100,000 on Food is a very
 * different story as one bill versus thirty small ones.
 */
export function CategoryBreakdown({
  entries,
  kind,
  colorMap,
  limit,
  emptyLabel = "Nothing recorded yet.",
  budgets = {},
}: CategoryBreakdownProps) {
  const spent = getCategoryBreakdown(filterByKind(entries, kind));
  // Budgeted categories with nothing spent still earn a row, after the real
  // spending, so a limit is never invisible just because it was respected.
  const idle = Object.keys(budgets)
    .filter((category) => !spent.some((s) => s.category === category))
    .map((category) => ({ category, amount: 0, pct: 0, count: 0, average: 0, largest: 0 }));
  const slices = [...spent, ...idle];

  if (slices.length === 0) {
    return <EmptyState padding="lg">{emptyLabel}</EmptyState>;
  }

  const shown = limit ? slices.slice(0, limit) : slices;
  const hidden = slices.length - shown.length;

  return (
    <div className="space-y-4">
      {shown.map(({ category, amount, pct, count, average }) => {
        const budget = budgets[category];
        return (
          <div key={category} className="space-y-1.5">
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="text-slate-200 flex items-center gap-2 min-w-0">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: categoryColor(colorMap, kind, category) }}
                />
                <span className="truncate">{category}</span>
              </span>
              <span className="text-slate-400 shrink-0 tabular-nums">
                {fmt(amount)}{" "}
                <span className="text-xs text-slate-500">
                  {budget ? `of ${fmt(budget.limit)}` : `(${pct}%)`}
                </span>
              </span>
            </div>

            {budget ? (
              <Progress
                value={Math.min(budget.pct, 100)}
                variant={BUDGET_BAR[budget.status]}
                size="sm"
              />
            ) : (
              <Progress value={pct} variant={kind === "income" ? "success" : "primary"} size="sm" />
            )}

            <p className="text-xs text-slate-500 flex justify-between gap-2">
              <span>
                {count > 0 ? plural(count, "entry", "entries") : "Nothing spent yet"}
                {count > 1 && ` · avg ${fmt(average)}`}
              </span>
              {budget && (
                <span className={`shrink-0 ${BUDGET_TEXT[budget.status]}`}>
                  {budget.left >= 0 ? `${fmt(budget.left)} left` : `${fmt(-budget.left)} over`}
                </span>
              )}
            </p>
          </div>
        );
      })}

      {hidden > 0 && (
        <p className="text-xs text-slate-400">
          +{plural(hidden, "more category", "more categories")}
        </p>
      )}
    </div>
  );
}
