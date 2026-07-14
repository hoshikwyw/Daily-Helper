"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Button,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  toast,
} from "@kwyw/kayv-glass-ui";
import { supabase } from "@/lib/supabase";
import { getUserId, reportError } from "@/lib/db";
import { toISODate, todayISO } from "@/lib/date";
import {
  DEFAULT_CATEGORIES,
  MONTHS,
  fmt,
  buildImageCategories,
  getAccentHex,
} from "@/lib/expenses";
import { exportExpenseImage } from "@/lib/expenseImage";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { DailyTab } from "./_components/daily-tab";
import { MonthlyTab } from "./_components/monthly-tab";
import { YearlyTab } from "./_components/yearly-tab";
import { AddExpenseModal, type NewExpense } from "./_components/add-expense-modal";
import { ManageCategoriesModal } from "./_components/manage-categories-modal";
import type { Expense, CustomCategory } from "@/lib/types";

export default function ExpensesPage() {
  const today = new Date();
  const [activeTab, setActiveTab] = useState("daily");

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchYear, setFetchYear] = useState(today.getFullYear());

  const [selectedDate, setSelectedDate] = useState(toISODate(today));
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedMonthYear, setSelectedMonthYear] = useState(today.getFullYear());
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());

  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);

  const [showCreate, setShowCreate] = useState(false);
  const [showManageCategories, setShowManageCategories] = useState(false);

  // Merged category list (built-in + custom) and a name → color lookup.
  const allCategories = useMemo(
    () => [...DEFAULT_CATEGORIES, ...customCategories.map((c) => ({ name: c.name, color: c.color }))],
    [customCategories]
  );

  const colorMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const c of allCategories) m[c.name] = c.color;
    return m;
  }, [allCategories]);

  async function loadExpenses(year: number) {
    setLoading(true);
    const { data } = await supabase
      .from("expenses")
      .select("*")
      .gte("date", `${year}-01-01`)
      .lte("date", `${year}-12-31`)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });
    if (data) setExpenses(data);
    setLoading(false);
  }

  async function loadCategories() {
    const { data } = await supabase.from("expense_categories").select("*").order("created_at");
    if (data) setCustomCategories(data);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadExpenses(fetchYear);
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

  async function handleCreateExpense(values: NewExpense): Promise<boolean> {
    const userId = await getUserId();
    if (!userId) return false;
    const { data, error } = await supabase
      .from("expenses")
      .insert({ ...values, user_id: userId })
      .select()
      .single();
    if (error || !data) { reportError(error); return false; }
    if (data.date.startsWith(String(fetchYear))) {
      setExpenses((prev) => [data, ...prev]);
    }
    toast({ title: "Expense added", variant: "success" });
    return true;
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (!error) {
      setExpenses((prev) => prev.filter((e) => e.id !== id));
      toast({ title: "Expense deleted", variant: "warning" });
    }
  }

  async function handleAddCategory(name: string, color: string): Promise<boolean> {
    if (allCategories.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      toast({ title: "Category already exists", variant: "danger" });
      return false;
    }
    const userId = await getUserId();
    if (!userId) return false;
    const { data, error } = await supabase
      .from("expense_categories")
      .insert({ name, color, user_id: userId })
      .select()
      .single();
    if (error || !data) { reportError(error); return false; }
    setCustomCategories((prev) => [...prev, data]);
    toast({ title: "Category added", variant: "success" });
    return true;
  }

  async function handleDeleteCategory(id: string) {
    const { error } = await supabase.from("expense_categories").delete().eq("id", id);
    if (!error) {
      setCustomCategories((prev) => prev.filter((c) => c.id !== id));
      toast({ title: "Category removed", variant: "warning" });
    }
  }

  async function handleExportImage(
    periodLabel: string,
    title: string,
    subtitle: string | undefined,
    exps: Expense[]
  ) {
    if (exps.length === 0) {
      toast({ title: "Nothing to export here yet", variant: "warning" });
      return;
    }
    const total = exps.reduce((s, e) => s + e.amount, 0);
    try {
      await exportExpenseImage(
        {
          periodLabel,
          title,
          subtitle,
          total: fmt(total),
          entries: exps.length,
          categories: buildImageCategories(exps, colorMap),
          accent: getAccentHex(),
          footerNote: `Exported ${todayISO()}`,
        },
        `kayv-expenses-${periodLabel.toLowerCase()}-${title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.png`
      );
      toast({ title: "Image ready 🎁", variant: "success" });
    } catch {
      toast({ title: "Couldn't export image", variant: "danger" });
    }
  }

  // ── Derived data ──
  const dailyExpenses = useMemo(
    () => expenses.filter((e) => e.date === selectedDate),
    [expenses, selectedDate]
  );

  const monthlyExpenses = useMemo(() => {
    const prefix = `${selectedMonthYear}-${String(selectedMonth + 1).padStart(2, "0")}`;
    return expenses.filter((e) => e.date.startsWith(prefix));
  }, [expenses, selectedMonth, selectedMonthYear]);

  const monthlyTotals = useMemo(() => {
    const sums = Array.from({ length: 12 }, (_, i) => {
      const prefix = `${selectedYear}-${String(i + 1).padStart(2, "0")}`;
      return expenses.filter((e) => e.date.startsWith(prefix)).reduce((s, e) => s + e.amount, 0);
    });
    const maxMonth = Math.max(...sums, 1);
    return sums.map((sum, i) => ({
      month: MONTHS[i].slice(0, 3),
      sum,
      pct: Math.round((sum / maxMonth) * 100),
    }));
  }, [expenses, selectedYear]);

  const dailyTotal = dailyExpenses.reduce((s, e) => s + e.amount, 0);
  const monthlyTotal = monthlyExpenses.reduce((s, e) => s + e.amount, 0);
  const yearlyTotal = expenses.reduce((s, e) => s + e.amount, 0);
  const yearList = Array.from({ length: 5 }, (_, i) => today.getFullYear() - 2 + i);

  return (
    <PageContainer>
      <PageHeader
        breadcrumb={[{ label: "Today", href: "/dashboard" }, { label: "Expenses" }]}
        title="Expenses"
        subtitle="Track your daily, monthly, and yearly spending."
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={() => setShowManageCategories(true)}>
              ⚙ Categories
            </Button>
            <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>
              + Add Expense
            </Button>
          </>
        }
      />

      <div className="relative">
        <Tabs value={activeTab} onChange={setActiveTab}>
          <TabList>
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
                expenses={dailyExpenses}
                total={dailyTotal}
                colorMap={colorMap}
                onDelete={handleDelete}
                onExport={() => {
                  const d = new Date(selectedDate + "T00:00:00");
                  handleExportImage(
                    "Daily",
                    d.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" }),
                    d.toLocaleDateString(undefined, { weekday: "long" }),
                    dailyExpenses
                  );
                }}
              />
            </TabPanel>

            <TabPanel value="monthly">
              <MonthlyTab
                selectedMonth={selectedMonth}
                onMonthChange={setSelectedMonth}
                selectedMonthYear={selectedMonthYear}
                onMonthYearChange={setSelectedMonthYear}
                yearList={yearList}
                expenses={monthlyExpenses}
                total={monthlyTotal}
                colorMap={colorMap}
                onDelete={handleDelete}
                onExport={() =>
                  handleExportImage(
                    "Monthly",
                    `${MONTHS[selectedMonth]} ${selectedMonthYear}`,
                    undefined,
                    monthlyExpenses
                  )
                }
              />
            </TabPanel>

            <TabPanel value="yearly">
              <YearlyTab
                selectedYear={selectedYear}
                onYearChange={setSelectedYear}
                yearList={yearList}
                expenses={expenses}
                total={yearlyTotal}
                monthlyTotals={monthlyTotals}
                colorMap={colorMap}
                onExport={() => handleExportImage("Yearly", String(selectedYear), undefined, expenses)}
              />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </div>

      <AddExpenseModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        categories={allCategories}
        onSubmit={handleCreateExpense}
      />

      <ManageCategoriesModal
        open={showManageCategories}
        onClose={() => setShowManageCategories(false)}
        defaultCategories={DEFAULT_CATEGORIES}
        customCategories={customCategories}
        onAddCategory={handleAddCategory}
        onDeleteCategory={handleDeleteCategory}
      />
    </PageContainer>
  );
}
