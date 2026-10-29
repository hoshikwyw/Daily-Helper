import { Card, CardHeader, CardContent, Button } from "@kwyw/kayv-glass-ui";
import { getTotals, type ColorMap, type DayActivity } from "@/lib/expenses";
import { formatFullDayLabel, todayISO } from "@/lib/date";
import { SkeletonList } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { BalanceSummary } from "@/components/ui/balance-summary";
import { CategorySplit } from "@/components/ui/category-split";
import { ExpenseRow } from "./expense-row";
import { MoneyCalendar } from "./money-calendar";
import type { Expense } from "@/lib/types";

type DailyTabProps = {
  selectedDate: string;
  onDateChange: (value: string) => void;
  viewYear: number;
  viewMonth: number;
  onViewChange: (year: number, month: number) => void;
  activity: Record<string, DayActivity>;
  loading: boolean;
  entries: Expense[];
  colorMap: ColorMap;
  onDelete: (id: string) => void;
  /** Opens the add-entry form, pre-dated to the selected day. */
  onAdd: () => void;
  onExport: () => void;
};

export function DailyTab({
  selectedDate,
  onDateChange,
  viewYear,
  viewMonth,
  onViewChange,
  activity,
  loading,
  entries,
  colorMap,
  onDelete,
  onAdd,
  onExport,
}: DailyTabProps) {
  const totals = getTotals(entries);
  const isToday = selectedDate === todayISO();

  return (
    // The calendar is how you pick a day, so it leads on a phone and sits in a
    // fixed-width rail beside the figures on a wide screen.
    <div className="mt-4 grid grid-cols-1 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)] gap-4 lg:gap-6 lg:items-start">
      <Card variant="elevated">
        <CardHeader title="Pick a day" description="Dotted days have entries." />
        <CardContent>
          <MoneyCalendar
            viewYear={viewYear}
            viewMonth={viewMonth}
            onViewChange={onViewChange}
            selectedDate={selectedDate}
            onSelect={onDateChange}
            activity={activity}
            loading={loading}
          />
        </CardContent>
      </Card>

      <div className="space-y-4 min-w-0">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-100 truncate">
              {formatFullDayLabel(selectedDate)}
            </p>
            {isToday && <p className="text-xs text-slate-400">Today</p>}
          </div>
          <Button variant="ghost" size="sm" onClick={onExport} className="ml-auto">
            ⬇ Save image
          </Button>
        </div>

        <BalanceSummary totals={totals} netLabel="Left today" showSavingsRate={false} />

        {entries.length > 0 && (
          <Card variant="elevated">
            <CardHeader title="By category" />
            <CardContent>
              <CategorySplit entries={entries} colorMap={colorMap} period="today" />
            </CardContent>
          </Card>
        )}

        <Card variant="elevated">
          <CardHeader
            title="Entries"
            description={`${entries.length} ${entries.length === 1 ? "entry" : "entries"}`}
          />
          <CardContent>
            {loading ? (
              <SkeletonList />
            ) : entries.length === 0 ? (
              <div className="text-center py-6 space-y-3">
                <EmptyState padding="sm">
                  Nothing logged {isToday ? "today" : "on this day"} yet.
                </EmptyState>
                <Button variant="ghost" size="sm" onClick={onAdd}>
                  + Add entry for this day
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
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
