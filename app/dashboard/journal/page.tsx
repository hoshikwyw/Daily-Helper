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
  Breadcrumb,
  GridPattern,
  GradientBackground,
  toast,
} from "@kwyw/kayv-glass-ui";
import { createClient } from "@/lib/supabase";

const supabase = createClient();
import type { JournalEntry, Mood } from "@/lib/types";

const MOOD_OPTIONS = [
  { value: "", label: "Select mood…" },
  { value: "great", label: "😄 Great" },
  { value: "good", label: "🙂 Good" },
  { value: "okay", label: "😐 Okay" },
  { value: "bad", label: "😕 Bad" },
  { value: "terrible", label: "😞 Terrible" },
];

const MOOD_VARIANTS: Record<Mood, "success" | "primary" | "warning" | "danger" | "default"> = {
  great: "success",
  good: "primary",
  okay: "warning",
  bad: "danger",
  terrible: "danger",
};

function toISO(date: Date) {
  return date.toISOString().slice(0, 10);
}

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

  async function loadEntry(date: Date) {
    setLoading(true);
    const iso = toISO(date);
    const { data } = await supabase
      .from("journal_entries")
      .select("*")
      .eq("date", iso)
      .maybeSingle();
    const entry = data as JournalEntry | null;
    if (entry) {
      setEntry(entry);
      setContent(entry.content);
      setMood(entry.mood ?? "");
      setHighlights(entry.highlights ?? []);
    } else {
      setEntry(null);
      setContent("");
      setMood("");
      setHighlights([]);
    }
    setLoading(false);
  }

  async function loadRecent() {
    const { data } = await supabase
      .from("journal_entries")
      .select("*")
      .order("date", { ascending: false })
      .limit(7);
    if (data) setRecentEntries(data as JournalEntry[]);
  }

  useEffect(() => {
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
    const iso = toISO(selectedDate);
    const payload = {
      date: iso,
      content,
      mood: (mood || null) as Mood | null,
      highlights,
    };

    let error;
    let data: JournalEntry | null = null;
    if (entry) {
      const res = await supabase
        .from("journal_entries")
        .update(payload)
        .eq("id", entry.id)
        .select()
        .single();
      error = res.error;
      data = res.data as JournalEntry | null;
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setSaving(false); return; }
      const res = await supabase
        .from("journal_entries")
        .insert({ ...payload, user_id: user.id })
        .select()
        .single();
      error = res.error;
      data = res.data as JournalEntry | null;
    }

    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "danger" });
    } else {
      if (data) setEntry(data);
      toast({ title: "Journal saved", variant: "success" });
      loadRecent();
    }
  }

  const isToday = toISO(selectedDate) === toISO(new Date());

  return (
    <div className="relative min-h-screen p-4 sm:p-6 space-y-6">
      <GradientBackground fixed={false} />
      <GridPattern
        className="absolute inset-0 opacity-5 [mask-image:radial-gradient(ellipse_at_top,white_20%,transparent_70%)]"
        squares={[[1,2],[4,1],[7,3]]}
      />

      <div className="relative">
        <Breadcrumb items={[{ label: "Today", href: "/dashboard" }, { label: "Journal" }]} />
      </div>

      <div className="relative">
        <h1 className="text-2xl font-bold text-white">Daily Journal</h1>
        <p className="text-slate-400 text-sm mt-1">Capture your thoughts, mood, and wins.</p>
      </div>

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
                <div className="h-8 rounded bg-white/5 animate-pulse" />
                <div className="h-48 rounded bg-white/5 animate-pulse" />
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
                  options={MOOD_OPTIONS}
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
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
