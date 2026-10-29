import { Card, CardHeader, CardContent, Progress } from "@kwyw/kayv-glass-ui";
import { fmt, type CategoryMonth, type CategoryOverview } from "@/lib/expenses";
import { delta } from "@/lib/progress";
import { plural } from "@/lib/text";
import type { BudgetProgress } from "@/lib/budgets";
import { DeltaBadge } from "@/components/ui/delta-badge";
import { FieldLabel } from "@/components/ui/label";

type CategoryOverviewCardProps = {
  overview: CategoryOverview;
  color: string;
  /** "November 2026" or "2026". */
  periodLabel: string;
  /** The same category's total in the period before, when it is known. */
  previousTotal?: number | null;
  /** "last month" or "last year", for the comparison badge. */
  previousLabel?: string;
  /** This month's budget for the category, when one is set. */
  budget?: BudgetProgress | null;
  /** Spending per month, for a yearly view. */
  byMonth?: CategoryMonth[];
};

const BUDGET_BAR = { under: "success", near: "warning", over: "danger" } as const;

/**
 * Everything about one spending category in one period: the total, how it
 * is made up, its share of all spending, the budget if there is one, how it
 * moved against the previous period, and (for a year) month by month.
 */
export function CategoryOverviewCard({
  overview,
  color,
  periodLabel,
  previousTotal = null,
  previousLabel = "last month",
  budget = null,
  byMonth,
}: CategoryOverviewCardProps) {
  const { total, count, average, largest, share } = overview;

  return (
    <Card variant="elevated">
      <CardHeader title={overview.category} description={periodLabel} />
      <CardContent>
        <div className="space-y-5">
          <div className="flex items-start gap-3">
            <span className="mt-2 h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
            <div className="min-w-0">
              <p className="text-3xl font-semibold tracking-tight text-white tabular-nums">{fmt(total)}</p>
              <p className="text-sm text-slate-400 mt-1">
                {count === 0
                  ? "Nothing spent here in this period."
                  : `${plural(count, "entry", "entries")} · avg ${fmt(average)} · largest ${fmt(largest)}`}
              </p>
              {previousTotal !== null && (
                <p className="mt-1">
                  <DeltaBadge delta={delta(total, previousTotal)} format={fmt} goodWhen="down" />
                  <span className="sr-only"> against {previousLabel}</span>
                </p>
              )}
            </div>
          </div>

          {count > 0 && (
            <div>
              <div className="flex items-baseline justify-between text-xs text-slate-400 mb-1.5">
                <span>Share of spending</span>
                <span className="tabular-nums">{share}%</span>
              </div>
              <Progress value={share} variant="primary" size="sm" />
            </div>
          )}

          {budget && (
            <div>
              <div className="flex items-baseline justify-between text-xs mb-1.5">
                <span className="text-slate-400">Budget {fmt(budget.limit)}</span>
                <span
                  className={`tabular-nums ${
                    budget.status === "over"
                      ? "text-rose-400"
                      : budget.status === "near"
                        ? "text-amber-400"
                        : "text-slate-400"
                  }`}
                >
                  {budget.left >= 0 ? `${fmt(budget.left)} left` : `${fmt(budget.left)} over`}
                </span>
              </div>
              <Progress value={Math.min(budget.pct, 100)} variant={BUDGET_BAR[budget.status]} size="sm" />
            </div>
          )}

          {byMonth && (
            <div>
              <FieldLabel>By month</FieldLabel>
              <div className="space-y-2">
                {byMonth.map(({ month, amount, pct }) => (
                  <div key={month} className="flex items-center gap-3">
                    <span className="text-slate-400 text-xs w-8 shrink-0">{month}</span>
                    <div className="flex-1">
                      <Progress value={pct} variant="primary" size="sm" />
                    </div>
                    <span
                      className={`text-xs w-20 sm:w-28 text-right shrink-0 tabular-nums ${
                        amount > 0 ? "text-slate-200" : "text-slate-500"
                      }`}
                    >
                      {amount > 0 ? fmt(amount) : "—"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
