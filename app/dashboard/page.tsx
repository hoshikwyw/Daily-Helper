"use client";

import { useEffect, useState } from "react";
import { ConfettiButton, toast } from "@kwyw/kayv-glass-ui";
import { createTask, listTasksDueOrActive, setTaskStatus } from "@/lib/api/tasks";
import { listActiveProjects } from "@/lib/api/projects";
import { getJournalEntry, setJournalMood } from "@/lib/api/journal";
import { formatDayLabel, todayISO } from "@/lib/date";
import { useSettings } from "@/hooks/use-settings";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { TodaySummaryCards } from "./_components/today-summary-cards";
import { TodayTasksCard } from "./_components/today-tasks-card";
import { TodayMoodCard } from "./_components/today-mood-card";
import { TodayJournalCard } from "./_components/today-journal-card";
import { TodayProjectsCard } from "./_components/today-projects-card";
import type { JournalEntry, Mood, Project, Task } from "@/lib/types";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function TodayPage() {
  const { settings } = useSettings();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [journal, setJournal] = useState<JournalEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMood, setSelectedMood] = useState<string>("");

  const today = todayISO();

  async function loadData() {
    const [taskRows, projectRows, entry] = await Promise.all([
      listTasksDueOrActive(today),
      listActiveProjects(),
      getJournalEntry(today),
    ]);

    setTasks(taskRows);
    setProjects(projectRows);
    if (entry) {
      setJournal(entry);
      setSelectedMood(entry.mood ?? "");
    }
    setLoading(false);
  }

  useEffect(() => {
    // Fetch once on mount. State is only set after the awaited query resolves,
    // so this doesn't cause the cascading renders the rule guards against.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleQuickAdd(title: string): Promise<boolean> {
    const created = await createTask({ title, due_date: today });
    if (!created) return false;
    setTasks((prev) => [created, ...prev]);
    toast({ title: "Task added", variant: "success" });
    return true;
  }

  async function handleToggleTask(task: Task) {
    const nextStatus: Task["status"] = task.status === "done" ? "todo" : "done";
    const patch = await setTaskStatus(task.id, nextStatus);
    if (!patch) return;
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, ...patch } : t)));
    if (nextStatus === "done") toast({ title: "Task done!", variant: "success" });
  }

  async function handleMoodSave(mood: string) {
    setSelectedMood(mood);
    const saved = await setJournalMood(journal, today, (mood || null) as Mood | null);
    if (!saved) return;
    setJournal(saved);
    toast({ title: "Mood saved", variant: "success" });
  }

  const doneTasks = tasks.filter((t) => t.status === "done");
  const pendingTasks = tasks.filter((t) => t.status !== "done");
  const allDone = doneTasks.length > 0 && doneTasks.length === tasks.length;
  // Falls back to a bare greeting if the display name is cleared in Settings.
  const name = settings.displayName.trim();

  return (
    <PageContainer squares={[[1, 1], [3, 2], [6, 4], [9, 1]]}>
      <PageHeader
        title={name ? `${getGreeting()}, ${name} ✦` : `${getGreeting()} ✦`}
        subtitle={formatDayLabel(new Date())}
        actions={
          allDone ? (
            <ConfettiButton
              preset="fireworks"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold bg-kv-500 text-white hover:bg-kv-600 transition-colors"
            >
              🎉 All done!
            </ConfettiButton>
          ) : undefined
        }
      />

      <TodaySummaryCards
        done={doneTasks.length}
        total={tasks.length}
        projectCount={projects.length}
        loading={loading}
        mood={selectedMood}
      />

      <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TodayTasksCard
          loading={loading}
          pending={pendingTasks}
          done={doneTasks}
          onAdd={handleQuickAdd}
          onToggle={handleToggleTask}
        />

        <div className="space-y-4">
          <TodayMoodCard value={selectedMood} onChange={handleMoodSave} />
          <TodayJournalCard entry={journal} />
        </div>
      </div>

      {projects.length > 0 && <TodayProjectsCard projects={projects} />}
    </PageContainer>
  );
}
