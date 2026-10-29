import { supabase } from "@/lib/supabase";
import { getUserId, isSchemaError, reportError, reportSchemaError } from "@/lib/db";
import { advanceNextDue, occurrenceOnOrAfter, occurrencesDue } from "@/lib/recurrence";
import type { Database, Recurrence, RecurrenceTarget } from "@/lib/types";

// Data access for the `recurrences` table, plus the sync that turns rules into
// real expense and task rows. The scheduling maths lives in lib/recurrence.ts.

export type NewRecurrence = Omit<Database["public"]["Tables"]["recurrences"]["Insert"], "user_id">;

/**
 * The user's rules, soonest next occurrence first; optionally one target only.
 * Quiet when the migration has not been applied: lists are read on the Today
 * page and in the rule modals, and a toast on every visit would be noise. The
 * first attempt to create a rule names the migration instead.
 */
export async function listRecurrences(target?: RecurrenceTarget): Promise<Recurrence[]> {
  let query = supabase.from("recurrences").select("*").order("next_due");
  if (target) query = query.eq("target", target);
  const { data, error } = await query;
  if (error) {
    if (!isSchemaError(error)) reportError(error);
    return [];
  }
  return data ?? [];
}

export async function createRecurrence(input: NewRecurrence): Promise<Recurrence | null> {
  const user_id = await getUserId();
  if (!user_id) return null;
  const { data, error } = await supabase
    .from("recurrences")
    .insert({ ...input, user_id })
    .select()
    .single();
  if (reportSchemaError(error)) return null;
  return data;
}

/** Changes apply to future occurrences only; rows already created are untouched. */
export async function updateRecurrence(
  id: string,
  patch: Partial<NewRecurrence>
): Promise<Recurrence | null> {
  const { data, error } = await supabase
    .from("recurrences")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (reportError(error)) return null;
  return data;
}

/** Pauses a rule. It creates nothing until resumed. */
export async function pauseRecurrence(id: string): Promise<boolean> {
  const { error } = await supabase.from("recurrences").update({ active: false }).eq("id", id);
  return !reportError(error);
}

/**
 * Resumes a rule from today onwards. `next_due` is moved to the first
 * occurrence on or after `today`: the whole point of pausing was to skip the
 * occurrences in between, so they must not be backfilled on resume. Returns
 * the updated rule, or null when it cannot resume because its end date has
 * passed (or the write failed).
 */
export async function resumeRecurrence(rule: Recurrence, today: string): Promise<Recurrence | null> {
  const next_due = occurrenceOnOrAfter(rule, today);
  if (next_due === null) return null;
  return updateRecurrence(rule.id, { active: true, next_due });
}

/** Deletes the rule. Rows it already created stay, with their link cleared. */
export async function deleteRecurrence(id: string): Promise<boolean> {
  const { error } = await supabase.from("recurrences").delete().eq("id", id);
  return !reportError(error);
}

/**
 * Creates every expense or task that has fallen due as of `today` and moves
 * each rule's `next_due` forward. Returns how many rows were actually created,
 * or null when the rules could not be read at all (offline, or the migration
 * is not applied yet) so the caller knows nothing was attempted.
 *
 * Safe to call repeatedly and from several devices: inserts go through the
 * unique (rule, date) index with duplicates ignored, so the worst case of two
 * concurrent runs is one of them creating nothing. A rule whose insert fails
 * keeps its `next_due`, so it is simply retried on the next run. Rules are
 * independent, so they are processed concurrently.
 *
 * Quiet when the migration has not been applied: that is a setup state, not
 * something to toast about on every app open.
 */
export async function materializeRecurrences(today: string): Promise<number | null> {
  const { data: rules, error } = await supabase
    .from("recurrences")
    .select("*")
    .eq("active", true)
    .lte("next_due", today);
  if (error) {
    if (!isSchemaError(error)) reportError(error);
    return null;
  }
  if (!rules || rules.length === 0) return 0;

  const user_id = await getUserId();
  if (!user_id) return null;

  const counts = await Promise.all(rules.map((rule) => materializeRule(rule, today, user_id)));
  return counts.reduce((sum, n) => sum + n, 0);
}

/** One rule's share of the sync; returns how many rows it created. */
async function materializeRule(rule: Recurrence, today: string, user_id: string): Promise<number> {
  const dates = occurrencesDue(rule, today);
  let created = 0;
  if (dates.length > 0) {
    const inserted =
      rule.target === "expense"
        ? await insertExpenses(rule, dates, user_id)
        : await insertTasks(rule, dates, user_id);
    if (inserted === null) return 0;
    created = inserted;
  }

  const next = advanceNextDue(rule, today);
  const { error } = await supabase
    .from("recurrences")
    // A rule past its end date switches itself off rather than sitting at a
    // stale next_due forever.
    .update(next ? { next_due: next } : { active: false })
    .eq("id", rule.id);
  reportError(error);
  return created;
}

/** Inserts one expense per date; returns how many were new, or null on failure. */
async function insertExpenses(rule: Recurrence, dates: string[], user_id: string) {
  const rows = dates.map((date) => ({
    user_id,
    kind: rule.kind ?? "expense",
    amount: rule.amount ?? 0,
    category: rule.category ?? "Other",
    description: rule.description,
    date,
    recurrence_id: rule.id,
  }));
  const { data, error } = await supabase
    .from("expenses")
    .upsert(rows, { onConflict: "recurrence_id,date", ignoreDuplicates: true })
    .select("id");
  if (reportError(error)) return null;
  return data?.length ?? 0;
}

/** Inserts one task per date; returns how many were new, or null on failure. */
async function insertTasks(rule: Recurrence, dates: string[], user_id: string) {
  const rows = dates.map((due_date) => ({
    user_id,
    title: rule.title ?? "Untitled",
    description: rule.description,
    priority: rule.priority ?? "medium",
    project_id: rule.project_id,
    due_date,
    recurrence_id: rule.id,
  }));
  const { data, error } = await supabase
    .from("tasks")
    .upsert(rows, { onConflict: "recurrence_id,due_date", ignoreDuplicates: true })
    .select("id");
  if (reportError(error)) return null;
  return data?.length ?? 0;
}
