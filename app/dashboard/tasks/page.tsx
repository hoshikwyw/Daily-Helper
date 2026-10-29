"use client";

import { useEffect, useState } from "react";
import { Badge, Button, Tabs, TabList, Tab, TabPanels, TabPanel, toast } from "@kwyw/kayv-glass-ui";
import {
  createTask,
  deleteTask,
  listTasks,
  setTaskStatus,
  updateTask,
  type NewTask,
} from "@/lib/api/tasks";
import { listProjectOptions } from "@/lib/api/projects";
import { createRecurrence } from "@/lib/api/recurrences";
import { describeSchedule, firstOccurrence, type Schedule } from "@/lib/recurrence";
import { TASK_PRIORITY_VARIANTS, TASK_STATUS_LABELS } from "@/lib/constants";
import {
  TASK_TABS,
  countByTab,
  emptyLabelForTab,
  filterByTab,
  projectNameById,
  taskDraft,
  taskPatch,
  type TaskDraft,
  type TaskTab,
} from "@/lib/tasks";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { useRecurrenceSync } from "@/components/recurrence-sync";
import { RecurringRulesModal } from "@/components/ui/recurring-rules-modal";
import { TaskList } from "./_components/task-list";
import { CreateTaskModal } from "./_components/create-task-modal";
import { TaskDetailDrawer } from "./_components/task-detail-drawer";
import type { Project, Task, TaskStatus } from "@/lib/types";

// What the drawer renders in the instant between a task closing and its draft
// clearing; never visible for long enough to type into.
const EMPTY_DRAFT: TaskDraft = {
  title: "",
  description: "",
  priority: "medium",
  project_id: "",
  due_date: "",
  status: "todo",
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TaskTab>("all");
  const [showCreate, setShowCreate] = useState(false);
  const [showRecurring, setShowRecurring] = useState(false);
  const { version: syncVersion, sync } = useRecurrenceSync();

  // Detail drawer. The draft lives here rather than in the drawer so pending
  // edits aren't lost while the drawer animates in and out.
  const [selected, setSelected] = useState<Task | null>(null);
  const [draft, setDraft] = useState<TaskDraft | null>(null);
  const [savingTask, setSavingTask] = useState(false);

  async function loadData() {
    const [taskRows, projectRows] = await Promise.all([listTasks(), listProjectOptions()]);
    setTasks(taskRows);
    setProjects(projectRows);
    setLoading(false);
  }

  useEffect(() => {
    // Fetch on mount, and again when the recurrence sync has created tasks.
    // State is only set after the awaited query resolves, so this doesn't
    // cause the cascading renders the rule guards against.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [syncVersion]);

  function openDetail(task: Task) {
    setSelected(task);
    setDraft(taskDraft(task));
  }

  async function handleCreate(values: NewTask, repeat: Schedule | null): Promise<boolean> {
    if (repeat) {
      // The rule is the record; the sync creates today's task itself (and
      // any missed ones, when the date is in the past) and reloads the list.
      const rule = await createRecurrence({
        target: "task",
        ...repeat,
        next_due: firstOccurrence(repeat),
        title: values.title,
        description: values.description ?? null,
        priority: values.priority ?? "medium",
        project_id: values.project_id ?? null,
      });
      if (!rule) return false;
      await sync();
      toast({ title: "Repeat set up", description: describeSchedule(rule), variant: "success" });
      return true;
    }

    const created = await createTask(values);
    if (!created) return false;
    setTasks((prev) => [created, ...prev]);
    toast({ title: "Task created", variant: "success" });
    return true;
  }

  // Shared status writer used by both the inline row dropdown and the drawer.
  async function updateTaskStatus(id: string, status: TaskStatus): Promise<boolean> {
    const patch = await setTaskStatus(id, status);
    if (!patch) return false;
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    return true;
  }

  // Inline quick-move from a task row.
  async function handleQuickStatus(task: Task, status: TaskStatus) {
    if (status === task.status) return;
    if (await updateTaskStatus(task.id, status)) {
      toast({ title: `Moved to ${TASK_STATUS_LABELS[status]}`, variant: "success" });
    }
  }

  async function handleSaveTask() {
    if (!selected || !draft) return;
    const patch = taskPatch(selected, draft);
    if (Object.keys(patch).length === 0) {
      setSelected(null);
      return;
    }
    setSavingTask(true);
    const updated = await updateTask(selected.id, patch);
    setSavingTask(false);
    if (!updated) return;
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    setSelected(null);
    toast({ title: "Task updated", variant: "success" });
  }

  async function handleDelete(id: string) {
    if (!(await deleteTask(id))) return;
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setSelected(null);
    toast({ title: "Task deleted", variant: "warning" });
  }

  const counts = countByTab(tasks);
  const projectName = (id: string | null) => projectNameById(projects, id);

  return (
    <PageContainer>
      <PageHeader
        breadcrumb={[{ label: "Today", href: "/dashboard" }, { label: "Tasks" }]}
        title="Tasks"
        subtitle={`${counts.all} total · ${counts.done} done`}
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={() => setShowRecurring(true)}>
              ⟳ Recurring
            </Button>
            <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>
              + New Task
            </Button>
          </>
        }
      />

      <div className="relative">
        <Tabs value={activeTab} onChange={(v) => setActiveTab(v as TaskTab)}>
          <TabList className="scroll-x">
            {TASK_TABS.map(({ value, label }) => (
              <Tab key={value} value={value}>
                {label} ({counts[value]})
              </Tab>
            ))}
          </TabList>

          <TabPanels className="mt-4">
            {TASK_TABS.map(({ value }) => (
              <TabPanel key={value} value={value}>
                <TaskList
                  loading={loading}
                  tasks={filterByTab(tasks, value)}
                  emptyLabel={emptyLabelForTab(value)}
                  projectName={projectName}
                  onOpen={openDetail}
                  onStatusChange={handleQuickStatus}
                />
              </TabPanel>
            ))}
          </TabPanels>
        </Tabs>
      </div>

      <CreateTaskModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        projects={projects}
        onSubmit={handleCreate}
      />

      <RecurringRulesModal
        open={showRecurring}
        onClose={() => setShowRecurring(false)}
        target="task"
        title="Recurring tasks"
        emptyHint="No repeating tasks yet. Pick a Repeat option when creating one."
        renderSummary={(rule) => (
          <span className="flex items-center gap-2">
            <span className="truncate">{rule.title}</span>
            {rule.priority && (
              <Badge variant={TASK_PRIORITY_VARIANTS[rule.priority]} size="sm">
                {rule.priority}
              </Badge>
            )}
            {rule.project_id && (
              <span className="text-xs text-slate-400 shrink-0">{projectName(rule.project_id)}</span>
            )}
          </span>
        )}
      />

      <TaskDetailDrawer
        task={selected}
        projects={projects}
        draft={draft ?? (selected ? taskDraft(selected) : EMPTY_DRAFT)}
        onChange={(patch) => setDraft((prev) => (prev ? { ...prev, ...patch } : prev))}
        dirty={!!selected && !!draft && Object.keys(taskPatch(selected, draft)).length > 0}
        saving={savingTask}
        onClose={() => setSelected(null)}
        onSave={handleSaveTask}
        onDelete={handleDelete}
      />
    </PageContainer>
  );
}
