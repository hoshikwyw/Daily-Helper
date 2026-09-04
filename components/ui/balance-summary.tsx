import { fmt, fmtSigned, savingsRate, type Totals } from "@/lib/expenses";

type BalanceSummaryProps = {
  totals: Totals;
  /** Names the period the numbers cover, e.g. "Collected this month". */
  netLabel?: string;
  /** Adds the "kept N% of income" line under the net figure. */
  showSavingsRate?: boolean;
};

/**
 * Money in, money out, and what's left.
 *
 * One flat surface rather than three Cards: it's used inside a Card on the
 * home page, and nesting cards doubled the border and padding, which costs
 * real width on a phone. Being a plain bordered block means it sits correctly
 * whether it's standalone or nested.
 *
 * "What's left" leads because that's the number the whole screen is for; income
 * and expense are the supporting detail underneath.
 */
export function BalanceSummary({
  totals,
  netLabel = "Money left",
  showSavingsRate = true,
}: BalanceSummaryProps) {
  const positive = totals.net >= 0;
  const rate = savingsRate(totals);

  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.03] overflow-hidden">
      <div className="p-4">
        <p className="text-xs text-slate-400">{netLabel}</p>
        <p
          className={`text-2xl sm:text-3xl font-semibold tracking-tight mt-1 ${
            positive ? "text-white" : "text-rose-400"
          }`}
        >
          {fmtSigned(totals.net)}
        </p>
        {showSavingsRate && totals.income > 0 && (
          <p className="text-xs text-slate-400 mt-1">
            {positive ? `kept ${rate}% of income` : "spent more than earned"}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 border-t border-white/8 divide-x divide-white/8">
        <div className="p-3 sm:p-4">
          <p className="text-xs text-slate-400">Income</p>
          <p className="text-base sm:text-lg font-semibold text-emerald-400 mt-0.5">
            {fmt(totals.income)}
          </p>
        </div>
        <div className="p-3 sm:p-4">
          <p className="text-xs text-slate-400">Expense</p>
          <p className="text-base sm:text-lg font-semibold text-rose-400 mt-0.5">
            {fmt(totals.expense)}
          </p>
        </div>
      </div>
    </div>
  );
}
