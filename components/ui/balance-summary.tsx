import { Card, CardContent } from "@kwyw/kayv-glass-ui";
import { fmt, fmtSigned, savingsRate, type Totals } from "@/lib/expenses";

type BalanceSummaryProps = {
  totals: Totals;
  /** Names the period the numbers cover, e.g. "left this month". */
  netLabel?: string;
  /** Adds the "kept N% of income" line under the net figure. */
  showSavingsRate?: boolean;
};

/**
 * The money-in / money-out / what's-left trio. Shared by every expenses tab and
 * the Today page so the same three numbers always read the same way.
 */
export function BalanceSummary({
  totals,
  netLabel = "Money left",
  showSavingsRate = true,
}: BalanceSummaryProps) {
  const positive = totals.net >= 0;
  const rate = savingsRate(totals);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      <Card variant="elevated">
        <CardContent>
          <p className="text-slate-400 text-xs">Income</p>
          <p className="text-xl font-bold text-emerald-400 mt-0.5">{fmt(totals.income)}</p>
        </CardContent>
      </Card>

      <Card variant="elevated">
        <CardContent>
          <p className="text-slate-400 text-xs">Expense</p>
          <p className="text-xl font-bold text-rose-400 mt-0.5">{fmt(totals.expense)}</p>
        </CardContent>
      </Card>

      <Card variant="elevated" className="col-span-2 sm:col-span-1">
        <CardContent>
          <p className="text-slate-400 text-xs">{netLabel}</p>
          <p
            className={`text-xl font-bold mt-0.5 ${
              positive ? "text-white" : "text-rose-400"
            }`}
          >
            {fmtSigned(totals.net)}
          </p>
          {showSavingsRate && totals.income > 0 && (
            <p className="text-xs text-slate-400 mt-0.5">
              {positive ? `kept ${rate}% of income` : "spent more than earned"}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
