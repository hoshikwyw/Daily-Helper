import { supabase } from "@/lib/supabase";
import { getUserId, isSchemaError, reportError, reportSchemaError } from "@/lib/db";
import type { Database, Habit, HabitCheck } from "@/lib/types";

// Data access for the `habits` and `habit_checks` tables. A check is a row
// for a day the habit was done; unchecking deletes it. Streaks are computed
// in lib/habits.ts from the dates.

export type HabitPatch = Partial<Omit<Database["public"]["Tables"]["habits"]["Insert"], "user_id">>;

/**
 * Every habit, archived ones included, in chip order. Quiet when the
 * migration has not been applied: the Today page reads this on every visit,
 * and the first attempt to add a habit names the migration instead.
 */
export async function listHabits(): Promise<Habit[]> {
  const { data, error } = await supabase.from("habits").select("*").order("position").order("name");
  if (error) {
    if (!isSchemaError(error)) reportError(error);
    return [];
  }
  return data ?? [];
}

/** Checks within an inclusive date range, for streaks and today's state. */
export async function listHabitChecks(from: string, to: string): Promise<HabitCheck[]> {
  const { data, error } = await supabase
    .from("habit_checks")
    .select("*")
    .gte("date", from)
    .lte("date", to);
  if (error) {
    if (!isSchemaError(error)) reportError(error);
    return [];
  }
  return data ?? [];
}

export async function createHabit(name: string, emoji: string, position: number): Promise<Habit | null> {
  const user_id = await getUserId();
  if (!user_id) return null;
  const { data, error } = await supabase
    .from("habits")
    .insert({ user_id, name, emoji, position })
    .select()
    .single();
  if (reportSchemaError(error)) return null;
  return data;
}

export async function updateHabit(id: string, patch: HabitPatch): Promise<Habit | null> {
  const { data, error } = await supabase
    .from("habits")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (reportError(error)) return null;
  return data;
}

/**
 * Marks a habit done or not done on a date. Done upserts a check: a repeat
 * write merges into the existing row and returns it, which is what lets
 * `.single()` succeed, so do not switch this to ignore duplicates. Not done
 * deletes the row. Returns the check row when marking done, null otherwise.
 */
export async function setHabitDone(
  habit_id: string,
  date: string,
  done: boolean
): Promise<{ ok: boolean; check: HabitCheck | null }> {
  if (!done) {
    const { error } = await supabase
      .from("habit_checks")
      .delete()
      .eq("habit_id", habit_id)
      .eq("date", date);
    return { ok: !reportError(error), check: null };
  }
  const user_id = await getUserId();
  if (!user_id) return { ok: false, check: null };
  const { data, error } = await supabase
    .from("habit_checks")
    .upsert({ user_id, habit_id, date }, { onConflict: "habit_id,date", ignoreDuplicates: false })
    .select()
    .single();
  if (reportSchemaError(error)) return { ok: false, check: null };
  return { ok: true, check: data };
}
