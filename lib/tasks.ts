import { TASK_STATUS_LABELS } from "@/lib/constants";
import type { Project, Task, TaskStatus } from "@/lib/types";

// Domain helpers for the Tasks feature. Pure functions only, so the page and
// its sub-components share one implementation of filtering and counting.

/** The tabs on the tasks page: "all", then one per workflow status. */
export type TaskTab = "all" | TaskStatus;

export const TASK_TABS: { value: TaskTab; label: string }[] = [
  { value: "all", label: "All" },
  ...(Object.keys(TASK_STATUS_LABELS) as TaskStatus[]).map((value) => ({
    value,
    label: TASK_STATUS_LABELS[value],
  })),
];

export type TaskCounts = Record<TaskTab, number>;

/** How many tasks sit in each tab — one pass, rather than a filter per tab. */
export function countByTab(tasks: Task[]): TaskCounts {
  const counts: TaskCounts = { all: tasks.length, todo: 0, in_progress: 0, done: 0 };
  for (const task of tasks) counts[task.status]++;
  return counts;
}

export function filterByTab(tasks: Task[], tab: TaskTab): Task[] {
  return tab === "all" ? tasks : tasks.filter((t) => t.status === tab);
}

/** Resolves a task's `project_id` to a display name, or null when unassigned. */
export function projectNameById(projects: Project[], id: string | null): string | null {
  return projects.find((p) => p.id === id)?.name ?? null;
}

/** The prompt shown when a tab has nothing in it. */
export function emptyLabelForTab(tab: TaskTab): string {
  return tab === "done" ? "No completed tasks yet." : "No tasks here. Add one!";
}

// ── Editing ─────────────────────────────────────────────────────────────────

/** The editable fields of a task as form values: strings, never null. */
export type TaskDraft = {
  title: string;
  description: string;
  priority: Task["priority"];
  project_id: string;
  due_date: string;
  status: TaskStatus;
};

export function taskDraft(task: Task): TaskDraft {
  return {
    title: task.title,
    description: task.description ?? "",
    priority: task.priority,
    project_id: task.project_id ?? "",
    due_date: task.due_date ?? "",
    status: task.status,
  };
}

/** What an edit writes: every field optional, blanks as null where the row allows it. */
export type TaskPatch = {
  title?: string;
  description?: string | null;
  priority?: Task["priority"];
  project_id?: string | null;
  due_date?: string | null;
  status?: TaskStatus;
};

/** The fields the draft changed, in the shape the API takes; empty when nothing did. */
export function taskPatch(task: Task, draft: TaskDraft): TaskPatch {
  const patch: TaskPatch = {};
  const title = draft.title.trim();
  if (title && title !== task.title) patch.title = title;
  const description = draft.description.trim() || null;
  if (description !== task.description) patch.description = description;
  if (draft.priority !== task.priority) patch.priority = draft.priority;
  const project_id = draft.project_id || null;
  if (project_id !== task.project_id) patch.project_id = project_id;
  const due_date = draft.due_date || null;
  if (due_date !== task.due_date) patch.due_date = due_date;
  if (draft.status !== task.status) patch.status = draft.status;
  return patch;
}
