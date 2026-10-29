import { Card, CardHeader, CardContent, Button } from "@kwyw/kayv-glass-ui";
import { MONTHS, getTotals, type ColorMap, type MonthActivity } from "@/lib/expenses";
import { plural } from "@/lib/text";
import { EmptyState } from "@/components/ui/empty-state";
import { BalanceSummary } from "@/components/ui/balance-summary";
import { CategorySplit } from "@/components/ui/category-split";
import { ExpenseRow } from "./expense-row";
import { MonthPicker } from "./month-picker";
import type { Expense } from "@/lib/types";

type MonthlyTabProps = {
  selectedMonth: number;
  onMonthChange: (value: number) => void;
  selectedMonthYear: number;
  onMonthYearChange: (value: number) => void;
  entries: Expense[];
  /** Per-month roll-up for the selected year, from `getMonthActivity`. */
  activity: MonthActivity[];
  loading: boolean;
  colorMap: ColorMap;
  onDelete: (id: string) => void;
  onExport: () => void;
};

export function MonthlyTab({
  selectedMonth,
  onMonthChange,
  selectedMonthYear,
  onMonthYearChange,
  entries,
  activity,
  loading,
  colorMap,
  onDelete,
  onExport,
}: MonthlyTabProps) {
  const totals = getTotals(entries);
  const now = new Date();
  const isThisMonth =
    selectedMonthYear === now.getFullYear() && selectedMonth === now.getMonth();

  return (
    // Same placement as the Daily tab: the picker leads on a phone and takes
    // the left rail on a wide screen.
    <div className="mt-4 grid grid-cols-1 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)] gap-4 lg:gap-6 lg:items-start">
      <Card variant="elevated">
        <CardHeader title="Pick a month" description="Dotted months have entries." />
        <CardContent>
          <MonthPicker
            year={selectedMonthYear}
            onYearChange={onMonthYearChange}
            selectedMonth={selectedMonth}
            onSelect={onMonthChange}
            activity={activity}
            loading={loading}
          />
        </CardContent>
      </Card>

      <div className="space-y-4 min-w-0">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-100 truncate">
              {MONTHS[selectedMonth]} {selectedMonthYear}
            </p>
            {isThisMonth && <p className="text-xs text-slate-400">This month</p>}
          </div>
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
            description={plural(entries.length, "entry", "entries")}
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
    </div>
  );
}
