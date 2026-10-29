import { Card, CardHeader, CardContent, Button } from "@kwyw/kayv-glass-ui";
import {
  MONTHS,
  categoryColor,
  filterByCategory,
  getCategoryOverview,
  getTotals,
  type ColorMap,
  type MonthActivity,
} from "@/lib/expenses";
import { plural } from "@/lib/text";
import type { BudgetProgress } from "@/lib/budgets";
import { EmptyState } from "@/components/ui/empty-state";
import { BalanceSummary } from "@/components/ui/balance-summary";
import { CategorySplit } from "@/components/ui/category-split";
import { CategoryFilter } from "@/components/ui/category-filter";
import { CategoryOverviewCard } from "@/components/ui/category-overview";
import { ExpenseRow } from "./expense-row";
import { MonthPicker } from "./month-picker";
import type { Expense } from "@/lib/types";

type MonthlyTabProps = {
  selectedMonth: number;
  onMonthChange: (value: number) => void;
  selectedMonthYear: number;
  onMonthYearChange: (value: number) => void;
  entries: Expense[];
  /** The month before, for the category comparison; null when it is not loaded. */
  previousEntries: Expense[] | null;
  /** Per-month roll-up for the selected year, from `getMonthActivity`. */
  activity: MonthActivity[];
  loading: boolean;
  colorMap: ColorMap;
  /** This month's spending against its limits, keyed by category. */
  budgets: Record<string, BudgetProgress>;
  /** Spending categories to offer as filters. */
  categoryOptions: { name: string; color: string }[];
  /** The category in focus, or null for everything. */
  category: string | null;
  onCategoryChange: (category: string | null) => void;
  onDelete: (id: string) => void;
  onSetBudgets: () => void;
  onExport: () => void;
};

export function MonthlyTab({
  selectedMonth,
  onMonthChange,
  selectedMonthYear,
  onMonthYearChange,
  entries,
  previousEntries,
  activity,
  loading,
  colorMap,
  budgets,
  categoryOptions,
  category,
  onCategoryChange,
  onDelete,
  onSetBudgets,
  onExport,
}: MonthlyTabProps) {
  const totals = getTotals(entries);
  const now = new Date();
  const isThisMonth =
    selectedMonthYear === now.getFullYear() && selectedMonth === now.getMonth();
  const monthLabel = `${MONTHS[selectedMonth]} ${selectedMonthYear}`;

  // With a category in focus the figures narrow to it: an overview card in
  // place of the balance and the split, and only its entries in the list.
  const shown = category ? filterByCategory(entries, category) : entries;

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
            <p className="text-sm font-semibold text-slate-100 truncate">{monthLabel}</p>
            {isThisMonth && <p className="text-xs text-slate-400">This month</p>}
          </div>
          <div className="ml-auto flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={onSetBudgets}>
              ◎ Budgets
            </Button>
            <Button variant="ghost" size="sm" onClick={onExport}>
              ⬇ Save image
            </Button>
          </div>
        </div>

        <CategoryFilter options={categoryOptions} value={category} onChange={onCategoryChange} />

        {category ? (
          <CategoryOverviewCard
            overview={getCategoryOverview(entries, category)}
            color={categoryColor(colorMap, "expense", category)}
            periodLabel={monthLabel}
            previousTotal={
              previousEntries ? getCategoryOverview(previousEntries, category).total : null
            }
            previousLabel="last month"
            budget={budgets[category] ?? null}
          />
        ) : (
          <>
            <BalanceSummary totals={totals} netLabel="Collected this month" />

            <Card variant="elevated">
              <CardHeader
                title="By category"
                description={
                  Object.keys(budgets).length > 0
                    ? "Spending against this month's budgets."
                    : "Set budgets to see how each category is tracking."
                }
              />
              <CardContent>
                <CategorySplit
                  entries={entries}
                  colorMap={colorMap}
                  period="this month"
                  budgets={budgets}
                />
              </CardContent>
            </Card>
          </>
        )}

        <Card variant="elevated">
          <CardHeader
            title={category ? `${category} entries` : "All Entries"}
            description={plural(shown.length, "entry", "entries")}
          />
          <CardContent>
            {shown.length === 0 ? (
              <EmptyState padding="lg">
                {category ? `Nothing spent on ${category} this month.` : "No entries this month."}
              </EmptyState>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {shown.map((entry) => (
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
