import type { EntryKind, Expense } from "@/lib/types";

// Domain helpers and constants for the money tracker. Pure functions live here
// so the page and its sub-components share one implementation.

export const DEFAULT_EXPENSE_CATEGORIES: { name: string; color: string }[] = [
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

export const DEFAULT_INCOME_CATEGORIES: { name: string; color: string }[] = [
  { name: "Salary", color: "#22c55e" },
  { name: "Freelance", color: "#14b8a6" },
  { name: "Business", color: "#0ea5e9" },
  { name: "Investment", color: "#a855f7" },
  { name: "Gift", color: "#f43f5e" },
  { name: "Refund", color: "#84cc16" },
  { name: "Other", color: "#64748b" },
];

/** Built-in categories for each side of the ledger. */
export const DEFAULT_CATEGORIES: Record<EntryKind, { name: string; color: string }[]> = {
  expense: DEFAULT_EXPENSE_CATEGORIES,
  income: DEFAULT_INCOME_CATEGORIES,
};

export const ENTRY_KINDS: { value: EntryKind; label: string }[] = [
  { value: "expense", label: "Expense" },
  { value: "income", label: "Income" },
];

export const PRESET_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f97316",
  "#10b981", "#06b6d4", "#f59e0b", "#ef4444",
  "#64748b", "#14b8a6", "#f43f5e", "#84cc16",
  "#a855f7", "#0ea5e9", "#d946ef", "#22c55e",
];

export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const FALLBACK_CATEGORY_COLOR = "#64748b";

/** Money in is green, money out is rose — used consistently across the tabs. */
export const KIND_TEXT_COLORS: Record<EntryKind, string> = {
  income: "text-emerald-400",
  expense: "text-rose-400",
};

export const KIND_SIGNS: Record<EntryKind, string> = {
  income: "+",
  expense: "−",
};

/**
 * Coerces an unknown value to a valid ledger side, defaulting to "expense".
 *
 * Rows written before the income migration have no `kind` at all, and an
 * undefined kind used as a lookup key crashes the render. Normalising at the
 * boundary means old data reads as spending instead of taking the page down.
 */
export function normalizeKind(value: unknown): EntryKind {
  return value === "income" ? "income" : "expense";
}

// ── Formatting ──────────────────────────────────────────────────────────────

/** Formats an amount as the app's currency, e.g. `K 1,200`. */
export function fmt(amount: number): string {
  return `K ${Math.round(Math.abs(amount)).toLocaleString("en-US")}`;
}

/** Formats with an explicit sign, e.g. `+K 1,200` or `−K 500`. */
export function fmtSigned(amount: number): string {
  if (amount === 0) return fmt(0);
  return `${amount > 0 ? "+" : "−"}${fmt(amount)}`;
}

/** Formats an entry the way it should read in a list: `−K 500` for a spend. */
export function fmtEntry(entry: Expense): string {
  return `${KIND_SIGNS[normalizeKind(entry.kind)]}${fmt(entry.amount)}`;
}

// ── Totals ──────────────────────────────────────────────────────────────────

export type Totals = {
  income: number;
  expense: number;
  /** What's left over: income − expense. Negative means overspending. */
  net: number;
};

export const ZERO_TOTALS: Totals = { income: 0, expense: 0, net: 0 };

/** Sums a set of entries into income, expense, and what remains. */
export function getTotals(entries: Expense[]): Totals {
  let income = 0;
  let expense = 0;
  for (const entry of entries) {
    if (normalizeKind(entry.kind) === "income") income += entry.amount;
    else expense += entry.amount;
  }
  return { income, expense, net: income - expense };
}

export function filterByKind(entries: Expense[], kind: EntryKind): Expense[] {
  return entries.filter((e) => normalizeKind(e.kind) === kind);
}

/** Share of income kept rather than spent, 0-100. 0 when nothing came in. */
export function savingsRate(totals: Totals): number {
  if (totals.income <= 0) return 0;
  return Math.round((totals.net / totals.income) * 100);
}

// ── Category colors ─────────────────────────────────────────────────────────

/**
 * Category colors, keyed by kind then name. Nested because the two ledgers have
 * independent category lists and a name like "Other" exists in both.
 */
export type ColorMap = Record<EntryKind, Record<string, string>>;

/** Built-in categories plus the user's own, split per ledger. */
export function mergeCategories(
  custom: { kind: EntryKind; name: string; color: string }[]
): Record<EntryKind, { name: string; color: string }[]> {
  const forKind = (kind: EntryKind) => [
    ...DEFAULT_CATEGORIES[kind],
    ...custom
      .filter((c) => normalizeKind(c.kind) === kind)
      .map((c) => ({ name: c.name, color: c.color })),
  ];
  return { expense: forKind("expense"), income: forKind("income") };
}

export function buildColorMap(
  categories: Record<EntryKind, { name: string; color: string }[]>
): ColorMap {
  const map: ColorMap = { expense: {}, income: {} };
  for (const kind of ["expense", "income"] as EntryKind[]) {
    for (const c of categories[kind]) map[kind][c.name] = c.color;
  }
  return map;
}

export function categoryColor(map: ColorMap, kind: EntryKind, name: string): string {
  return map[normalizeKind(kind)]?.[name] ?? FALLBACK_CATEGORY_COLOR;
}

// ── Breakdowns ──────────────────────────────────────────────────────────────

export type CategorySlice = {
  category: string;
  /** Total across every entry in this category. */
  amount: number;
  /** Share of the period's total, 0-100. */
  pct: number;
  /** How many entries make up the total. */
  count: number;
  /** Mean value of one entry, rounded. */
  average: number;
  /** The single biggest entry — shows whether a total is one big item or many small ones. */
  largest: number;
};

/**
 * Per-category statistics, biggest total first.
 *
 * The count and average matter as much as the total: "K 100,000 on Food" reads
 * very differently as one restaurant bill versus thirty coffees.
 */
export function getCategoryBreakdown(entries: Expense[]): CategorySlice[] {
  const total = entries.reduce((sum, e) => sum + e.amount, 0);

  const byCategory = new Map<string, { amount: number; count: number; largest: number }>();
  for (const e of entries) {
    const acc = byCategory.get(e.category) ?? { amount: 0, count: 0, largest: 0 };
    acc.amount += e.amount;
    acc.count += 1;
    acc.largest = Math.max(acc.largest, e.amount);
    byCategory.set(e.category, acc);
  }

  return [...byCategory.entries()]
    .sort((a, b) => b[1].amount - a[1].amount)
    .map(([category, { amount, count, largest }]) => ({
      category,
      amount,
      count,
      largest,
      average: Math.round(amount / count),
      pct: total > 0 ? Math.round((amount / total) * 100) : 0,
    }));
}

export type CategoryStats = {
  /** How many distinct categories were used. */
  categories: number;
  entries: number;
  total: number;
  /** Mean value of one entry across all categories. */
  average: number;
  /** The category with the highest total, or null when there is nothing. */
  top: CategorySlice | null;
};

/** Headline figures for one side of the ledger over a period. */
export function getCategoryStats(entries: Expense[]): CategoryStats {
  const slices = getCategoryBreakdown(entries);
  const total = entries.reduce((sum, e) => sum + e.amount, 0);
  return {
    categories: slices.length,
    entries: entries.length,
    total,
    average: entries.length > 0 ? Math.round(total / entries.length) : 0,
    top: slices[0] ?? null,
  };
}

export type MonthTotals = Totals & {
  /** Short month name, e.g. "Jan". */
  month: string;
  /** Bar width 0-100, scaled against the year's largest absolute net. */
  pct: number;
};

/**
 * Per-month income, expense, and net for one year. Bars are scaled to the
 * biggest month by absolute net, so a heavy loss reads as prominently as a
 * heavy gain.
 */
export function getMonthlyTotals(entries: Expense[], year: number): MonthTotals[] {
  const perMonth = Array.from({ length: 12 }, (_, i) => {
    const prefix = `${year}-${String(i + 1).padStart(2, "0")}`;
    return getTotals(entries.filter((e) => e.date.startsWith(prefix)));
  });

  const peak = Math.max(...perMonth.map((t) => Math.abs(t.net)), 1);

  return perMonth.map((totals, i) => ({
    ...totals,
    month: MONTHS[i].slice(0, 3),
    pct: Math.round((Math.abs(totals.net) / peak) * 100),
  }));
}

// ── Image export ────────────────────────────────────────────────────────────

// Reads the active theme's accent (set on <html> by ThemeProvider) as a hex
// string so the exported image matches the user's chosen theme.
export function getAccentHex(): string {
  if (typeof document === "undefined") return "#8b5cf6";
  const v = getComputedStyle(document.documentElement).getPropertyValue("--kv-p-500").trim();
  const parts = v.split(/\s+/).map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return "#8b5cf6";
  return "#" + parts.map((n) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, "0")).join("");
}

export type ExportCategory = { category: string; amount: string; pct: number; color: string };

/** Builds the colored, pre-formatted category list the image exporter expects. */
export function buildImageCategories(
  entries: Expense[],
  colorMap: ColorMap,
  kind: EntryKind
): ExportCategory[] {
  return getCategoryBreakdown(filterByKind(entries, kind)).map(
    ({ category, amount, pct }) => ({
      category,
      amount: fmt(amount),
      pct,
      color: categoryColor(colorMap, kind, category),
    })
  );
}
