import type { Expense } from "@/lib/types";

// Domain helpers and constants for the Expenses feature. Pure functions live
// here so the page and its sub-components share one implementation.

export const DEFAULT_CATEGORIES: { name: string; color: string }[] = [
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

/** Formats an amount as the app's currency, e.g. `K 1,200`. */
export function fmt(amount: number): string {
  return `K ${Math.round(amount).toLocaleString("en-US")}`;
}

export type CategorySlice = { category: string; amount: number; pct: number };

/** Groups expenses by category, sorted by spend descending, with percentages. */
export function getCategoryBreakdown(exps: Expense[]): CategorySlice[] {
  const total = exps.reduce((sum, e) => sum + e.amount, 0);
  const byCategory: Record<string, number> = {};
  for (const e of exps) {
    byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
  }
  return Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .map(([category, amount]) => ({
      category,
      amount,
      pct: total > 0 ? Math.round((amount / total) * 100) : 0,
    }));
}

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
  exps: Expense[],
  colorMap: Record<string, string>
): ExportCategory[] {
  return getCategoryBreakdown(exps).map(({ category, amount, pct }) => ({
    category,
    amount: fmt(amount),
    pct,
    color: colorMap[category] ?? FALLBACK_CATEGORY_COLOR,
  }));
}
