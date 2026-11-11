import { supabase } from "@/lib/supabase";
import { getUserId, isSchemaError, reportError, reportSchemaError } from "@/lib/db";
import { isSavingsEntry } from "@/lib/game";
import type { SavingsEntry } from "@/lib/savings-goals";
import type { SavingsGoal } from "@/lib/types";

// Data access for savings goals. Contributions are ordinary rows in
// `expenses`; this module reads them, but every write to an entry goes
// through lib/api/expenses.ts as before.

export type NewGoal = {
  name: string;
  emoji: string;
  target: number;
  deadline: string | null;
};

export type GoalsResult =
  | { ok: true; goals: SavingsGoal[] }
  | { ok: false; reason: "schema" | "error" };

/**
 * Every goal, oldest first. "schema" means migration 010 is not applied yet.
 * Quiet on failure: this is re-read after every ledger write, and the Savings
 * tab shows the problem in place rather than toasting it on each entry.
 */
export async function listGoals(): Promise<GoalsResult> {
  const { data, error } = await supabase.from("savings_goals").select("*").order("created_at");
  if (error) return { ok: false, reason: isSchemaError(error) ? "schema" : "error" };
  return { ok: true, goals: data ?? [] };
}

/**
 * Every Savings expense entry, all years, with the goal it feeds. The list
 * is small (one row per time money was set aside), so progress is summed in
 * the app rather than by a view. The query casts wide (a null kind is an old
 * expense row; the category may carry spaces) and `isSavingsEntry` decides,
 * so this counts exactly what the XP trigger counted.
 */
export async function listSavingsEntries(): Promise<SavingsEntry[]> {
  const { data, error } = await supabase
    .from("expenses")
    .select("id, kind, amount, category, date, goal_id")
    .or("kind.eq.expense,kind.is.null")
    .ilike("category", "%savings%")
    .order("date", { ascending: false });
  if (error) {
    if (!isSchemaError(error)) reportError(error);
    return [];
  }
  return (data ?? []).filter(isSavingsEntry);
}

export async function createGoal(input: NewGoal): Promise<SavingsGoal | null> {
  const user_id = await getUserId();
  if (!user_id) return null;
  const { data, error } = await supabase
    .from("savings_goals")
    .insert({ ...input, user_id })
    .select()
    .single();
  if (reportSchemaError(error)) return null;
  return data;
}

export async function updateGoal(id: string, patch: Partial<NewGoal>): Promise<SavingsGoal | null> {
  const { data, error } = await supabase
    .from("savings_goals")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (reportSchemaError(error)) return null;
  return data;
}

/** Removes the goal; its entries stay in the ledger with no goal attached. */
export async function deleteGoal(id: string): Promise<boolean> {
  const { error } = await supabase.from("savings_goals").delete().eq("id", id);
  return !reportError(error);
}
