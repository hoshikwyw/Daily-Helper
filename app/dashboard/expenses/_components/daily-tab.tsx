import { Card, CardHeader, CardContent, Button, Input } from "@kwyw/kayv-glass-ui";
import { getTotals, type ColorMap } from "@/lib/expenses";
import { SkeletonList } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { BalanceSummary } from "@/components/ui/balance-summary";
import { CategoryBreakdown } from "@/components/ui/category-breakdown";
import { ExpenseRow } from "./expense-row";
import type { Expense } from "@/lib/types";

type DailyTabProps = {
  selectedDate: string;
  onDateChange: (value: string) => void;
  loading: boolean;
  entries: Expense[];
  colorMap: ColorMap;
  onDelete: (id: string) => void;
  onExport: () => void;
};

export function DailyTab({
  selectedDate,
  onDateChange,
  loading,
  entries,
  colorMap,
  onDelete,
  onExport,
}: DailyTabProps) {
  const totals = getTotals(entries);

  return (
    <div className="space-y-4 mt-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          type="date"
          value={selectedDate}
          onChange={(e) => onDateChange(e.target.value)}
        />
        <Button variant="ghost" size="sm" onClick={onExport} className="ml-auto">
          ⬇ Save image
        </Button>
      </div>

      <BalanceSummary totals={totals} netLabel="Left today" showSavingsRate={false} />

      {entries.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card variant="elevated">
            <CardHeader title="Spent by category" />
            <CardContent>
              <CategoryBreakdown
                entries={entries}
                kind="expense"
                colorMap={colorMap}
                emptyLabel="Nothing spent today."
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
                emptyLabel="No income today."
              />
            </CardContent>
          </Card>
        </div>
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
            <EmptyState>No entries for {selectedDate}. Add one above!</EmptyState>
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
  );
}
