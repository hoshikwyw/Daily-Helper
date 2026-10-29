import type { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { getUserId, reportError, reportSchemaError } from "@/lib/db";
import { normalizeKind } from "@/lib/expenses";
import type { CustomCategory, EntryKind, Expense } from "@/lib/types";

// Data access for the `expenses` and `expense_categories` tables. A row in
// `expenses` is money out or money in depending on its `kind`. Pure
// formatting/grouping helpers for the same feature live in `lib/expenses.ts`.

// A write fails with a 400 until the migrations have been applied. The shared
// helper recognises the "column or table missing" codes. 23514 is added here
// because the pre-001 `expenses_category_check` only allowed the nine built-in
// names: a custom or income category bouncing off a CHECK means the income
// migration is missing, not that the row is bad.
const OLD_CONSTRAINT_CODES = ["23514"];

function reportWriteError(error: PostgrestError | null): boolean {
  return reportSchemaError(error, OLD_CONSTRAINT_CODES);
}

/**
 * Rows saved before the income migration have no `kind`. Defaulting them to
 * "expense" here means one boundary handles it and nothing downstream has to
 * cope with a missing ledger side.
 */
function normalizeEntry(row: Expense): Expense {
  return { ...row, kind: normalizeKind(row.kind) };
}

export type NewExpense = {
  kind: EntryKind;
  amount: number;
  category: string;
  description?: string | null;
  date: string;
};

/**
 * Every entry in one calendar year. The page fetches a whole year at a time so
 * the daily, monthly, and yearly tabs can all derive from a single result.
 */
export async function listExpensesForYear(year: number): Promise<Expense[]> {
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .gte("date", `${year}-01-01`)
    .lte("date", `${year}-12-31`)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });
  if (reportError(error)) return [];
  return (data ?? []).map(normalizeEntry);
}

/** Entries within an inclusive date range — used by the Today page summary. */
export async function listExpensesInRange(from: string, to: string): Promise<Expense[]> {
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .gte("date", from)
    .lte("date", to)
    .order("date", { ascending: false });
  if (reportError(error)) return [];
  return (data ?? []).map(normalizeEntry);
}

export async function createExpense(input: NewExpense): Promise<Expense | null> {
  const user_id = await getUserId();
  if (!user_id) return null;
  const { data, error } = await supabase
    .from("expenses")
    .insert({ ...input, user_id })
    .select()
    .single();
  if (reportWriteError(error)) return null;
  return data ? normalizeEntry(data) : null;
}

export async function deleteExpense(id: string): Promise<boolean> {
  const { error } = await supabase.from("expenses").delete().eq("id", id);
  return !reportError(error);
}

/** The user's own categories, both ledgers, in the order they were created. */
export async function listExpenseCategories(): Promise<CustomCategory[]> {
  const { data, error } = await supabase
    .from("expense_categories")
    .select("*")
    .order("created_at");
  if (reportError(error)) return [];
  return (data ?? []).map((row) => ({ ...row, kind: normalizeKind(row.kind) }));
}

export async function createExpenseCategory(
  kind: EntryKind,
  name: string,
  color: string
): Promise<CustomCategory | null> {
  const user_id = await getUserId();
  if (!user_id) return null;
  const { data, error } = await supabase
    .from("expense_categories")
    .insert({ kind, name, color, user_id })
    .select()
    .single();
  if (reportWriteError(error)) return null;
  return data ? { ...data, kind: normalizeKind(data.kind) } : null;
}

export async function deleteExpenseCategory(id: string): Promise<boolean> {
  const { error } = await supabase.from("expense_categories").delete().eq("id", id);
  return !reportError(error);
}
