import type { Mood, ProjectStatus, TaskPriority, TaskStatus } from "@/lib/types";

// Shared domain vocabulary — colors, labels, and Badge variant mappings — that
// was previously duplicated across the tasks, projects, journal, and today
// pages. Keeping it in one place ensures the UI stays consistent everywhere.

/** Badge/Progress color variants exposed by the glass UI library. */
export type UIVariant = "success" | "primary" | "warning" | "danger" | "default";

/** Swatch palette for project accent colors. */
export const PROJECT_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f97316",
  "#10b981", "#06b6d4", "#f59e0b", "#ef4444",
] as const;

export const MOOD_OPTIONS: { value: Mood; label: string }[] = [
  { value: "great", label: "😄 Great" },
  { value: "good", label: "🙂 Good" },
  { value: "okay", label: "😐 Okay" },
  { value: "bad", label: "😕 Bad" },
  { value: "terrible", label: "😞 Terrible" },
];

export const MOOD_VARIANTS: Record<Mood, UIVariant> = {
  great: "success",
  good: "primary",
  okay: "warning",
  bad: "danger",
  terrible: "danger",
};

export const PROJECT_STATUS_VARIANTS: Record<ProjectStatus, UIVariant> = {
  active: "primary",
  paused: "warning",
  completed: "success",
  archived: "default",
};

export const TASK_PRIORITY_VARIANTS: Record<TaskPriority, UIVariant> = {
  urgent: "danger",
  high: "warning",
  medium: "primary",
  low: "default",
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  done: "Done",
};

/** Options for a task-status `<select>`, in workflow order. */
export const TASK_STATUS_OPTIONS = (Object.keys(TASK_STATUS_LABELS) as TaskStatus[]).map(
  (value) => ({ value, label: TASK_STATUS_LABELS[value] })
);
