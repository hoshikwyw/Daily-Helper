import { CategoryBreakdown } from "@/components/ui/category-breakdown";
import { FieldLabel } from "@/components/ui/label";
import type { ColorMap } from "@/lib/expenses";
import type { Expense } from "@/lib/types";

type CategorySplitProps = {
  entries: Expense[];
  colorMap: ColorMap;
  /** Caps each side; the rest fold into a "+N more" line. */
  limit?: number;
  /** Describes the period, e.g. "this month" — used in the empty states. */
  period: string;
};

/**
 * Spending and earning broken down side by side.
 *
 * Deliberately not a Card. Every money tab used to render two separate cards
 * for this, which on a phone meant two sets of borders and padding stacked down
 * the screen; and the home page needs it *inside* an existing card. Callers
 * wrap it once if they want a surface.
 */
export function CategorySplit({ entries, colorMap, limit, period }: CategorySplitProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      <div>
        <FieldLabel mb="3">Spent</FieldLabel>
        <CategoryBreakdown
          entries={entries}
          kind="expense"
          colorMap={colorMap}
          limit={limit}
          emptyLabel={`Nothing spent ${period}.`}
        />
      </div>
      <div>
        <FieldLabel mb="3">Earned</FieldLabel>
        <CategoryBreakdown
          entries={entries}
          kind="income"
          colorMap={colorMap}
          limit={limit}
          emptyLabel={`No income ${period}.`}
        />
      </div>
    </div>
  );
}
