import {
  Card,
  CardHeader,
  CardContent,
  Badge,
  Button,
  Select,
  Progress,
} from "@kwyw/kayv-glass-ui";
import { fmt, getCategoryBreakdown, FALLBACK_CATEGORY_COLOR } from "@/lib/expenses";
import type { Expense } from "@/lib/types";

type MonthlyTotal = { month: string; sum: number; pct: number };

type YearlyTabProps = {
  selectedYear: number;
  onYearChange: (value: number) => void;
  yearList: number[];
  expenses: Expense[];
  total: number;
  monthlyTotals: MonthlyTotal[];
  colorMap: Record<string, string>;
  onExport: () => void;
};

export function YearlyTab({
  selectedYear,
  onYearChange,
  yearList,
  expenses,
  total,
  monthlyTotals,
  colorMap,
  onExport,
}: YearlyTabProps) {
  const stats = [
    { label: "Avg/month", value: fmt(total / 12) },
    { label: "Avg/day", value: fmt(total / 365) },
    { label: "Entries", value: String(expenses.length) },
    { label: "Categories", value: String(new Set(expenses.map((e) => e.category)).size) },
  ];

  return (
    <div className="space-y-4 mt-4">
      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={String(selectedYear)}
          onChange={(v) => onYearChange(Number(v))}
          options={yearList.map((y) => ({ value: String(y), label: String(y) }))}
        />
        <div className="ml-auto flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onExport}>
            ⬇ Save image
          </Button>
          <div className="text-right">
            <p className="text-slate-500 text-xs">Total {selectedYear}</p>
            <p className="text-2xl font-bold text-white">{fmt(total)}</p>
          </div>
        </div>
      </div>

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card variant="elevated">
          <CardHeader title="Monthly Breakdown" />
          <CardContent>
            <div className="space-y-2">
              {monthlyTotals.map(({ month, sum, pct }) => (
                <div key={month} className="flex items-center gap-3">
                  <span className="text-slate-500 text-xs w-8 shrink-0">{month}</span>
                  <div className="flex-1">
                    <Progress value={pct} variant={sum > 0 ? "primary" : "warning"} size="sm" />
                  </div>
                  <span className="text-slate-300 text-xs w-24 text-right shrink-0 font-medium">
                    {sum > 0 ? fmt(sum) : "—"}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardHeader title="By Category" />
          <CardContent>
            {expenses.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-8">No expenses this year.</p>
            ) : (
              <div className="space-y-3">
                {getCategoryBreakdown(expenses).map(({ category, amount, pct }) => (
                  <div key={category} className="flex items-center gap-3">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: colorMap[category] ?? FALLBACK_CATEGORY_COLOR }}
                    />
                    <span className="text-slate-300 text-sm flex-1">{category}</span>
                    <Badge variant="default" size="sm">{pct}%</Badge>
                    <span className="text-slate-400 text-sm font-medium">{fmt(amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
