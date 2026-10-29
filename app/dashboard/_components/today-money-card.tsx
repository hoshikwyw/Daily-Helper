import { Card, CardHeader, CardContent } from "@kwyw/kayv-glass-ui";
import { KIND_TEXT_COLORS, fmt, fmtEntry, getTotals, type ColorMap } from "@/lib/expenses";
import { formatDate } from "@/lib/date";
import { budgetHeadline, type BudgetProgress } from "@/lib/budgets";
import { SkeletonList } from "@/components/ui/skeleton";
import { BalanceSummary } from "@/components/ui/balance-summary";
import { CategorySplit } from "@/components/ui/category-split";
import { FieldLabel } from "@/components/ui/label";
import type { Expense, Recurrence } from "@/lib/types";

/** Only the biggest few categories fit before the card gets tall. */
const TOP_CATEGORIES = 4;

type TodayMoneyCardProps = {
  /** This month's entries, both ledgers. */
  entries: Expense[];
  /** The next few recurring money rules, soonest first; empty when there are none. */
  upcoming: Recurrence[];
  /** This month's spending against its limits, keyed by category. */
  budgets: Record<string, BudgetProgress>;
  colorMap: ColorMap;
  loading: boolean;
  /** Month name for the card heading, e.g. "September". */
  monthLabel: string;
};

/** "K 12,000 left for Food this month", "Close: …", or "Over on Food by K 3,000". */
function headlineText(h: BudgetProgress): string {
  // `fmt` drops the sign, so the negative `left` of an overspent budget reads as the overrun.
  if (h.status === "over") return `Over on ${h.category} by ${fmt(h.left)}`;
  const base = `${fmt(h.left)} left for ${h.category} this month`;
  return h.status === "near" ? `Close: ${base}` : base;
}

const HEADLINE_STYLE: Record<BudgetProgress["status"], string> = {
  under: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  near: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  over: "border-rose-500/30 bg-rose-500/10 text-rose-200",
};

export function TodayMoneyCard({
  entries,
  upcoming,
  budgets,
  colorMap,
  loading,
  monthLabel,
}: TodayMoneyCardProps) {
  const totals = getTotals(entries);
  const headline = budgetHeadline(budgets);

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

            {headline && (
              <p
                className={`rounded-lg border px-3 py-2 text-sm font-medium ${HEADLINE_STYLE[headline.status]}`}
              >
                ◎ {headlineText(headline)}
              </p>
            )}

            {upcoming.length > 0 && (
              <div>
                <FieldLabel>Upcoming</FieldLabel>
                <div className="space-y-1.5">
                  {upcoming.map((rule) => {
                    const kind = rule.kind ?? "expense";
                    return (
                      <div
                        key={rule.id}
                        className="flex items-center gap-3 px-2 py-1.5 rounded-lg bg-white/5 text-sm"
                      >
                        <span className="text-slate-400 shrink-0" aria-hidden="true">
                          ⟳
                        </span>
                        <span className="flex-1 min-w-0 truncate text-slate-200">
                          {rule.description || rule.category}
                        </span>
                        <span className="text-xs text-slate-400 shrink-0">
                          {formatDate(rule.next_due)}
                        </span>
                        <span className={`font-semibold shrink-0 ${KIND_TEXT_COLORS[kind]}`}>
                          {fmtEntry({ kind, amount: rule.amount ?? 0 })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <CategorySplit
              entries={entries}
              colorMap={colorMap}
              limit={TOP_CATEGORIES}
              period="this month"
              budgets={budgets}
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
