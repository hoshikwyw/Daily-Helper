"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  Badge,
  Button,
  Input,
  Select,
  Alert,
  Calendar,
  toast,
} from "@kwyw/kayv-glass-ui";
import {
  deleteJournalEntry,
  getJournalEntry,
  listRecentJournalEntries,
  saveJournalEntry,
} from "@/lib/api/journal";
import { toISODate } from "@/lib/date";
import { MOOD_OPTIONS, MOOD_VARIANTS } from "@/lib/constants";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import type { JournalEntry, Mood } from "@/lib/types";

const MOOD_SELECT_OPTIONS = [{ value: "", label: "Select mood…" }, ...MOOD_OPTIONS];

export default function JournalPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [content, setContent] = useState("");
  const [mood, setMood] = useState<string>("");
  const [highlight, setHighlight] = useState("");
  const [highlights, setHighlights] = useState<string[]>([]);
  const [recentEntries, setRecentEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function loadEntry(date: Date) {
    setLoading(true);
    const found = await getJournalEntry(toISODate(date));
    if (found) {
      setEntry(found);
      setContent(found.content);
      setMood(found.mood ?? "");
      setHighlights(found.highlights ?? []);
    } else {
      setEntry(null);
      setContent("");
      setMood("");
      setHighlights([]);
    }
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

  function handleDateChange(date: Date | null) {
    if (!date) return;
    setSelectedDate(date);
    loadEntry(date);
  }

  function addHighlight() {
    if (!highlight.trim()) return;
    setHighlights((prev) => [...prev, highlight.trim()]);
    setHighlight("");
  }

  function removeHighlight(idx: number) {
    setHighlights((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSave() {
    setSaving(true);
    const payload = {
      date: toISODate(selectedDate),
      content,
      mood: (mood || null) as Mood | null,
      highlights,
    };

    const saved = await saveJournalEntry(entry?.id ?? null, payload);
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
    setContent("");
    setMood("");
    setHighlights([]);
    toast({ title: "Entry deleted", variant: "warning" });
    loadRecent();
  }

  const isToday = toISODate(selectedDate) === toISODate(new Date());

  return (
    <PageContainer squares={[[1, 2], [4, 1], [7, 3]]}>
      <PageHeader
        breadcrumb={[{ label: "Today", href: "/dashboard" }, { label: "Journal" }]}
        title="Daily Journal"
        subtitle="Capture your thoughts, mood, and wins."
      />

      <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar + recent */}
        <div className="space-y-4">
          <Card variant="elevated">
            <CardHeader title="Pick a date" />
            <CardContent>
              <Calendar
                mode="single"
                value={selectedDate}
                onChange={handleDateChange}
              />
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardHeader title="Recent entries" />
            <CardContent>
              {recentEntries.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-4">No entries yet.</p>
              ) : (
                <div className="space-y-2">
                  {recentEntries.map((e) => (
                    <button
                      key={e.id}
                      onClick={() => {
                        const d = new Date(e.date + "T00:00:00");
                        setSelectedDate(d);
                        loadEntry(d);
                      }}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 transition-colors text-left"
                    >
                      <span className="text-slate-300 text-sm font-medium w-20 shrink-0">{e.date}</span>
                      {e.mood && (
                        <Badge variant={MOOD_VARIANTS[e.mood]} size="sm">{e.mood}</Badge>
                      )}
                      <span className="text-slate-500 text-xs truncate flex-1">{e.content.slice(0, 30) || "…"}</span>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Editor */}
        <Card variant="elevated" className="lg:col-span-2">
          <CardHeader
            title={
              isToday
                ? "Today — " + new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
                : selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })
            }
            description={entry ? "Editing existing entry" : "New entry"}
          />
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-8" />
                <Skeleton className="h-48" />
              </div>
            ) : (
              <div className="space-y-5">
                {isToday && !entry?.content && (
                  <Alert variant="info" title="Start writing">
                    What did you work on? What went well? What did you learn?
                  </Alert>
                )}

                <Select
                  label="Mood"
                  value={mood}
                  onChange={setMood}
                  options={MOOD_SELECT_OPTIONS}
                />

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Journal entry</label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write your thoughts..."
                    rows={10}
                    className="w-full rounded-lg bg-white/5 border border-white/10 text-slate-200 placeholder-slate-600 text-sm p-3 resize-none focus:outline-none focus:border-kv-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Highlights</label>
                  <div className="flex gap-2 mb-3">
                    <Input
                      placeholder="Add a highlight..."
                      value={highlight}
                      onChange={(e) => setHighlight(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addHighlight(); } }}
                      className="flex-1"
                    />
                    <Button variant="ghost" size="sm" onClick={addHighlight} type="button">Add</Button>
                  </div>
                  {highlights.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {highlights.map((h, i) => (
                        <button
                          key={i}
                          onClick={() => removeHighlight(i)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-kv-500/20 text-kv-300 text-xs hover:bg-red-500/20 hover:text-red-300 transition-colors"
                        >
                          ✦ {h} <span className="ml-1 opacity-60">×</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button variant="primary" onClick={handleSave} disabled={saving || loading}>
              {saving ? "Saving…" : entry ? "Update Entry" : "Save Entry"}
            </Button>
            {entry && (
              <Button
                variant="ghost"
                onClick={handleDelete}
                disabled={deleting || loading}
                className="ml-auto text-red-400 hover:text-red-300"
              >
                {deleting ? "Deleting…" : "Delete"}
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </PageContainer>
  );
}
