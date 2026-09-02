import { MOOD_OPTIONS } from "@/lib/constants";
import type { JournalPayload } from "@/lib/api/journal";
import type { JournalEntry, Mood } from "@/lib/types";

// Domain helpers for the Journal feature: the editor draft, highlight list
// edits, and the mood picker's options.

/** Mood options preceded by a placeholder row for "no mood recorded". */
export function moodSelectOptions(placeholder: string) {
  return [{ value: "", label: placeholder }, ...MOOD_OPTIONS];
}

/** The editor's fields. `mood` is a plain string so "" can mean unset. */
export type JournalDraft = {
  content: string;
  mood: string;
  highlights: string[];
};

/** A fresh blank draft. A function, not a constant, so no caller shares state. */
export function emptyJournalDraft(): JournalDraft {
  return { content: "", mood: "", highlights: [] };
}

export function draftFromEntry(entry: JournalEntry | null): JournalDraft {
  if (!entry) return emptyJournalDraft();
  return {
    content: entry.content,
    mood: entry.mood ?? "",
    highlights: entry.highlights ?? [],
  };
}

export function draftToPayload(draft: JournalDraft, date: string): JournalPayload {
  return {
    date,
    content: draft.content,
    mood: (draft.mood || null) as Mood | null,
    highlights: draft.highlights,
  };
}

/** Appends a highlight, ignoring blanks. Returns a new array. */
export function addHighlight(highlights: string[], value: string): string[] {
  const trimmed = value.trim();
  return trimmed ? [...highlights, trimmed] : highlights;
}

export function removeHighlight(highlights: string[], index: number): string[] {
  return highlights.filter((_, i) => i !== index);
}

/** One-line teaser for the recent-entries list. */
export function entryPreview(entry: JournalEntry, max = 30): string {
  return entry.content.slice(0, max) || "…";
}
