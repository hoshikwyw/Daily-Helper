import { Progress } from "@kwyw/kayv-glass-ui";
import {
  categoryColor,
  filterByKind,
  fmt,
  getCategoryBreakdown,
  type ColorMap,
} from "@/lib/expenses";
import { EmptyState } from "@/components/ui/empty-state";
import type { EntryKind, Expense } from "@/lib/types";

type CategoryBreakdownProps = {
  entries: Expense[];
  kind: EntryKind;
  colorMap: ColorMap;
  /** Caps the list; the rest are folded into a "+N more" line. */
  limit?: number;
  emptyLabel?: string;
};

/**
 * Per-category totals with share-of-total bars. Used by the monthly and yearly
 * tabs and by the Today page, for both sides of the ledger.
 */
export function CategoryBreakdown({
  entries,
  kind,
  colorMap,
  limit,
  emptyLabel = "Nothing recorded yet.",
}: CategoryBreakdownProps) {
  const slices = getCategoryBreakdown(filterByKind(entries, kind));

  if (slices.length === 0) {
    return <EmptyState padding="lg">{emptyLabel}</EmptyState>;
  }

  const shown = limit ? slices.slice(0, limit) : slices;
  const hidden = slices.length - shown.length;

  return (
    <div className="space-y-4">
      {shown.map(({ category, amount, pct }) => (
        <div key={category} className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-300 flex items-center gap-2 min-w-0">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: categoryColor(colorMap, kind, category) }}
              />
              <span className="truncate">{category}</span>
            </span>
            <span className="text-slate-400 shrink-0 ml-2">
              {fmt(amount)} <span className="text-xs text-slate-600">({pct}%)</span>
            </span>
          </div>
          <Progress
            value={pct}
            variant={kind === "income" ? "success" : "primary"}
            size="sm"
          />
        </div>
      ))}
      {hidden > 0 && (
        <p className="text-xs text-slate-500">
          +{hidden} more {hidden === 1 ? "category" : "categories"}
        </p>
      )}
    </div>
  );
}
