"use client";

import { useEffect, useState } from "react";
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
import { toISODate, todayISO } from "@/lib/date";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { JournalSidebar } from "./_components/journal-sidebar";
import { JournalEditorCard } from "./_components/journal-editor-card";
import type { JournalEntry } from "@/lib/types";

export default function JournalPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadEntry(selectedDate);
    loadRecent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
