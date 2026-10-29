import { CategoryBreakdown } from "@/components/ui/category-breakdown";
import { FieldLabel } from "@/components/ui/label";
import { filterByKind, fmt, getCategoryStats, type ColorMap } from "@/lib/expenses";
import type { BudgetProgress } from "@/lib/budgets";
import type { EntryKind, Expense } from "@/lib/types";
import { plural } from "@/lib/text";

type CategorySplitProps = {
  entries: Expense[];
  colorMap: ColorMap;
  /** Caps each side; the rest fold into a "+N more" line. */
  limit?: number;
  /** Describes the period, e.g. "this month" — used in the empty states. */
  period: string;
  /** Spending limits for the period, keyed by category; expense side only. */
  budgets?: Record<string, BudgetProgress>;
};

/**
 * Spending and earning statistics side by side.
 *
 * Deliberately not a Card. Every money tab used to render two separate cards
 * for this, which on a phone meant two sets of borders and padding stacked down
 * the screen; and the home page needs it *inside* an existing card. Callers
 * wrap it once if they want a surface.
 */
export function CategorySplit({ entries, colorMap, limit, period, budgets }: CategorySplitProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      <CategorySide
        entries={entries}
        kind="expense"
        colorMap={colorMap}
        limit={limit}
        label="Spent"
        emptyLabel={`Nothing spent ${period}.`}
        budgets={budgets}
      />
      <CategorySide
        entries={entries}
        kind="income"
        colorMap={colorMap}
        limit={limit}
        label="Earned"
        emptyLabel={`No income ${period}.`}
      />
    </div>
  );
}

type CategorySideProps = {
  entries: Expense[];
  kind: EntryKind;
  colorMap: ColorMap;
  limit?: number;
  label: string;
  emptyLabel: string;
  budgets?: Record<string, BudgetProgress>;
};

/** One ledger: a headline summary, then the per-category rows. */
function CategorySide({
  entries,
  kind,
  colorMap,
  limit,
  label,
  emptyLabel,
  budgets,
}: CategorySideProps) {
  const stats = getCategoryStats(filterByKind(entries, kind));

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 mb-3">
        <FieldLabel mb="0">{label}</FieldLabel>
        {stats.entries > 0 && (
          <span className="text-xs text-slate-500">
            {plural(stats.categories, "category", "categories")} ·{" "}
            {plural(stats.entries, "entry", "entries")} · avg{" "}
            {fmt(stats.average)}
          </span>
        )}
      </div>
      <CategoryBreakdown
        entries={entries}
        kind={kind}
        colorMap={colorMap}
        limit={limit}
        emptyLabel={emptyLabel}
        budgets={budgets}
      />
    </div>
  );
}
