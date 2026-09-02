import { Card, CardHeader, CardContent } from "@kwyw/kayv-glass-ui";
import { getTotals, type ColorMap } from "@/lib/expenses";
import { SkeletonList } from "@/components/ui/skeleton";
import { BalanceSummary } from "@/components/ui/balance-summary";
import { CategoryBreakdown } from "@/components/ui/category-breakdown";
import type { Expense } from "@/lib/types";

/** Only the biggest few categories fit before the card gets tall. */
const TOP_CATEGORIES = 4;

type TodayMoneyCardProps = {
  /** This month's entries, both ledgers. */
  entries: Expense[];
  colorMap: ColorMap;
  loading: boolean;
  /** Month name for the card heading, e.g. "September". */
  monthLabel: string;
};

export function TodayMoneyCard({
  entries,
  colorMap,
  loading,
  monthLabel,
}: TodayMoneyCardProps) {
  const totals = getTotals(entries);

  return (
    <Card variant="elevated" className="relative">
      <CardHeader
        title="Money"
        description={`${monthLabel} — income, spending, and what's left`}
      />
      <CardContent>
        {loading ? (
          <SkeletonList count={4} rowClassName="h-12" />
        ) : (
          <div className="space-y-5">
            <BalanceSummary totals={totals} netLabel="Collected this month" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-3">
                  Spent by category
                </p>
                <CategoryBreakdown
                  entries={entries}
                  kind="expense"
                  colorMap={colorMap}
                  limit={TOP_CATEGORIES}
                  emptyLabel="Nothing spent this month."
                />
              </div>

              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-3">
                  Earned by category
                </p>
                <CategoryBreakdown
                  entries={entries}
                  kind="income"
                  colorMap={colorMap}
                  limit={TOP_CATEGORIES}
                  emptyLabel="No income this month."
                />
              </div>
            </div>

            <a
              href="/dashboard/expenses"
              className="inline-block text-kv-400 text-sm hover:text-kv-300 transition-colors"
            >
              Open money tracker →
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
