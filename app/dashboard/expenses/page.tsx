"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Tabs, TabList, Tab, TabPanels, TabPanel, toast } from "@kwyw/kayv-glass-ui";
import {
  createExpense,
  createExpenseCategory,
  deleteExpense,
  deleteExpenseCategory,
  listExpenseCategories,
  listExpensesForYear,
  type NewExpense,
} from "@/lib/api/expenses";
import {
  formatLongDate,
  formatWeekday,
  fromISODate,
  monthPrefix,
  sameDayInMonth,
  toISODate,
  todayISO,
} from "@/lib/date";
import {
  MONTHS,
  buildColorMap,
  buildImageCategories,
  fmt,
  fmtSigned,
  getAccentHex,
  getDayActivity,
  getMonthActivity,
  getMonthlyTotals,
  getTotals,
  mergeCategories,
} from "@/lib/expenses";
import { exportExpenseImage } from "@/lib/expenseImage";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { DailyTab } from "./_components/daily-tab";
import { MonthlyTab } from "./_components/monthly-tab";
import { YearlyTab } from "./_components/yearly-tab";
import { AddEntryModal } from "./_components/add-entry-modal";
import { ManageCategoriesModal } from "./_components/manage-categories-modal";
import type { CustomCategory, EntryKind, Expense } from "@/lib/types";

export default function ExpensesPage() {
  const today = new Date();
  const [activeTab, setActiveTab] = useState("daily");

  const [entries, setEntries] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchYear, setFetchYear] = useState(today.getFullYear());

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

  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);

  const [showCreate, setShowCreate] = useState(false);
  const [showManageCategories, setShowManageCategories] = useState(false);

  // Built-in plus custom categories, split per ledger, and a color lookup.
  const allCategories = useMemo(() => mergeCategories(customCategories), [customCategories]);

  const colorMap = useMemo(() => buildColorMap(allCategories), [allCategories]);

  // Years already fetched this session. Hopping between tabs that point at
  // different years then swaps instantly instead of re-downloading a whole
  // year and flashing skeletons. Empty results are not kept, so a year that
  // came back empty because of a network error is retried next time.
  const yearCache = useRef(new Map<number, Expense[]>());

  // Flipping the calendar across a year boundary and back fires two fetches
  // in quick succession, and the slower one can land last. Each request takes
  // a ticket; a response whose ticket is no longer current is thrown away so
  // the screen never shows one year's entries under another year's calendar.
  const fetchTicket = useRef(0);
  const fetchInFlight = useRef(false);

  async function loadEntries(year: number) {
    const ticket = ++fetchTicket.current;
    const cached = yearCache.current.get(year);
    if (cached) {
      fetchInFlight.current = false;
      setEntries(cached);
      setLoading(false);
      return;
    }
    fetchInFlight.current = true;
    setLoading(true);
    try {
      const rows = await listExpensesForYear(year);
      if (ticket !== fetchTicket.current) return;
      if (rows.length > 0) yearCache.current.set(year, rows);
      setEntries(rows);
    } finally {
      if (ticket === fetchTicket.current) {
        fetchInFlight.current = false;
        setLoading(false);
      }
    }
  }

  async function loadCategories() {
    setCustomCategories(await listExpenseCategories());
  }

  // Both loaders set state once their request resolves (or at once, from the
  // year cache); the rule cannot see past the async boundary.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    loadEntries(fetchYear);
  }, [fetchYear]);

  // Categories do not depend on the year, so once per visit is enough.
  useEffect(() => {
    loadCategories();
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

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

  async function handleCreateEntry(values: NewExpense): Promise<boolean> {
    const created = await createExpense(values);
    if (!created) return false;
    const year = fromISODate(created.date).getFullYear();
    const cached = yearCache.current.get(year);
    if (cached) yearCache.current.set(year, [created, ...cached]);
    if (year === fetchYear) {
      // A fetch that started before the insert would land without the new row
      // and wipe it from the list, so in that case fetch again instead.
      if (fetchInFlight.current) {
        yearCache.current.delete(year);
        loadEntries(year);
      } else {
        setEntries((prev) => [created, ...prev]);
      }
    }
    toast({
      title: created.kind === "income" ? "Income added" : "Expense added",
      variant: "success",
    });
    return true;
  }

  async function handleDelete(id: string) {
    if (!(await deleteExpense(id))) return;
    setEntries((prev) => prev.filter((e) => e.id !== id));
    for (const [year, rows] of yearCache.current) {
      yearCache.current.set(year, rows.filter((e) => e.id !== id));
    }
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
    const created = await createExpenseCategory(kind, name, color);
    if (!created) return false;
    setCustomCategories((prev) => [...prev, created]);
    toast({ title: "Category added", variant: "success" });
    return true;
  }

  async function handleDeleteCategory(id: string) {
    if (!(await deleteExpenseCategory(id))) return;
    setCustomCategories((prev) => prev.filter((c) => c.id !== id));
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

  const monthlyEntries = useMemo(() => {
    const prefix = monthPrefix(selectedMonthYear, selectedMonth);
    return entries.filter((e) => e.date.startsWith(prefix));
  }, [entries, selectedMonth, selectedMonthYear]);

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
                onDelete={handleDelete}
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
