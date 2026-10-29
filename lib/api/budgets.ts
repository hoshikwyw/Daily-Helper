import { supabase } from "@/lib/supabase";
import { getUserId, isSchemaError, reportError, reportSchemaError } from "@/lib/db";
import { budgetMonth } from "@/lib/budgets";
import type { Budget } from "@/lib/types";

// Data access for the `budgets` table. Which limit applies to a given month
// is worked out in lib/budgets.ts from the full list; the table stays small
// because a row is only written when a limit changes.

/**
 * Every budget row, oldest first. Quiet when the migration has not been
 * applied: the Monthly tab reads this on every visit, and the first attempt
 * to set a budget names the migration instead.
 */
export async function listBudgets(): Promise<Budget[]> {
  const { data, error } = await supabase.from("budgets").select("*").order("month");
  if (error) {
    if (!isSchemaError(error)) reportError(error);
    return [];
  }
  return data ?? [];
}

/**
 * Sets a category's limit from the `YYYY-MM` month onwards, replacing any row
 * already dated that month. An amount of 0 switches the budget off. The row
 * key (`YYYY-MM-01`) is formed here so callers only ever deal in month prefixes.
 */
export async function setBudget(
  category: string,
  monthPrefix: string,
  amount: number
): Promise<Budget | null> {
  const user_id = await getUserId();
  if (!user_id) return null;
  const month = budgetMonth(monthPrefix);
  const { data, error } = await supabase
    .from("budgets")
    .upsert({ user_id, category, month, amount }, { onConflict: "user_id,category,month" })
    .select()
    .single();
  if (reportSchemaError(error)) return null;
  return data;
}
