"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardContent,
  Progress,
  Badge,
  Alert,
  Button,
  ConfettiButton,
  GridPattern,
  GradientBackground,
  Input,
  Select,
  toast,
} from "@kwyw/kayv-glass-ui";
import { createClient } from "@/lib/supabase";

const supabase = createClient();
import type { Task, Project, JournalEntry, Mood } from "@/lib/types";

const MOOD_OPTIONS = [
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

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function TodayPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [journal, setJournal] = useState<JournalEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [quickTitle, setQuickTitle] = useState("");
  const [selectedMood, setSelectedMood] = useState<string>("");

  const today = todayISO();
  const todayLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  async function loadData() {
    const [tasksRes, projectsRes, journalRes] = await Promise.all([
      supabase
        .from("tasks")
        .select("*")
        .or(`due_date.eq.${today},status.eq.in_progress`)
        .order("created_at", { ascending: false }),
      supabase
        .from("projects")
        .select("*")
        .eq("status", "active")
        .order("updated_at", { ascending: false })
        .limit(4),
      supabase.from("journal_entries").select("*").eq("date", today).maybeSingle(),
    ]);

    if (tasksRes.data) setTasks(tasksRes.data as Task[]);
    if (projectsRes.data) setProjects(projectsRes.data as Project[]);
    const journalData = journalRes.data as JournalEntry | null;
    if (journalData) {
      setJournal(journalData);
      setSelectedMood(journalData.mood ?? "");
    }
    setLoading(false);
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleQuickAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    const { data, error } = await supabase
      .from("tasks")
      .insert({ title: quickTitle.trim(), status: "todo", priority: "medium", due_date: today })
      .select()
      .single();
    if (error) {
      toast({ title: "Error", description: error.message, variant: "danger" });
    } else {
      setTasks((prev) => [data as Task, ...prev]);
      setQuickTitle("");
      toast({ title: "Task added", variant: "success" });
    }
  }

  async function handleToggleTask(task: Task) {
    const newStatus: Task["status"] = task.status === "done" ? "todo" : "done";
    const { error } = await supabase
      .from("tasks")
      .update({ status: newStatus, completed_at: newStatus === "done" ? new Date().toISOString() : null })
      .eq("id", task.id);
    if (!error) {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t)));
      if (newStatus === "done") toast({ title: "Task done!", variant: "success" });
    }
  }

  async function handleMoodSave(mood: string) {
    setSelectedMood(mood);
    if (journal) {
      await supabase.from("journal_entries").update({ mood: mood as Mood }).eq("id", journal.id);
      setJournal((j) => (j ? { ...j, mood: mood as Mood } : j));
    } else {
      const { data } = await supabase
        .from("journal_entries")
        .insert({ date: today, content: "", mood: mood as Mood, highlights: [] })
        .select()
        .single();
      if (data) setJournal(data as JournalEntry);
    }
    toast({ title: "Mood saved", variant: "success" });
  }

  const doneTasks = tasks.filter((t) => t.status === "done");
  const pendingTasks = tasks.filter((t) => t.status !== "done");
  const completionRate = tasks.length > 0 ? Math.round((doneTasks.length / tasks.length) * 100) : 0;

  return (
    <div className="relative min-h-screen p-6 space-y-6">
      <GradientBackground fixed={false} />
      <GridPattern
        className="absolute inset-0 opacity-5 [mask-image:radial-gradient(ellipse_at_top,white_20%,transparent_70%)]"
        squares={[[1,1],[3,2],[6,4],[9,1]]}
      />

      {/* Header */}
      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{getGreeting()}, Kayv ✦</h1>
          <p className="text-slate-400 text-sm mt-1">{todayLabel}</p>
        </div>
        {doneTasks.length > 0 && doneTasks.length === tasks.length && (
          <ConfettiButton
            preset="fireworks"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold bg-kv-500 text-white hover:bg-kv-600 transition-colors"
          >
            🎉 All done!
          </ConfettiButton>
        )}
      </div>

      {/* Summary cards */}
      <div className="relative grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card variant="elevated">
          <CardHeader title="Today's Tasks" />
          <CardContent>
            <div className="flex items-end justify-between mb-3">
              <span className="text-3xl font-bold text-white">{doneTasks.length}/{tasks.length}</span>
              <Badge variant={completionRate === 100 ? "success" : "primary"} size="sm">
                {completionRate}%
              </Badge>
            </div>
            <Progress value={completionRate} variant={completionRate === 100 ? "success" : "primary"} size="sm" />
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardHeader title="Active Projects" />
          <CardContent>
            <span className="text-3xl font-bold text-white">{loading ? "—" : projects.length}</span>
            <p className="text-slate-400 text-sm mt-1">in progress</p>
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardHeader title="Today's Mood" />
          <CardContent>
            {selectedMood ? (
              <div className="flex items-center gap-2">
                <span className="text-2xl">{MOOD_OPTIONS.find((m) => m.value === selectedMood)?.label.split(" ")[0]}</span>
                <Badge variant={MOOD_VARIANTS[selectedMood as Mood]} size="sm">
                  {selectedMood}
                </Badge>
              </div>
            ) : (
              <p className="text-slate-400 text-sm">Not set yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tasks */}
        <Card variant="elevated">
          <CardHeader title="Tasks" description="Due today or in progress" />
          <CardContent>
            <form onSubmit={handleQuickAdd} className="flex gap-2 mb-4">
              <Input
                placeholder="Quick add a task..."
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" size="sm" variant="primary">Add</Button>
            </form>

            {loading ? (
              <div className="space-y-3">
                {[1,2,3].map((i) => (
                  <div key={i} className="h-10 rounded-lg bg-white/5 animate-pulse" />
                ))}
              </div>
            ) : tasks.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-6">No tasks yet — add one above!</p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {pendingTasks.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => handleToggleTask(task)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-left group"
                  >
                    <span className="w-4 h-4 rounded border border-slate-500 group-hover:border-kv-400 transition-colors shrink-0" />
                    <span className="text-sm text-slate-200 flex-1">{task.title}</span>
                    <Badge
                      variant={task.priority === "urgent" ? "danger" : task.priority === "high" ? "warning" : "default"}
                      size="sm"
                    >
                      {task.priority}
                    </Badge>
                  </button>
                ))}
                {doneTasks.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => handleToggleTask(task)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-lg bg-white/3 hover:bg-white/5 transition-colors text-left opacity-60"
                  >
                    <span className="w-4 h-4 rounded border border-kv-500 bg-kv-500/30 shrink-0 flex items-center justify-center text-xs text-kv-300">✓</span>
                    <span className="text-sm text-slate-400 line-through flex-1">{task.title}</span>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mood + Journal snapshot */}
        <div className="space-y-4">
          <Card variant="elevated">
            <CardHeader title="How are you feeling today?" />
            <CardContent>
              <Select
                value={selectedMood}
                onChange={handleMoodSave}
                options={[{ value: "", label: "Select your mood…" }, ...MOOD_OPTIONS]}
              />
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardHeader
              title="Journal"
              description={journal?.content ? "Today's entry" : "No entry yet"}
            />
            <CardContent>
              {journal?.content ? (
                <p className="text-slate-300 text-sm line-clamp-4">{journal.content}</p>
              ) : (
                <Alert variant="info" title="Start your day's journal">
                  Write about what you worked on, how you felt, or what you learned.
                </Alert>
              )}
              <a href="/dashboard/journal" className="inline-block mt-3 text-kv-400 text-sm hover:text-kv-300 transition-colors">
                {journal?.content ? "Edit entry →" : "Open journal →"}
              </a>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Active projects */}
      {projects.length > 0 && (
        <Card variant="elevated" className="relative">
          <CardHeader title="Active Projects" description="Your current focus" />
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {projects.map((p) => (
                <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: p.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">{p.name}</p>
                    {p.tech_stack.length > 0 && (
                      <p className="text-xs text-slate-500 truncate">{p.tech_stack.slice(0, 3).join(" · ")}</p>
                    )}
                  </div>
                  <Badge variant="primary" size="sm">active</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
