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
import { createClient } from "@/lib/supabase";
import { downloadExpenseImage } from "@/lib/expenseImage";
import type { Expense, CustomCategory } from "@/lib/types";

const supabase = createClient();

// Reads the active theme's accent (set on <html> by ThemeProvider) as a hex
// string so the exported image matches the user's chosen theme.
function getAccentHex(): string {
  if (typeof document === "undefined") return "#8b5cf6";
  const v = getComputedStyle(document.documentElement).getPropertyValue("--kv-p-500").trim();
  const parts = v.split(/\s+/).map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return "#8b5cf6";
  return "#" + parts.map((n) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, "0")).join("");
}

const DEFAULT_CATEGORIES: { name: string; color: string }[] = [
  { name: "Food & Drink", color: "#f97316" },
  { name: "Transport", color: "#06b6d4" },
  { name: "Shopping", color: "#8b5cf6" },
  { name: "Entertainment", color: "#ec4899" },
  { name: "Health", color: "#10b981" },
  { name: "Utilities", color: "#6366f1" },
  { name: "Education", color: "#f59e0b" },
  { name: "Housing", color: "#ef4444" },
  { name: "Other", color: "#64748b" },
];

const PRESET_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f97316",
  "#10b981", "#06b6d4", "#f59e0b", "#ef4444",
  "#64748b", "#14b8a6", "#f43f5e", "#84cc16",
  "#a855f7", "#0ea5e9", "#d946ef", "#22c55e",
];

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function fmt(amount: number) {
  return `K ${Math.round(amount).toLocaleString("en-US")}`;
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
  colorMap,
  onDelete,
}: {
  expense: Expense;
  colorMap: Record<string, string>;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 group hover:bg-white/8 transition-colors">
      <span
        className="w-2.5 h-2.5 rounded-full shrink-0"
        style={{ backgroundColor: colorMap[expense.category] ?? "#64748b" }}
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

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchYear, setFetchYear] = useState(today.getFullYear());

  const [selectedDate, setSelectedDate] = useState(toISO(today));
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedMonthYear, setSelectedMonthYear] = useState(today.getFullYear());
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());

  // Custom categories from DB
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);

  // Add expense modal
  const [showCreate, setShowCreate] = useState(false);
  const [newAmount, setNewAmount] = useState("");
  const [newCategory, setNewCategory] = useState(DEFAULT_CATEGORIES[0].name);
  const [newDesc, setNewDesc] = useState("");
  const [newDate, setNewDate] = useState(toISO(today));
  const [saving, setSaving] = useState(false);

  // Manage categories modal
  const [showManageCategories, setShowManageCategories] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatColor, setNewCatColor] = useState(PRESET_COLORS[0]);
  const [savingCat, setSavingCat] = useState(false);

  // Merged category list and color map
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
    if (data) setExpenses(data as Expense[]);
    setLoading(false);
  }

  async function loadCategories() {
    const { data } = await supabase
      .from("expense_categories")
      .select("*")
      .order("created_at");
    if (data) setCustomCategories(data as CustomCategory[]);
  }

  useEffect(() => {
    loadExpenses(fetchYear);
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchYear]);

  useEffect(() => {
    if (activeTab === "monthly" && selectedMonthYear !== fetchYear) setFetchYear(selectedMonthYear);
    if (activeTab === "yearly" && selectedYear !== fetchYear) setFetchYear(selectedYear);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, selectedMonthYear, selectedYear]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseFloat(newAmount);
    if (!newAmount || isNaN(amount) || amount <= 0) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }
    const { data, error } = await supabase
      .from("expenses")
      .insert({
        amount,
        category: newCategory,
        description: newDesc.trim() || null,
        date: newDate,
        user_id: user.id,
      })
      .select()
      .single();
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "danger" });
    } else {
      const expense = data as Expense;
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

  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newCatName.trim()) return;
    if (allCategories.some((c) => c.name.toLowerCase() === newCatName.trim().toLowerCase())) {
      toast({ title: "Category already exists", variant: "danger" });
      return;
    }
    setSavingCat(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSavingCat(false); return; }
    const { data, error } = await supabase
      .from("expense_categories")
      .insert({ name: newCatName.trim(), color: newCatColor, user_id: user.id })
      .select()
      .single();
    setSavingCat(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "danger" });
    } else {
      setCustomCategories((prev) => [...prev, data as CustomCategory]);
      setNewCatName("");
      toast({ title: "Category added", variant: "success" });
    }
  }

  async function handleDeleteCategory(id: string) {
    const { error } = await supabase.from("expense_categories").delete().eq("id", id);
    if (!error) {
      setCustomCategories((prev) => prev.filter((c) => c.id !== id));
      toast({ title: "Category removed", variant: "warning" });
    }
  }

  // Build the colored category list the image exporter expects.
  function buildImageCategories(exps: Expense[]) {
    return getCategoryBreakdown(exps).map(({ category, amount, pct }) => ({
      category,
      amount: fmt(amount),
      pct,
      color: colorMap[category] ?? "#64748b",
    }));
  }

  function handleExportImage(
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
    downloadExpenseImage(
      {
        periodLabel,
        title,
        subtitle,
        total: fmt(total),
        entries: exps.length,
        categories: buildImageCategories(exps),
        accent: getAccentHex(),
        footerNote: `Exported ${toISO(new Date())}`,
      },
      `kayv-expenses-${periodLabel.toLowerCase()}-${title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.png`
    );
    toast({ title: "Image saved 🎁", variant: "success" });
  }

  const dailyExpenses = useMemo(
    () => expenses.filter((e) => e.date === selectedDate),
    [expenses, selectedDate]
  );

  const monthlyExpenses = useMemo(() => {
    const prefix = `${selectedMonthYear}-${String(selectedMonth + 1).padStart(2, "0")}`;
    return expenses.filter((e) => e.date.startsWith(prefix));
  }, [expenses, selectedMonth, selectedMonthYear]);

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
  const yearlyTotal = expenses.reduce((s, e) => s + e.amount, 0);
  const yearList = Array.from({ length: 5 }, (_, i) => today.getFullYear() - 2 + i);

  return (
    <div className="relative min-h-screen p-4 sm:p-6 space-y-6">
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
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setShowManageCategories(true)}>
            ⚙ Categories
          </Button>
          <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>
            + Add Expense
          </Button>
        </div>
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
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                  <div className="flex-1 flex items-center justify-end gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const d = new Date(selectedDate + "T00:00:00");
                        handleExportImage(
                          "Daily",
                          d.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" }),
                          d.toLocaleDateString(undefined, { weekday: "long" }),
                          dailyExpenses
                        );
                      }}
                    >
                      ⬇ Save image
                    </Button>
                    <div className="text-right">
                      <p className="text-slate-500 text-xs">Total</p>
                      <p className="text-2xl font-bold text-white">{fmt(dailyTotal)}</p>
                    </div>
                  </div>
                </div>

                {dailyExpenses.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {getCategoryBreakdown(dailyExpenses).slice(0, 3).map(({ category, amount }) => (
                      <Card key={category} variant="elevated">
                        <CardContent>
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: colorMap[category] ?? "#64748b" }}
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
                          <ExpenseRow key={expense.id} expense={expense} colorMap={colorMap} onDelete={handleDelete} />
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
                  <div className="ml-auto flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        handleExportImage(
                          "Monthly",
                          `${MONTHS[selectedMonth]} ${selectedMonthYear}`,
                          undefined,
                          monthlyExpenses
                        )
                      }
                    >
                      ⬇ Save image
                    </Button>
                    <div className="text-right">
                      <p className="text-slate-500 text-xs">Total</p>
                      <p className="text-2xl font-bold text-white">{fmt(monthlyTotal)}</p>
                    </div>
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
                                    style={{ backgroundColor: colorMap[category] ?? "#64748b" }}
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
                            <ExpenseRow key={expense.id} expense={expense} colorMap={colorMap} onDelete={handleDelete} />
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
                  <div className="ml-auto flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        handleExportImage("Yearly", String(selectedYear), undefined, expenses)
                      }
                    >
                      ⬇ Save image
                    </Button>
                    <div className="text-right">
                      <p className="text-slate-500 text-xs">Total {selectedYear}</p>
                      <p className="text-2xl font-bold text-white">{fmt(yearlyTotal)}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Avg/month", value: fmt(yearlyTotal / 12) },
                    { label: "Avg/day", value: fmt(yearlyTotal / 365) },
                    { label: "Entries", value: String(expenses.length) },
                    { label: "Categories", value: String(new Set(expenses.map((e) => e.category)).size) },
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
                            <span className="text-slate-300 text-xs w-24 text-right shrink-0 font-medium">
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
                      {expenses.length === 0 ? (
                        <p className="text-slate-500 text-sm text-center py-8">No expenses this year.</p>
                      ) : (
                        <div className="space-y-3">
                          {getCategoryBreakdown(expenses).map(({ category, amount, pct }) => (
                            <div key={category} className="flex items-center gap-3">
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: colorMap[category] ?? "#64748b" }}
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

      {/* ── Add Expense Modal ── */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} size="sm">
        <ModalHeader>Add Expense</ModalHeader>
        <form onSubmit={handleCreate}>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Amount (K)"
                type="number"
                step="1"
                min="1"
                placeholder="0"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                required
              />
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-white/10 border border-white/10 text-slate-200 text-sm focus:outline-none focus:border-white/30 transition-colors"
                >
                  {allCategories.map((c) => (
                    <option key={c.name} value={c.name} className="bg-[#0f172a] text-slate-200">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
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

      {/* ── Manage Categories Modal ── */}
      <Modal open={showManageCategories} onClose={() => setShowManageCategories(false)} size="sm">
        <ModalHeader>Manage Categories</ModalHeader>
        <ModalBody>
          <div className="space-y-5">
            {/* Add new category */}
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-3">Add New Category</p>
              <form onSubmit={handleAddCategory} className="space-y-3">
                <Input
                  label="Category name"
                  placeholder="e.g. Subscriptions"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  required
                />
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Color</label>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewCatColor(c)}
                        className={`w-6 h-6 rounded-full transition-transform ${
                          newCatColor === c ? "scale-125 ring-2 ring-white/60" : "hover:scale-110"
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
                <Button variant="primary" type="submit" size="sm" disabled={savingCat}>
                  {savingCat ? "Adding…" : "Add Category"}
                </Button>
              </form>
            </div>

            <div className="border-t border-white/10" />

            {/* Default categories (read-only) */}
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Default</p>
              <div className="space-y-1.5">
                {DEFAULT_CATEGORIES.map((c) => (
                  <div key={c.name} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg bg-white/5">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                    <span className="text-slate-300 text-sm flex-1">{c.name}</span>
                    <span className="text-slate-600 text-xs">built-in</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Custom categories */}
            {customCategories.length > 0 && (
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Custom</p>
                <div className="space-y-1.5">
                  {customCategories.map((c) => (
                    <div key={c.id} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg bg-white/5 group">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                      <span className="text-slate-300 text-sm flex-1">{c.name}</span>
                      <button
                        onClick={() => handleDeleteCategory(c.id)}
                        className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all text-base leading-none px-1"
                        aria-label="Delete category"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setShowManageCategories(false)}>
            Done
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
