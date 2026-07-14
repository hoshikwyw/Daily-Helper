import {
  Card,
  CardHeader,
  CardContent,
  Button,
  Input,
} from "@kwyw/kayv-glass-ui";
import { fmt, getCategoryBreakdown, FALLBACK_CATEGORY_COLOR } from "@/lib/expenses";
import { SkeletonList } from "@/components/ui/skeleton";
import { ExpenseRow } from "./expense-row";
import type { Expense } from "@/lib/types";

type DailyTabProps = {
  selectedDate: string;
  onDateChange: (value: string) => void;
  loading: boolean;
  expenses: Expense[];
  total: number;
  colorMap: Record<string, string>;
  onDelete: (id: string) => void;
  onExport: () => void;
};

export function DailyTab({
  selectedDate,
  onDateChange,
  loading,
  expenses,
  total,
  colorMap,
  onDelete,
  onExport,
}: DailyTabProps) {
  return (
    <div className="space-y-4 mt-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          type="date"
          value={selectedDate}
          onChange={(e) => onDateChange(e.target.value)}
        />
        <div className="flex-1 flex items-center justify-end gap-3">
          <Button variant="ghost" size="sm" onClick={onExport}>
            ⬇ Save image
          </Button>
          <div className="text-right">
            <p className="text-slate-500 text-xs">Total</p>
            <p className="text-2xl font-bold text-white">{fmt(total)}</p>
          </div>
        </div>
      </div>

      {expenses.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {getCategoryBreakdown(expenses).slice(0, 3).map(({ category, amount }) => (
            <Card key={category} variant="elevated">
              <CardContent>
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: colorMap[category] ?? FALLBACK_CATEGORY_COLOR }}
                  />
                  <span className="text-slate-400 text-xs truncate flex-1">{category}</span>
                  <span className="text-white text-sm font-semibold">{fmt(amount)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card variant="elevated">
        <CardHeader
          title="Entries"
          description={`${expenses.length} expense${expenses.length !== 1 ? "s" : ""}`}
        />
        <CardContent>
          {loading ? (
            <SkeletonList />
          ) : expenses.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-10">
              No expenses for {selectedDate}. Add one above!
            </p>
          ) : (
            <div className="space-y-2">
              {expenses.map((expense) => (
                <ExpenseRow key={expense.id} expense={expense} colorMap={colorMap} onDelete={onDelete} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
