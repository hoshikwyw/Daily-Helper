"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "@kwyw/kayv-glass-ui";
import {
  deleteJournalEntry,
  getJournalEntry,
  listRecentJournalEntries,
  saveJournalEntry,
} from "@/lib/api/journal";
import {
  draftFromEntry,
  draftToPayload,
  emptyJournalDraft,
  isJournalDirty,
  type JournalDraft,
} from "@/lib/journal";
import { fromISODate, toISODate, todayISO } from "@/lib/date";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { PageLoader } from "@/components/ui/page-loader";
import { JournalSidebar } from "./_components/journal-sidebar";
import { JournalEditorCard } from "./_components/journal-editor-card";
import type { JournalEntry } from "@/lib/types";

/**
 * The day to open: a valid `?date=YYYY-MM-DD` link (from the weekly review),
 * otherwise today. Validated by round trip so "2026-13-45" cannot become an
 * Invalid Date that reaches the query or the editor.
 */
function startDate(linked: string | null): Date {
  if (linked && toISODate(fromISODate(linked)) === linked) return fromISODate(linked);
  return new Date();
}

function JournalEditor() {
  const linked = useSearchParams().get("date");
  const [selectedDate, setSelectedDate] = useState<Date>(() => startDate(linked));
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  // The editor's fields travel together, so one draft rather than three hooks.
  const [draft, setDraft] = useState<JournalDraft>(emptyJournalDraft);
  const [recentEntries, setRecentEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function loadEntry(date: Date) {
    setLoading(true);
    const found = await getJournalEntry(toISODate(date));
    setEntry(found);
    setDraft(draftFromEntry(found));
    setLoading(false);
  }

  async function loadRecent() {
    setRecentEntries(await listRecentJournalEntries());
  }

  // Runs on mount and again when the link changes, including a soft
  // navigation back to the plain Journal entry, which returns to today.
  useEffect(() => {
    const start = startDate(linked);
    /* eslint-disable react-hooks/set-state-in-effect -- seed from the URL, then fetch */
    setSelectedDate(start);
    loadEntry(start);
    /* eslint-enable react-hooks/set-state-in-effect */
    loadRecent();
  }, [linked]);

  function handleDateChange(date: Date) {
    setSelectedDate(date);
    loadEntry(date);
  }

  function patchDraft(patch: Partial<JournalDraft>) {
    setDraft((prev) => ({ ...prev, ...patch }));
  }

  async function handleSave() {
    setSaving(true);
    const saved = await saveJournalEntry(
      entry?.id ?? null,
      draftToPayload(draft, toISODate(selectedDate))
    );
    setSaving(false);
    if (!saved) return;
    setEntry(saved);
    toast({ title: "Journal saved", variant: "success" });
    loadRecent();
  }

  async function handleDelete() {
    if (!entry) return;
    setDeleting(true);
    const ok = await deleteJournalEntry(entry.id);
    setDeleting(false);
    if (!ok) return;
    // Reset the editor back to a fresh entry for the same date.
    setEntry(null);
    setDraft(emptyJournalDraft());
    toast({ title: "Entry deleted", variant: "warning" });
    loadRecent();
  }

  return (
    <PageContainer>
      <PageHeader
        breadcrumb={[{ label: "Today", href: "/dashboard" }, { label: "Journal" }]}
        title="Daily Journal"
        subtitle="Tap a mood, write a line or two. That's it."
      />

      <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* The editor leads on mobile — opening the journal should show a
            place to write, not a date picker. */}
        <JournalSidebar
          selectedDate={selectedDate}
          onDateChange={handleDateChange}
          recentEntries={recentEntries}
          className="order-2 lg:order-1"
        />

        <JournalEditorCard
          className="order-1 lg:order-2"
          selectedDate={selectedDate}
          isToday={toISODate(selectedDate) === todayISO()}
          entry={entry}
          draft={draft}
          onChange={patchDraft}
          dirty={isJournalDirty(entry, draft)}
          loading={loading}
          saving={saving}
          deleting={deleting}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      </div>
    </PageContainer>
  );
}

// useSearchParams needs a Suspense boundary in the static export, the same
// way the project detail page reads its `?id=`.
export default function JournalPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <JournalEditor />
    </Suspense>
  );
}
