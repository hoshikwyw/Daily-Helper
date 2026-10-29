"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Tabs, TabList, Tab, TabPanels, TabPanel, toast } from "@kwyw/kayv-glass-ui";
import { createExpense, deleteExpense, type NewExpense } from "@/lib/api/expenses";
import { createRecurrence } from "@/lib/api/recurrences";
import { describeSchedule, firstOccurrence, type Schedule } from "@/lib/recurrence";
import { useBudgets } from "@/hooks/use-budgets";
import { useExpenseCategories } from "@/hooks/use-expense-categories";
import { useExpenseYear } from "@/hooks/use-expense-year";
import { budgetProgress, effectiveBudgets } from "@/lib/budgets";
import { SetBudgetsModal } from "./_components/set-budgets-modal";
import { useRecurrenceSync } from "@/components/recurrence-sync";
import { RecurringRulesModal } from "@/components/ui/recurring-rules-modal";
import {
  formatLongDate,
  formatWeekday,
  monthPrefix,
  sameDayInMonth,
  toISODate,
  todayISO,
} from "@/lib/date";
import {
  KIND_TEXT_COLORS,
  MONTHS,
  buildImageCategories,
  fmt,
  fmtEntry,
  fmtSigned,
  getAccentHex,
  getDayActivity,
  getMonthActivity,
  getMonthlyTotals,
  getTotals,
} from "@/lib/expenses";
import { exportExpenseImage } from "@/lib/expenseImage";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { DailyTab } from "./_components/daily-tab";
import { MonthlyTab } from "./_components/monthly-tab";
import { YearlyTab } from "./_components/yearly-tab";
import { AddEntryModal } from "./_components/add-entry-modal";
import { ManageCategoriesModal } from "./_components/manage-categories-modal";
import type { EntryKind, Expense } from "@/lib/types";

export default function ExpensesPage() {
  const today = new Date();
  const [activeTab, setActiveTab] = useState("daily");

  const [fetchYear, setFetchYear] = useState(today.getFullYear());
  const { entries, loading, addEntry, removeEntry } = useExpenseYear(fetchYear);

  const [selectedDate, setSelectedDate] = useState(toISODate(today));
  // The month the daily calendar is showing. Kept apart from selectedDate so
  // the user can browse other months without losing the day they picked.
  const [calendarView, setCalendarView] = useState({
    year: today.getFullYear(),
    month: today.getMonth(),
  });
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedMonthYear, setSelectedMonthYear] = useState(today.getFullYear());
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());

  const { customCategories, allCategories, colorMap, addCategory, removeCategory } =
    useExpenseCategories();

  const [showCreate, setShowCreate] = useState(false);
  const [showManageCategories, setShowManageCategories] = useState(false);
  const [showRecurring, setShowRecurring] = useState(false);
  const [showBudgets, setShowBudgets] = useState(false);
  const { sync } = useRecurrenceSync();
  const { budgets, saveBudget } = useBudgets();

  // Each tab can land on a year outside the currently-loaded one — the daily
  // calendar by flipping months, the others via their year pickers. Syncing
  // fetchYear triggers the reload above.
  useEffect(() => {
    const target =
      activeTab === "daily"
        ? calendarView.year
        : activeTab === "monthly"
          ? selectedMonthYear
          : selectedYear;
    if (target !== fetchYear) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFetchYear(target);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, calendarView.year, selectedMonthYear, selectedYear]);

  // Flipping months carries the selected day along (same day number, clamped
  // to the new month). The figures beside the calendar then always describe a
  // day that is on screen and inside the loaded year.
  function handleCalendarViewChange(year: number, month: number) {
    setCalendarView({ year, month });
    setSelectedDate((prev) => sameDayInMonth(prev, year, month));
  }

  async function handleCreateEntry(values: NewExpense, repeat: Schedule | null): Promise<boolean> {
    if (repeat) {
      // The rule is the record; the sync creates the entry itself (and any
      // missed ones, when the date is in the past) and refetches the year.
      const rule = await createRecurrence({
        target: "expense",
        ...repeat,
        next_due: firstOccurrence(repeat),
        kind: values.kind,
        amount: values.amount,
        category: values.category,
        description: values.description ?? null,
      });
      if (!rule) return false;
      await sync();
      toast({
        title: "Repeat set up",
        description: describeSchedule(rule),
        variant: "success",
      });
      return true;
    }

    const created = await createExpense(values);
    if (!created) return false;
    addEntry(created);
    toast({
      title: created.kind === "income" ? "Income added" : "Expense added",
      variant: "success",
    });
    return true;
  }

  async function handleDelete(id: string) {
    if (!(await deleteExpense(id))) return;
    removeEntry(id);
    toast({ title: "Entry deleted", variant: "warning" });
  }

  async function handleAddCategory(
    kind: EntryKind,
    name: string,
    color: string
  ): Promise<boolean> {
    if (allCategories[kind].some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      toast({ title: "Category already exists", variant: "danger" });
      return false;
    }
    if (!(await addCategory(kind, name, color))) return false;
    toast({ title: "Category added", variant: "success" });
    return true;
  }

  async function handleDeleteCategory(id: string) {
    const name = customCategories.find((c) => c.id === id)?.name;
    if (!(await removeCategory(id))) return;
    // A budget is keyed by name, so it would otherwise outlive its category
    // and keep showing a limit nobody can spend against. End it from this
    // month on; earlier months keep their history.
    const thisMonth = monthPrefix(today.getFullYear(), today.getMonth());
    if (name && effectiveBudgets(budgets, thisMonth)[name]) {
      await saveBudget(name, thisMonth, 0);
    }
    toast({ title: "Category removed", variant: "warning" });
  }

  async function handleExportImage(
    periodLabel: string,
    title: string,
    subtitle: string | undefined,
    scoped: Expense[]
  ) {
    if (scoped.length === 0) {
      toast({ title: "Nothing to export here yet", variant: "warning" });
      return;
    }
    const totals = getTotals(scoped);
    try {
      await exportExpenseImage(
        {
          periodLabel,
          title,
          subtitle,
          total: fmtSigned(totals.net),
          totalLabel: "MONEY LEFT",
          income: fmt(totals.income),
          expense: fmt(totals.expense),
          entries: scoped.length,
          categories: buildImageCategories(scoped, colorMap, "expense"),
          accent: getAccentHex(),
          footerNote: `Exported ${todayISO()}`,
        },
        `kayv-money-${periodLabel.toLowerCase()}-${title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.png`
      );
      toast({ title: "Image ready 🎁", variant: "success" });
    } catch {
      toast({ title: "Couldn't export image", variant: "danger" });
    }
  }

  // ── Derived data ──
  const dailyEntries = useMemo(
    () => entries.filter((e) => e.date === selectedDate),
    [entries, selectedDate]
  );

  const dayActivity = useMemo(() => getDayActivity(entries), [entries]);

  const monthActivity = useMemo(
    () => getMonthActivity(dayActivity, selectedMonthYear),
    [dayActivity, selectedMonthYear]
  );

  const selectedMonthPrefix = monthPrefix(selectedMonthYear, selectedMonth);

  const monthlyEntries = useMemo(
    () => entries.filter((e) => e.date.startsWith(selectedMonthPrefix)),
    [entries, selectedMonthPrefix]
  );

  // The limits in force for the selected month (set once, carried forward),
  // and how the month's spending sits against them.
  const monthLimits = useMemo(
    () => effectiveBudgets(budgets, selectedMonthPrefix),
    [budgets, selectedMonthPrefix]
  );
  const monthBudgets = useMemo(
    () => budgetProgress(monthLimits, monthlyEntries),
    [monthLimits, monthlyEntries]
  );

  const monthlyTotals = useMemo(
    () => getMonthlyTotals(entries, selectedYear),
    [entries, selectedYear]
  );

  // Two years either side of today, plus whichever years are currently picked:
  // the Monthly calendar can flip past the window, and a Select whose value
  // is not among its options renders blank.
  const yearList = useMemo(() => {
    const years = new Set(Array.from({ length: 5 }, (_, i) => today.getFullYear() - 2 + i));
    years.add(selectedMonthYear);
    years.add(selectedYear);
    return [...years].sort((a, b) => a - b);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonthYear, selectedYear]);

  return (
    <PageContainer>
      <PageHeader
        breadcrumb={[{ label: "Today", href: "/dashboard" }, { label: "Money" }]}
        title="Money"
        subtitle="Track income and spending, and see what's left."
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={() => setShowRecurring(true)}>
              ⟳ Recurring
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowManageCategories(true)}>
              ⚙ Categories
            </Button>
            <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>
              + Add Entry
            </Button>
          </>
        }
      />

      <div className="relative">
        <Tabs value={activeTab} onChange={setActiveTab}>
          <TabList className="scroll-x">
            <Tab value="daily">Daily</Tab>
            <Tab value="monthly">Monthly</Tab>
            <Tab value="yearly">Yearly</Tab>
          </TabList>

          <TabPanels>
            <TabPanel value="daily">
              <DailyTab
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                viewYear={calendarView.year}
                viewMonth={calendarView.month}
                onViewChange={handleCalendarViewChange}
                activity={dayActivity}
                loading={loading}
                entries={dailyEntries}
                colorMap={colorMap}
                onDelete={handleDelete}
                onAdd={() => setShowCreate(true)}
                onExport={() =>
                  handleExportImage(
                    "Daily",
                    formatLongDate(selectedDate),
                    formatWeekday(selectedDate),
                    dailyEntries
                  )
                }
              />
            </TabPanel>

            <TabPanel value="monthly">
              <MonthlyTab
                selectedMonth={selectedMonth}
                onMonthChange={setSelectedMonth}
                selectedMonthYear={selectedMonthYear}
                onMonthYearChange={setSelectedMonthYear}
                entries={monthlyEntries}
                activity={monthActivity}
                loading={loading}
                colorMap={colorMap}
                budgets={monthBudgets}
                onDelete={handleDelete}
                onSetBudgets={() => setShowBudgets(true)}
                onExport={() =>
                  handleExportImage(
                    "Monthly",
                    `${MONTHS[selectedMonth]} ${selectedMonthYear}`,
                    undefined,
                    monthlyEntries
                  )
                }
              />
            </TabPanel>

            <TabPanel value="yearly">
              <YearlyTab
                selectedYear={selectedYear}
                onYearChange={setSelectedYear}
                yearList={yearList}
                entries={entries}
                monthlyTotals={monthlyTotals}
                colorMap={colorMap}
                onExport={() =>
                  handleExportImage("Yearly", String(selectedYear), undefined, entries)
                }
              />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </div>

      <AddEntryModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        // The picked day only means something while it is on screen; from the
        // Monthly or Yearly tab the natural default is today.
        defaultDate={activeTab === "daily" ? selectedDate : todayISO()}
        categories={allCategories}
        onSubmit={handleCreateEntry}
      />

      <SetBudgetsModal
        open={showBudgets}
        onClose={() => setShowBudgets(false)}
        monthLabel={`${MONTHS[selectedMonth]} ${selectedMonthYear}`}
        categories={allCategories.expense}
        limits={monthLimits}
        onSave={(category, amount) => saveBudget(category, selectedMonthPrefix, amount)}
      />

      <RecurringRulesModal
        open={showRecurring}
        onClose={() => setShowRecurring(false)}
        target="expense"
        title="Recurring entries"
        emptyHint="No repeating entries yet. Pick a Repeat option when adding one."
        renderSummary={(rule) => {
          const kind = rule.kind ?? "expense";
          return (
            <span className="flex items-center gap-2">
              <span className="truncate">{rule.description || rule.category}</span>
              <span className={`shrink-0 font-semibold ${KIND_TEXT_COLORS[kind]}`}>
                {fmtEntry({ kind, amount: rule.amount ?? 0 })}
              </span>
            </span>
          );
        }}
      />

      <ManageCategoriesModal
        open={showManageCategories}
        onClose={() => setShowManageCategories(false)}
        customCategories={customCategories}
        onAddCategory={handleAddCategory}
        onDeleteCategory={handleDeleteCategory}
      />
    </PageContainer>
  );
}
