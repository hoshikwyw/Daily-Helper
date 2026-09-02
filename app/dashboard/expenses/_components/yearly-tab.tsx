import { Card, CardHeader, CardContent, Button, Select, Progress } from "@kwyw/kayv-glass-ui";
import {
  fmt,
  fmtSigned,
  getTotals,
  type ColorMap,
  type MonthTotals,
} from "@/lib/expenses";
import { BalanceSummary } from "@/components/ui/balance-summary";
import { CategoryBreakdown } from "@/components/ui/category-breakdown";
import type { Expense } from "@/lib/types";

type YearlyTabProps = {
  selectedYear: number;
  onYearChange: (value: number) => void;
  yearList: number[];
  entries: Expense[];
  monthlyTotals: MonthTotals[];
  colorMap: ColorMap;
  onExport: () => void;
};

export function YearlyTab({
  selectedYear,
  onYearChange,
  yearList,
  entries,
  monthlyTotals,
  colorMap,
  onExport,
}: YearlyTabProps) {
  const totals = getTotals(entries);

  const stats = [
    { label: "Avg income/mo", value: fmt(totals.income / 12) },
    { label: "Avg spend/mo", value: fmt(totals.expense / 12) },
    { label: "Avg saved/mo", value: fmtSigned(totals.net / 12) },
    { label: "Entries", value: String(entries.length) },
  ];

  // Months with nothing recorded shouldn't read as a break-even month.
  const activeMonths = monthlyTotals.filter((m) => m.income > 0 || m.expense > 0);
  const bestMonth = activeMonths.reduce<MonthTotals | null>(
    (best, m) => (!best || m.net > best.net ? m : best),
    null
  );

  return (
    <div className="space-y-4 mt-4">
      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={String(selectedYear)}
          onChange={(v) => onYearChange(Number(v))}
          options={yearList.map((y) => ({ value: String(y), label: String(y) }))}
        />
        <Button variant="ghost" size="sm" onClick={onExport} className="ml-auto">
          ⬇ Save image
        </Button>
      </div>

      <BalanceSummary totals={totals} netLabel={`Collected in ${selectedYear}`} />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map(({ label, value }) => (
          <Card key={label} variant="elevated">
            <CardContent>
              <p className="text-slate-500 text-xs">{label}</p>
              <p className="text-lg font-bold text-white mt-0.5">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card variant="elevated">
        <CardHeader
          title="Collected by month"
          description={
            bestMonth
              ? `Best month: ${bestMonth.month} (${fmtSigned(bestMonth.net)})`
              : "Income minus expenses, month by month"
          }
        />
        <CardContent>
          <div className="space-y-2">
            {monthlyTotals.map(({ month, income, expense, net, pct }) => {
              const idle = income === 0 && expense === 0;
              return (
                <div key={month} className="flex items-center gap-3">
                  <span className="text-slate-500 text-xs w-8 shrink-0">{month}</span>
                  <div className="flex-1">
                    <Progress
                      value={pct}
                      variant={net >= 0 ? "success" : "danger"}
                      size="sm"
                    />
                  </div>
                  <span
                    className={`text-xs w-28 text-right shrink-0 font-medium ${
                      idle ? "text-slate-600" : net >= 0 ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {idle ? "—" : fmtSigned(net)}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card variant="elevated">
          <CardHeader title="Spent by category" />
          <CardContent>
            <CategoryBreakdown
              entries={entries}
              kind="expense"
              colorMap={colorMap}
              emptyLabel="No expenses this year."
            />
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardHeader title="Earned by category" />
          <CardContent>
            <CategoryBreakdown
              entries={entries}
              kind="income"
              colorMap={colorMap}
              emptyLabel="No income this year."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
