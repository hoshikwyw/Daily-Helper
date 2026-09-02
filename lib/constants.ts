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

/**
 * Everything the UI needs for a mood in one place: its emoji, its display
 * name, and its badge color. Previously the emoji was recovered by splitting
 * the combined label on a space, which broke silently if a label changed.
 */
export const MOOD_META: Record<Mood, { emoji: string; label: string; variant: UIVariant }> = {
  great: { emoji: "😄", label: "Great", variant: "success" },
  good: { emoji: "🙂", label: "Good", variant: "primary" },
  okay: { emoji: "😐", label: "Okay", variant: "warning" },
  bad: { emoji: "😕", label: "Bad", variant: "danger" },
  terrible: { emoji: "😞", label: "Terrible", variant: "danger" },
};

/** Moods from best to worst — the order they appear in a picker. */
export const MOODS = Object.keys(MOOD_META) as Mood[];

/** Options for a mood `<select>`, e.g. "😄 Great". */
export const MOOD_OPTIONS = MOODS.map((value) => ({
  value,
  label: `${MOOD_META[value].emoji} ${MOOD_META[value].label}`,
}));

export const PROJECT_STATUS_VARIANTS: Record<ProjectStatus, UIVariant> = {
  active: "primary",
  paused: "warning",
  completed: "success",
  archived: "default",
};

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  active: "Active",
  paused: "Paused",
  completed: "Completed",
  archived: "Archived",
};

/** Options for a project-status `<select>`. */
export const PROJECT_STATUS_OPTIONS = (
  Object.keys(PROJECT_STATUS_LABELS) as ProjectStatus[]
).map((value) => ({ value, label: PROJECT_STATUS_LABELS[value] }));

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

/** Left accent stripe + background tint per status, for task rows. */
export const TASK_STATUS_ROW_STYLES: Record<TaskStatus, string> = {
  todo: "border-slate-500/60 bg-slate-500/5 hover:bg-slate-500/10",
  in_progress: "border-kv-500/70 bg-kv-500/10 hover:bg-kv-500/15",
  done: "border-green-500/60 bg-green-500/5 hover:bg-green-500/10",
};

/** Status dot color, used wherever a task is shown in a list. */
export const TASK_STATUS_DOTS: Record<TaskStatus, string> = {
  todo: "bg-slate-500",
  in_progress: "bg-kv-400",
  done: "bg-green-400",
};

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

/** Options for a priority `<select>`, ascending in urgency. */
export const TASK_PRIORITY_OPTIONS = (Object.keys(TASK_PRIORITY_LABELS) as TaskPriority[]).map(
  (value) => ({ value, label: TASK_PRIORITY_LABELS[value] })
);
