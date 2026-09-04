import { CategoryBreakdown } from "@/components/ui/category-breakdown";
import { FieldLabel } from "@/components/ui/label";
import { filterByKind, fmt, getCategoryStats, type ColorMap } from "@/lib/expenses";
import type { EntryKind, Expense } from "@/lib/types";

type CategorySplitProps = {
  entries: Expense[];
  colorMap: ColorMap;
  /** Caps each side; the rest fold into a "+N more" line. */
  limit?: number;
  /** Describes the period, e.g. "this month" — used in the empty states. */
  period: string;
};

/**
 * Spending and earning statistics side by side.
 *
 * Deliberately not a Card. Every money tab used to render two separate cards
 * for this, which on a phone meant two sets of borders and padding stacked down
 * the screen; and the home page needs it *inside* an existing card. Callers
 * wrap it once if they want a surface.
 */
export function CategorySplit({ entries, colorMap, limit, period }: CategorySplitProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      <CategorySide
        entries={entries}
        kind="expense"
        colorMap={colorMap}
        limit={limit}
        label="Spent"
        emptyLabel={`Nothing spent ${period}.`}
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
};

/** One ledger: a headline summary, then the per-category rows. */
function CategorySide({
  entries,
  kind,
  colorMap,
  limit,
  label,
  emptyLabel,
}: CategorySideProps) {
  const stats = getCategoryStats(filterByKind(entries, kind));

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 mb-3">
        <FieldLabel mb="0">{label}</FieldLabel>
        {stats.entries > 0 && (
          <span className="text-xs text-slate-500">
            {stats.categories} {stats.categories === 1 ? "category" : "categories"} ·{" "}
            {stats.entries} {stats.entries === 1 ? "entry" : "entries"} · avg{" "}
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
      />
    </div>
  );
}
