import { describe, expect, it } from "vitest";
import {
  addHighlight,
  appendPrompt,
  draftFromEntry,
  draftToPayload,
  emptyJournalDraft,
  entryPreview,
  isJournalDirty,
  removeHighlight,
} from "@/lib/journal";
import type { JournalEntry } from "@/lib/types";

function saved(overrides: Partial<JournalEntry> = {}): JournalEntry {
  return {
    id: "e1",
    date: "2026-09-03",
    content: "hi",
    mood: "good",
    highlights: ["a", "b"],
    ...overrides,
  } as JournalEntry;
}

describe("appendPrompt", () => {
  it("starts an empty entry with the question", () => {
    expect(appendPrompt("", "What went well today?")).toBe("What went well today?\n");
  });

  it("keeps what is already written", () => {
    expect(appendPrompt("Shipped the login page.", "What did I learn?")).toBe(
      "Shipped the login page.\n\nWhat did I learn?\n"
    );
  });

  it("does not pile up blank lines when tapped repeatedly", () => {
    expect(appendPrompt("Line one.\n\n\n", "What did I learn?")).toBe(
      "Line one.\n\nWhat did I learn?\n"
    );
  });

  it("stacks two prompts with one blank line between", () => {
    expect(appendPrompt(appendPrompt("", "A?"), "B?")).toBe("A?\n\nB?\n");
  });
});

describe("isJournalDirty", () => {
  // Drives the Save button and the unsaved-changes hint. A false negative here
  // means silently losing what someone wrote when they pick another date.
  it("is clean for an untouched saved entry", () => {
    const entry = saved();
    expect(isJournalDirty(entry, draftFromEntry(entry))).toBe(false);
  });

  it("is clean for an untouched blank day", () => {
    expect(isJournalDirty(null, emptyJournalDraft())).toBe(false);
  });

  it("is clean when a saved row has no mood and none was picked", () => {
    const entry = saved({ mood: null, content: "", highlights: [] });
    expect(isJournalDirty(entry, emptyJournalDraft())).toBe(false);
  });

  it.each([
    ["typing", { content: "hi!" }],
    ["picking a mood", { mood: "great" }],
    ["clearing the mood", { mood: "" }],
    ["adding a win", { highlights: ["a", "b", "c"] }],
    ["removing a win", { highlights: ["a"] }],
    ["reordering wins", { highlights: ["b", "a"] }],
  ])("is dirty after %s", (_label, patch) => {
    const entry = saved();
    expect(isJournalDirty(entry, { ...draftFromEntry(entry), ...patch })).toBe(true);
  });

  it("compares wins by value, not by array identity", () => {
    const entry = saved();
    expect(isJournalDirty(entry, { ...draftFromEntry(entry), highlights: ["a", "b"] })).toBe(
      false
    );
  });

  it("is dirty once something is written on a blank day", () => {
    expect(isJournalDirty(null, { content: "x", mood: "", highlights: [] })).toBe(true);
  });
});

describe("draft conversion", () => {
  it("hands back a fresh object each time, so drafts never share state", () => {
    const first = emptyJournalDraft();
    first.highlights.push("leaked");
    expect(emptyJournalDraft().highlights).toEqual([]);
  });

  it("turns an unset mood into null for the database", () => {
    const payload = draftToPayload({ content: "x", mood: "", highlights: [] }, "2026-09-03");
    expect(payload).toEqual({
      date: "2026-09-03",
      content: "x",
      mood: null,
      highlights: [],
    });
  });

  it("tolerates a row with null highlights", () => {
    expect(draftFromEntry(saved({ highlights: null as unknown as string[] })).highlights).toEqual(
      []
    );
  });
});

describe("highlights", () => {
  it("ignores a blank entry", () => {
    const list = ["a"];
    expect(addHighlight(list, "   ")).toBe(list);
  });

  it("trims what it adds", () => {
    expect(addHighlight([], "  won  ")).toEqual(["won"]);
  });

  it("removes by index", () => {
    expect(removeHighlight(["a", "b", "c"], 1)).toEqual(["a", "c"]);
  });
});

describe("entryPreview", () => {
  it("shortens a long entry", () => {
    expect(entryPreview(saved({ content: "x".repeat(50) }), 10)).toBe("x".repeat(10));
  });

  it("shows a placeholder for an entry with no text", () => {
    expect(entryPreview(saved({ content: "" }))).toBe("…");
  });
});
