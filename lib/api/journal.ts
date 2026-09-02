import { supabase } from "@/lib/supabase";
import { getUserId, reportError } from "@/lib/db";
import type { JournalEntry, Mood } from "@/lib/types";

// Data access for the `journal_entries` table. One row per calendar date.

export type JournalPayload = {
  date: string;
  content: string;
  mood: Mood | null;
  highlights: string[];
};

/**
 * The entry for one date, or null when nothing is written yet. Silent by
 * design — "no entry" is the normal state for most days, not an error.
 */
export async function getJournalEntry(date: string): Promise<JournalEntry | null> {
  const { data } = await supabase
    .from("journal_entries")
    .select("*")
    .eq("date", date)
    .maybeSingle();
  return data ?? null;
}

/** The latest entries for the sidebar list, newest date first. */
export async function listRecentJournalEntries(limit = 7): Promise<JournalEntry[]> {
  const { data, error } = await supabase
    .from("journal_entries")
    .select("*")
    .order("date", { ascending: false })
    .limit(limit);
  if (reportError(error)) return [];
  return data ?? [];
}

/**
 * Writes an entry: updates when `id` is given, inserts otherwise. Returns the
 * saved row so the caller can switch from "new" to "editing" state.
 */
export async function saveJournalEntry(
  id: string | null,
  payload: JournalPayload
): Promise<JournalEntry | null> {
  if (id) {
    const { data, error } = await supabase
      .from("journal_entries")
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    if (reportError(error)) return null;
    return data;
  }

  const user_id = await getUserId();
  if (!user_id) return null;
  const { data, error } = await supabase
    .from("journal_entries")
    .insert({ ...payload, user_id })
    .select()
    .single();
  if (reportError(error)) return null;
  return data;
}

/**
 * Sets just the mood for a date — the Today page's check-in. Creates an empty
 * entry when the day has none yet, so a mood can be logged before any writing.
 */
export async function setJournalMood(
  entry: JournalEntry | null,
  date: string,
  mood: Mood | null
): Promise<JournalEntry | null> {
  if (entry) {
    const { error } = await supabase
      .from("journal_entries")
      .update({ mood })
      .eq("id", entry.id);
    if (reportError(error)) return null;
    return { ...entry, mood };
  }
  return saveJournalEntry(null, { date, content: "", mood, highlights: [] });
}

export async function deleteJournalEntry(id: string): Promise<boolean> {
  const { error } = await supabase.from("journal_entries").delete().eq("id", id);
  return !reportError(error);
}
