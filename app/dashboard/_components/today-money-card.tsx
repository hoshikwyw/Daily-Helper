import { Card, CardHeader, CardContent } from "@kwyw/kayv-glass-ui";
import { getTotals, type ColorMap } from "@/lib/expenses";
import { SkeletonList } from "@/components/ui/skeleton";
import { BalanceSummary } from "@/components/ui/balance-summary";
import { CategorySplit } from "@/components/ui/category-split";
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

            <CategorySplit
              entries={entries}
              colorMap={colorMap}
              limit={TOP_CATEGORIES}
              period="this month"
            />

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
