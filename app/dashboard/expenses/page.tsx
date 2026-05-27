"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Card,
  CardHeader,
  CardContent,
  Badge,
  Button,
  Input,
  Select,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Progress,
  Breadcrumb,
  GridPattern,
  GradientBackground,
  toast,
} from "@kwyw/kayv-glass-ui";
import { supabase } from "@/lib/supabase";
import type { Expense, ExpenseCategory } from "@/lib/types";

const CATEGORIES: ExpenseCategory[] = [
  "Food & Drink",
  "Transport",
  "Shopping",
  "Entertainment",
  "Health",
  "Utilities",
  "Education",
  "Housing",
  "Other",
];

const CATEGORY_COLORS: Record<string, string> = {
  "Food & Drink": "#f97316",
  "Transport": "#06b6d4",
  "Shopping": "#8b5cf6",
  "Entertainment": "#ec4899",
  "Health": "#10b981",
  "Utilities": "#6366f1",
  "Education": "#f59e0b",
  "Housing": "#ef4444",
  "Other": "#64748b",
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function fmt(amount: number) {
  return `$${amount.toFixed(2)}`;
}

function toISO(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getCategoryBreakdown(exps: Expense[]) {
  const total = exps.reduce((sum, e) => sum + e.amount, 0);
  const byCategory: Record<string, number> = {};
  for (const e of exps) {
    byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
  }
  return Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, amt]) => ({
      category: cat,
      amount: amt,
      pct: total > 0 ? Math.round((amt / total) * 100) : 0,
    }));
}

function ExpenseRow({
  expense,
  onDelete,
}: {
  expense: Expense;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 group hover:bg-white/8 transition-colors">
      <span
        className="w-2.5 h-2.5 rounded-full shrink-0"
        style={{ backgroundColor: CATEGORY_COLORS[expense.category] ?? "#64748b" }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-200 truncate">
          {expense.description || expense.category}
        </p>
        <p className="text-xs text-slate-500">
          {expense.category} · {expense.date}
        </p>
      </div>
      <span className="text-sm font-semibold text-white shrink-0">{fmt(expense.amount)}</span>
      <button
        onClick={() => onDelete(expense.id)}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-red-400 text-lg leading-none shrink-0 px-1"
        aria-label="Delete"
      >
        ×
      </button>
    </div>
  );
}

export default function ExpensesPage() {
  const today = new Date();
  const [activeTab, setActiveTab] = useState("daily");

  // All expenses for current year (reload when year selection changes)
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchYear, setFetchYear] = useState(today.getFullYear());

  // Daily
  const [selectedDate, setSelectedDate] = useState(toISO(today));

  // Monthly
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedMonthYear, setSelectedMonthYear] = useState(today.getFullYear());

  // Yearly
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [newAmount, setNewAmount] = useState("");
  const [newCategory, setNewCategory] = useState<ExpenseCategory>("Food & Drink");
  const [newDesc, setNewDesc] = useState("");
  const [newDate, setNewDate] = useState(toISO(today));
  const [saving, setSaving] = useState(false);

  async function loadExpenses(year: number) {
    setLoading(true);
    const { data } = await supabase
      .from("expenses")
      .select("*")
      .gte("date", `${year}-01-01`)
      .lte("date", `${year}-12-31`)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });
    if (data) setExpenses(data as Expense[]);
    setLoading(false);
  }

  useEffect(() => {
    loadExpenses(fetchYear);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchYear]);

  // Sync fetchYear when monthly/yearly year selectors change
  useEffect(() => {
    if (activeTab === "monthly" && selectedMonthYear !== fetchYear) {
      setFetchYear(selectedMonthYear);
    }
    if (activeTab === "yearly" && selectedYear !== fetchYear) {
      setFetchYear(selectedYear);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, selectedMonthYear, selectedYear]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseFloat(newAmount);
    if (!newAmount || isNaN(amount) || amount <= 0) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("expenses")
      .insert({
        amount,
        category: newCategory,
        description: newDesc.trim() || null,
        date: newDate,
      })
      .select()
      .single();
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "danger" });
    } else {
      const expense = data as Expense;
      // Only prepend if it falls within the currently loaded year
      if (expense.date.startsWith(String(fetchYear))) {
        setExpenses((prev) => [expense, ...prev]);
      }
      setShowCreate(false);
      setNewAmount("");
      setNewDesc("");
      toast({ title: "Expense added", variant: "success" });
    }
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (!error) {
      setExpenses((prev) => prev.filter((e) => e.id !== id));
      toast({ title: "Expense deleted", variant: "warning" });
    }
  }

  const dailyExpenses = useMemo(
    () => expenses.filter((e) => e.date === selectedDate),
    [expenses, selectedDate]
  );

  const monthlyExpenses = useMemo(() => {
    const prefix = `${selectedMonthYear}-${String(selectedMonth + 1).padStart(2, "0")}`;
    return expenses.filter((e) => e.date.startsWith(prefix));
  }, [expenses, selectedMonth, selectedMonthYear]);

  const yearlyExpenses = expenses;

  const monthlyTotals = useMemo(() => {
    const maxMonth = Math.max(
      ...Array.from({ length: 12 }, (_, i) => {
        const prefix = `${selectedYear}-${String(i + 1).padStart(2, "0")}`;
        return expenses.filter((e) => e.date.startsWith(prefix)).reduce((s, e) => s + e.amount, 0);
      }),
      1
    );
    return Array.from({ length: 12 }, (_, i) => {
      const prefix = `${selectedYear}-${String(i + 1).padStart(2, "0")}`;
      const sum = expenses.filter((e) => e.date.startsWith(prefix)).reduce((s, e) => s + e.amount, 0);
      return { month: MONTHS[i].slice(0, 3), sum, pct: Math.round((sum / maxMonth) * 100) };
    });
  }, [expenses, selectedYear]);

  const dailyTotal = dailyExpenses.reduce((s, e) => s + e.amount, 0);
  const monthlyTotal = monthlyExpenses.reduce((s, e) => s + e.amount, 0);
  const yearlyTotal = yearlyExpenses.reduce((s, e) => s + e.amount, 0);

  const yearList = Array.from({ length: 5 }, (_, i) => today.getFullYear() - 2 + i);

  return (
    <div className="relative min-h-screen p-6 space-y-6">
      <GradientBackground fixed={false} />
      <GridPattern
        className="absolute inset-0 opacity-5 [mask-image:radial-gradient(ellipse_at_top,white_20%,transparent_70%)]"
        squares={[[2,1],[5,3],[8,2]]}
      />

      <div className="relative">
        <Breadcrumb items={[{ label: "Today", href: "/dashboard" }, { label: "Expenses" }]} />
      </div>

      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Expenses</h1>
          <p className="text-slate-400 text-sm mt-1">Track your daily, monthly, and yearly spending.</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>
          + Add Expense
        </Button>
      </div>

      <div className="relative">
        <Tabs value={activeTab} onChange={setActiveTab}>
          <TabList>
            <Tab value="daily">Daily</Tab>
            <Tab value="monthly">Monthly</Tab>
            <Tab value="yearly">Yearly</Tab>
          </TabList>

          <TabPanels>
            {/* ── Daily ── */}
            <TabPanel value="daily">
              <div className="space-y-4 mt-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                    />
                  </div>
                  <div className="flex-1 flex justify-end">
                    <div className="text-right">
                      <p className="text-slate-500 text-xs">Total</p>
                      <p className="text-2xl font-bold text-white">{fmt(dailyTotal)}</p>
                    </div>
                  </div>
                </div>

                {/* Category summary for day */}
                {dailyExpenses.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {getCategoryBreakdown(dailyExpenses).slice(0, 3).map(({ category, amount }) => (
                      <Card key={category} variant="elevated">
                        <CardContent>
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: CATEGORY_COLORS[category] ?? "#64748b" }}
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
                    description={`${dailyExpenses.length} expense${dailyExpenses.length !== 1 ? "s" : ""}`}
                  />
                  <CardContent>
                    {loading ? (
                      <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="h-12 rounded-lg bg-white/5 animate-pulse" />
                        ))}
                      </div>
                    ) : dailyExpenses.length === 0 ? (
                      <p className="text-slate-500 text-sm text-center py-10">
                        No expenses for {selectedDate}. Add one above!
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {dailyExpenses.map((expense) => (
                          <ExpenseRow key={expense.id} expense={expense} onDelete={handleDelete} />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabPanel>

            {/* ── Monthly ── */}
            <TabPanel value="monthly">
              <div className="space-y-4 mt-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Select
                    value={String(selectedMonth)}
                    onChange={(v) => setSelectedMonth(Number(v))}
                    options={MONTHS.map((m, i) => ({ value: String(i), label: m }))}
                  />
                  <Select
                    value={String(selectedMonthYear)}
                    onChange={(v) => setSelectedMonthYear(Number(v))}
                    options={yearList.map((y) => ({ value: String(y), label: String(y) }))}
                  />
                  <div className="ml-auto text-right">
                    <p className="text-slate-500 text-xs">Total</p>
                    <p className="text-2xl font-bold text-white">{fmt(monthlyTotal)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Card variant="elevated">
                    <CardHeader title="By Category" />
                    <CardContent>
                      {monthlyExpenses.length === 0 ? (
                        <p className="text-slate-500 text-sm text-center py-8">No expenses this month.</p>
                      ) : (
                        <div className="space-y-4">
                          {getCategoryBreakdown(monthlyExpenses).map(({ category, amount, pct }) => (
                            <div key={category} className="space-y-1.5">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-300 flex items-center gap-2">
                                  <span
                                    className="w-2 h-2 rounded-full shrink-0"
                                    style={{ backgroundColor: CATEGORY_COLORS[category] ?? "#64748b" }}
                                  />
                                  {category}
                                </span>
                                <span className="text-slate-400">
                                  {fmt(amount)}{" "}
                                  <span className="text-xs text-slate-600">({pct}%)</span>
                                </span>
                              </div>
                              <Progress value={pct} variant="primary" size="sm" />
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card variant="elevated">
                    <CardHeader
                      title="All Entries"
                      description={`${monthlyExpenses.length} expense${monthlyExpenses.length !== 1 ? "s" : ""}`}
                    />
                    <CardContent>
                      {monthlyExpenses.length === 0 ? (
                        <p className="text-slate-500 text-sm text-center py-8">No expenses this month.</p>
                      ) : (
                        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                          {monthlyExpenses.map((expense) => (
                            <ExpenseRow key={expense.id} expense={expense} onDelete={handleDelete} />
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabPanel>

            {/* ── Yearly ── */}
            <TabPanel value="yearly">
              <div className="space-y-4 mt-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Select
                    value={String(selectedYear)}
                    onChange={(v) => setSelectedYear(Number(v))}
                    options={yearList.map((y) => ({ value: String(y), label: String(y) }))}
                  />
                  <div className="ml-auto text-right">
                    <p className="text-slate-500 text-xs">Total {selectedYear}</p>
                    <p className="text-2xl font-bold text-white">{fmt(yearlyTotal)}</p>
                  </div>
                </div>

                {/* Quick stat cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Avg/month", value: fmt(yearlyTotal / 12) },
                    { label: "Avg/day", value: fmt(yearlyTotal / 365) },
                    { label: "Entries", value: String(yearlyExpenses.length) },
                    { label: "Categories", value: String(new Set(yearlyExpenses.map((e) => e.category)).size) },
                  ].map(({ label, value }) => (
                    <Card key={label} variant="elevated">
                      <CardContent>
                        <p className="text-slate-500 text-xs">{label}</p>
                        <p className="text-lg font-bold text-white mt-0.5">{value}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Card variant="elevated">
                    <CardHeader title="Monthly Breakdown" />
                    <CardContent>
                      <div className="space-y-2">
                        {monthlyTotals.map(({ month, sum, pct }) => (
                          <div key={month} className="flex items-center gap-3">
                            <span className="text-slate-500 text-xs w-8 shrink-0">{month}</span>
                            <div className="flex-1">
                              <Progress value={pct} variant={sum > 0 ? "primary" : "warning"} size="sm" />
                            </div>
                            <span className="text-slate-300 text-xs w-20 text-right shrink-0 font-medium">
                              {sum > 0 ? fmt(sum) : "—"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card variant="elevated">
                    <CardHeader title="By Category" />
                    <CardContent>
                      {yearlyExpenses.length === 0 ? (
                        <p className="text-slate-500 text-sm text-center py-8">No expenses this year.</p>
                      ) : (
                        <div className="space-y-3">
                          {getCategoryBreakdown(yearlyExpenses).map(({ category, amount, pct }) => (
                            <div key={category} className="flex items-center gap-3">
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: CATEGORY_COLORS[category] ?? "#64748b" }}
                              />
                              <span className="text-slate-300 text-sm flex-1">{category}</span>
                              <Badge variant="default" size="sm">{pct}%</Badge>
                              <span className="text-slate-400 text-sm font-medium">{fmt(amount)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </div>

      {/* Add Expense Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} size="sm">
        <ModalHeader>Add Expense</ModalHeader>
        <form onSubmit={handleCreate}>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Amount ($)"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                required
              />
              <Select
                label="Category"
                value={newCategory}
                onChange={(v) => setNewCategory(v as ExpenseCategory)}
                options={CATEGORIES.map((c) => ({ value: c, label: c }))}
              />
              <Input
                label="Description"
                placeholder="Coffee, groceries, taxi…"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
              />
              <Input
                label="Date"
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={() => setShowCreate(false)} type="button">
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={saving}>
              {saving ? "Adding…" : "Add Expense"}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
}
