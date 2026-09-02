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
