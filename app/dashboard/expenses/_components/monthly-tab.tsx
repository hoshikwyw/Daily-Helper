import { Card, CardHeader, CardContent, Button, Select } from "@kwyw/kayv-glass-ui";
import { MONTHS, getTotals, type ColorMap } from "@/lib/expenses";
import { EmptyState } from "@/components/ui/empty-state";
import { BalanceSummary } from "@/components/ui/balance-summary";
import { CategorySplit } from "@/components/ui/category-split";
import { ExpenseRow } from "./expense-row";
import type { Expense } from "@/lib/types";

type MonthlyTabProps = {
  selectedMonth: number;
  onMonthChange: (value: number) => void;
  selectedMonthYear: number;
  onMonthYearChange: (value: number) => void;
  yearList: number[];
  entries: Expense[];
  colorMap: ColorMap;
  onDelete: (id: string) => void;
  onExport: () => void;
};

export function MonthlyTab({
  selectedMonth,
  onMonthChange,
  selectedMonthYear,
  onMonthYearChange,
  yearList,
  entries,
  colorMap,
  onDelete,
  onExport,
}: MonthlyTabProps) {
  const totals = getTotals(entries);

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
        <Button variant="ghost" size="sm" onClick={onExport} className="ml-auto">
          ⬇ Save image
        </Button>
      </div>

      <BalanceSummary totals={totals} netLabel="Collected this month" />

      <Card variant="elevated">
        <CardHeader title="By category" />
        <CardContent>
          <CategorySplit entries={entries} colorMap={colorMap} period="this month" />
        </CardContent>
      </Card>

      <Card variant="elevated">
        <CardHeader
          title="All Entries"
          description={`${entries.length} ${entries.length === 1 ? "entry" : "entries"}`}
        />
        <CardContent>
          {entries.length === 0 ? (
            <EmptyState padding="lg">No entries this month.</EmptyState>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {entries.map((entry) => (
                <ExpenseRow
                  key={entry.id}
                  expense={entry}
                  colorMap={colorMap}
                  onDelete={onDelete}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
