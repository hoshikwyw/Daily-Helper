import { Card, CardHeader, CardContent } from "@kwyw/kayv-glass-ui";
import { categoryColor, fmt, fmtSigned, type ColorMap } from "@/lib/expenses";
import type { MoneyReview } from "@/lib/review";
import { delta } from "@/lib/progress";
import { EmptyState } from "@/components/ui/empty-state";
import { FieldLabel } from "@/components/ui/label";
import { DeltaBadge } from "@/components/ui/delta-badge";

export function MoneyReviewCard({ review, colorMap }: { review: MoneyReview; colorMap: ColorMap }) {
  const { totals, previousTotals, topCategories } = review;
  const nothing = totals.income === 0 && totals.expense === 0;

  return (
    <Card variant="elevated">
      <CardHeader title="Money" description={`Net ${fmtSigned(totals.net)} this week`} />
      <CardContent>
        {nothing ? (
          <EmptyState padding="sm">No money logged this week.</EmptyState>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-white/5 p-3">
                <p className="text-xs text-slate-400">Spent</p>
                <p className="text-lg font-semibold text-rose-400 tabular-nums">{fmt(totals.expense)}</p>
                <DeltaBadge
                  delta={delta(totals.expense, previousTotals.expense)}
                  format={fmt}
                  goodWhen="down"
                />
              </div>
              <div className="rounded-lg bg-white/5 p-3">
                <p className="text-xs text-slate-400">Earned</p>
                <p className="text-lg font-semibold text-emerald-400 tabular-nums">{fmt(totals.income)}</p>
                <DeltaBadge
                  delta={delta(totals.income, previousTotals.income)}
                  format={fmt}
                  goodWhen="up"
                />
              </div>
            </div>

            {topCategories.length > 0 && (
              <div>
                <FieldLabel>Where it went</FieldLabel>
                <ul className="space-y-1.5">
                  {topCategories.map((slice) => (
                    <li key={slice.category} className="flex items-center gap-2.5 text-sm">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: categoryColor(colorMap, "expense", slice.category) }}
                      />
                      <span className="text-slate-200 flex-1 min-w-0 truncate">{slice.category}</span>
                      <span className="text-slate-400 tabular-nums shrink-0">
                        {fmt(slice.amount)} <span className="text-xs text-slate-500">({slice.pct}%)</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
