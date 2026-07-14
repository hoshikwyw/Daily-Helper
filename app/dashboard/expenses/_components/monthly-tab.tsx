import {
  Card,
  CardHeader,
  CardContent,
  Button,
  Select,
  Progress,
} from "@kwyw/kayv-glass-ui";
import { fmt, getCategoryBreakdown, MONTHS, FALLBACK_CATEGORY_COLOR } from "@/lib/expenses";
import { ExpenseRow } from "./expense-row";
import type { Expense } from "@/lib/types";

type MonthlyTabProps = {
  selectedMonth: number;
  onMonthChange: (value: number) => void;
  selectedMonthYear: number;
  onMonthYearChange: (value: number) => void;
  yearList: number[];
  expenses: Expense[];
  total: number;
  colorMap: Record<string, string>;
  onDelete: (id: string) => void;
  onExport: () => void;
};

export function MonthlyTab({
  selectedMonth,
  onMonthChange,
  selectedMonthYear,
  onMonthYearChange,
  yearList,
  expenses,
  total,
  colorMap,
  onDelete,
  onExport,
}: MonthlyTabProps) {
  return (
    <div className="space-y-4 mt-4">
      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={String(selectedMonth)}
          onChange={(v) => onMonthChange(Number(v))}
          options={MONTHS.map((m, i) => ({ value: String(i), label: m }))}
        />
        <Select
          value={String(selectedMonthYear)}
          onChange={(v) => onMonthYearChange(Number(v))}
          options={yearList.map((y) => ({ value: String(y), label: String(y) }))}
        />
        <div className="ml-auto flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onExport}>
            ⬇ Save image
          </Button>
          <div className="text-right">
            <p className="text-slate-500 text-xs">Total</p>
            <p className="text-2xl font-bold text-white">{fmt(total)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card variant="elevated">
          <CardHeader title="By Category" />
          <CardContent>
            {expenses.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-8">No expenses this month.</p>
            ) : (
              <div className="space-y-4">
                {getCategoryBreakdown(expenses).map(({ category, amount, pct }) => (
                  <div key={category} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-300 flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: colorMap[category] ?? FALLBACK_CATEGORY_COLOR }}
                        />
                        {category}
                      </span>
                      <span className="text-slate-400">
                        {fmt(amount)}{" "}
                        <span className="text-xs text-slate-600">({pct}%)</span>
                      </span>
                    </div>
                    <Progress value={pct} variant="primary" size="sm" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardHeader
            title="All Entries"
            description={`${expenses.length} expense${expenses.length !== 1 ? "s" : ""}`}
          />
          <CardContent>
            {expenses.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-8">No expenses this month.</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {expenses.map((expense) => (
                  <ExpenseRow key={expense.id} expense={expense} colorMap={colorMap} onDelete={onDelete} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
