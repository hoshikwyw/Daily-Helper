"use client";

import { useEffect, useState, useMemo } from "react";
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
import { formatLongDate, formatWeekday, toISODate, todayISO } from "@/lib/date";
import {
  MONTHS,
  buildColorMap,
  buildImageCategories,
  fmt,
  fmtSigned,
  getAccentHex,
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
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedMonthYear, setSelectedMonthYear] = useState(today.getFullYear());
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());

  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);

  const [showCreate, setShowCreate] = useState(false);
  const [showManageCategories, setShowManageCategories] = useState(false);

  // Built-in plus custom categories, split per ledger, and a color lookup.
  const allCategories = useMemo(() => mergeCategories(customCategories), [customCategories]);

  const colorMap = useMemo(() => buildColorMap(allCategories), [allCategories]);

  async function loadEntries(year: number) {
    setLoading(true);
    setEntries(await listExpensesForYear(year));
    setLoading(false);
  }

  async function loadCategories() {
    setCustomCategories(await listExpenseCategories());
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadEntries(fetchYear);
    loadCategories();
  }, [fetchYear]);

  // Monthly/yearly tabs can select a year outside the currently-loaded one;
  // syncing fetchYear triggers the reload above.
  useEffect(() => {
    const target =
      activeTab === "monthly" ? selectedMonthYear : activeTab === "yearly" ? selectedYear : null;
    if (target !== null && target !== fetchYear) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFetchYear(target);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, selectedMonthYear, selectedYear]);

  async function handleCreateEntry(values: NewExpense): Promise<boolean> {
    const created = await createExpense(values);
    if (!created) return false;
    // Only surface it immediately when it belongs to the year on screen.
    if (created.date.startsWith(String(fetchYear))) {
      setEntries((prev) => [created, ...prev]);
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

  const monthlyEntries = useMemo(() => {
    const prefix = `${selectedMonthYear}-${String(selectedMonth + 1).padStart(2, "0")}`;
    return entries.filter((e) => e.date.startsWith(prefix));
  }, [entries, selectedMonth, selectedMonthYear]);

  const monthlyTotals = useMemo(
    () => getMonthlyTotals(entries, selectedYear),
    [entries, selectedYear]
  );

  const yearList = Array.from({ length: 5 }, (_, i) => today.getFullYear() - 2 + i);

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
                loading={loading}
                entries={dailyEntries}
                colorMap={colorMap}
                onDelete={handleDelete}
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
                yearList={yearList}
                entries={monthlyEntries}
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
