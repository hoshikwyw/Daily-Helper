import { Card, CardHeader, CardContent, Button, Select, Progress } from "@kwyw/kayv-glass-ui";
import {
  fmt,
  fmtSigned,
  getTotals,
  type ColorMap,
  type DayActivity,
  type MonthTotals,
} from "@/lib/expenses";
import { BalanceSummary } from "@/components/ui/balance-summary";
import { CategorySplit } from "@/components/ui/category-split";
import { YearOverview } from "./year-overview";
import type { Expense } from "@/lib/types";

type YearlyTabProps = {
  selectedYear: number;
  onYearChange: (value: number) => void;
  yearList: number[];
  entries: Expense[];
  monthlyTotals: MonthTotals[];
  /** Which days have entries, from `getDayActivity`, for the loaded year. */
  activity: Record<string, DayActivity>;
  loading: boolean;
  colorMap: ColorMap;
  /** Tapping a day in the year overview opens it on the Daily tab. */
  onDayPick: (date: string) => void;
  /** Tapping a month name opens that month on the Monthly tab. */
  onMonthPick: (month: number) => void;
  onExport: () => void;
};

export function YearlyTab({
  selectedYear,
  onYearChange,
  yearList,
  entries,
  monthlyTotals,
  activity,
  loading,
  colorMap,
  onDayPick,
  onMonthPick,
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
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
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

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {stats.map(({ label, value }) => (
          <Card key={label} variant="elevated">
            <CardContent>
              <p className="text-slate-400 text-xs">{label}</p>
              <p className="text-base sm:text-lg font-semibold text-white mt-0.5 truncate">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card variant="elevated">
        <CardHeader
          title="Days logged"
          description="Every day of the year; tap one to open it, or a month name for the month."
        />
        <CardContent>
          <YearOverview
            year={selectedYear}
            activity={activity}
            onDayPick={onDayPick}
            onMonthPick={onMonthPick}
            loading={loading}
          />
        </CardContent>
      </Card>

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
                  <span className="text-slate-400 text-xs w-8 shrink-0">{month}</span>
                  <div className="flex-1">
                    <Progress
                      value={pct}
                      variant={net >= 0 ? "success" : "danger"}
                      size="sm"
                    />
                  </div>
                  <span
                    className={`text-xs w-20 sm:w-28 text-right shrink-0 font-medium ${
                      idle ? "text-slate-500" : net >= 0 ? "text-emerald-400" : "text-rose-400"
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

      <Card variant="elevated">
        <CardHeader title="By category" />
        <CardContent>
          <CategorySplit entries={entries} colorMap={colorMap} period="this year" />
        </CardContent>
      </Card>
    </div>
  );
}
