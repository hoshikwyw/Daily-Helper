import type { JournalPayload } from "@/lib/api/journal";
import type { JournalEntry, Mood } from "@/lib/types";

// Domain helpers for the Journal feature: the editor draft and highlight edits.

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

/**
 * Starter questions offered above the writing box. A blank textarea is the
 * hardest part of journalling for a beginner; tapping one of these drops a
 * question in so there is something concrete to answer.
 */
export const WRITING_PROMPTS = [
  "What went well today?",
  "What did I learn?",
  "How am I feeling, and why?",
  "What do I want to do tomorrow?",
];

/** Adds a prompt as its own line, leaving a blank line underneath to answer on. */
export function appendPrompt(content: string, prompt: string): string {
  const body = content.trimEnd();
  return body ? `${body}

${prompt}
` : `${prompt}
`;
}

function sameList(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((value, i) => value === b[i]);
}

/**
 * True when the draft differs from what's saved — drives the Save button and
 * the unsaved-changes hint, so a beginner can't silently lose work by picking
 * another date.
 */
export function isJournalDirty(entry: JournalEntry | null, draft: JournalDraft): boolean {
  const saved = draftFromEntry(entry);
  return (
    draft.content !== saved.content ||
    draft.mood !== saved.mood ||
    !sameList(draft.highlights, saved.highlights)
  );
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
