"use client";

import { useEffect, useMemo, useState } from "react";
import { ConfettiButton, toast } from "@kwyw/kayv-glass-ui";
import { createTask, listTasksDueOrActive, setTaskStatus } from "@/lib/api/tasks";
import { listActiveProjects } from "@/lib/api/projects";
import { getJournalEntry, setJournalMood } from "@/lib/api/journal";
import { listExpensesInRange } from "@/lib/api/expenses";
import { listRecurrences } from "@/lib/api/recurrences";
import { upcomingRules } from "@/lib/recurrence";
import { formatDayLabel, formatMonthName, monthPrefix, monthRange, todayISO } from "@/lib/date";
import { budgetProgress, effectiveBudgets } from "@/lib/budgets";
import { doneTodayCount, habitStatuses } from "@/lib/habits";
import { useBudgets } from "@/hooks/use-budgets";
import { useHabits } from "@/hooks/use-habits";
import { useExpenseCategories } from "@/hooks/use-expense-categories";
import { useSettings } from "@/hooks/use-settings";
import { useRecurrenceSync } from "@/components/recurrence-sync";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { TodaySummaryCards } from "./_components/today-summary-cards";
import { ReviewNudge } from "./_components/review-nudge";
import { TodayTasksCard } from "./_components/today-tasks-card";
import { TodayMoodCard } from "./_components/today-mood-card";
import { TodayHabitsCard } from "./_components/today-habits-card";
import { ManageHabitsModal } from "./_components/manage-habits-modal";
import { TodayJournalCard } from "./_components/today-journal-card";
import { TodayProjectsCard } from "./_components/today-projects-card";
import { TodayMoneyCard } from "./_components/today-money-card";
import type { Expense, JournalEntry, Mood, Project, Recurrence, Task } from "@/lib/types";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function TodayPage() {
  const { settings } = useSettings();
  const { colorMap } = useExpenseCategories();
  const { version: syncVersion } = useRecurrenceSync();
  const { budgets } = useBudgets();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [journal, setJournal] = useState<JournalEntry | null>(null);
  const [monthEntries, setMonthEntries] = useState<Expense[]>([]);
  const [upcoming, setUpcoming] = useState<Recurrence[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMood, setSelectedMood] = useState<string>("");
  const [showManageHabits, setShowManageHabits] = useState(false);

  const today = todayISO();
  const now = useMemo(() => new Date(), []);
  const habitsState = useHabits(today);
  const habitRows = useMemo(
    () => habitStatuses(habitsState.habits, habitsState.checks, today),
    [habitsState.habits, habitsState.checks, today]
  );
  const { from: monthFrom, to: monthTo } = useMemo(() => monthRange(now), [now]);

  // This month's spending against its limits.
  const monthBudgets = useMemo(
    () =>
      budgetProgress(
        effectiveBudgets(budgets, monthPrefix(now.getFullYear(), now.getMonth())),
        monthEntries
      ),
    [budgets, now, monthEntries]
  );

  async function loadData() {
    const [taskRows, projectRows, entry, money, moneyRules] = await Promise.all([
      listTasksDueOrActive(today),
      listActiveProjects(),
      getJournalEntry(today),
      listExpensesInRange(monthFrom, monthTo),
      listRecurrences("expense"),
    ]);

    setTasks(taskRows);
    setProjects(projectRows);
    setMonthEntries(money);
    setUpcoming(upcomingRules(moneyRules));
    if (entry) {
      setJournal(entry);
      setSelectedMood(entry.mood ?? "");
    }
    setLoading(false);
  }

  useEffect(() => {
    // Fetch on mount, and again when the recurrence sync has created rows
    // (today's recurring tasks or this month's recurring entries). State is
    // only set after the awaited query resolves, so this doesn't cause the
    // cascading renders the rule guards against.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncVersion]);

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
    <PageContainer>
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

      <ReviewNudge date={now} />

      <TodaySummaryCards
        done={doneTasks.length}
        total={tasks.length}
        projectCount={projects.length}
        loading={loading}
        mood={selectedMood}
        habitsDone={doneTodayCount(habitRows)}
        habitsTotal={habitRows.length}
        habitsPending={!habitsState.loaded && habitsState.expected}
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
          <TodayHabitsCard
            statuses={habitRows}
            loaded={habitsState.loaded}
            hasHabits={habitsState.habits.length > 0}
            onToggle={(habitId) => habitsState.toggle(habitId, today)}
            onAdd={(name) => habitsState.addHabit(name)}
            onManage={() => setShowManageHabits(true)}
          />
          <TodayJournalCard entry={journal} />
        </div>
      </div>

      <TodayMoneyCard
        entries={monthEntries}
        upcoming={upcoming}
        budgets={monthBudgets}
        colorMap={colorMap}
        loading={loading}
        monthLabel={formatMonthName(now)}
      />

      {projects.length > 0 && <TodayProjectsCard projects={projects} />}

      <ManageHabitsModal
        open={showManageHabits}
        onClose={() => setShowManageHabits(false)}
        habits={habitsState.habits}
        onPatch={habitsState.patchHabit}
        onReorder={habitsState.reorder}
      />
    </PageContainer>
  );
}
