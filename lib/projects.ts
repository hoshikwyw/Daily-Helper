import { PROJECT_STATUS_LABELS } from "@/lib/constants";
import type { ProjectUpdate } from "@/lib/api/projects";
import type { Project, ProjectStatus, TaskStatus } from "@/lib/types";

// Domain helpers for the Projects feature — tech-stack parsing, progress math,
// list filtering, and the edit-form draft. Pure functions, shared by the list
// page and the detail page.

// ── Tech stack ──────────────────────────────────────────────────────────────
// Stored as a string[]; edited as a single comma-separated text field.

export function parseTechStack(value: string): string[] {
  return value.split(",").map((x) => x.trim()).filter(Boolean);
}

export function formatTechStack(stack: string[]): string {
  return stack.join(", ");
}

// ── Progress ────────────────────────────────────────────────────────────────

/** Percentage of a project's tasks that are done; 0 when it has none. */
export function progressPercent(done: number, total: number): number {
  return total > 0 ? Math.round((done / total) * 100) : 0;
}

/** Progress bars turn green only at a genuine 100%. */
export function progressVariant(percent: number): "success" | "primary" {
  return percent === 100 ? "success" : "primary";
}

// ── List filtering ──────────────────────────────────────────────────────────

export type ProjectFilter = "all" | ProjectStatus;

export const PROJECT_FILTERS: { value: ProjectFilter; label: string }[] = [
  { value: "all", label: "All" },
  ...(Object.keys(PROJECT_STATUS_LABELS) as ProjectStatus[]).map((value) => ({
    value,
    label: PROJECT_STATUS_LABELS[value],
  })),
];

export type ProjectCounts = Record<ProjectFilter, number>;

/** How many projects sit under each filter chip — one pass over the list. */
export function countByFilter(projects: Project[]): ProjectCounts {
  const counts: ProjectCounts = {
    all: projects.length,
    active: 0,
    paused: 0,
    completed: 0,
    archived: 0,
  };
  for (const project of projects) counts[project.status]++;
  return counts;
}

export function filterProjects(projects: Project[], filter: ProjectFilter): Project[] {
  return filter === "all" ? projects : projects.filter((p) => p.status === filter);
}

// ── Linked tasks ────────────────────────────────────────────────────────────

/**
 * Task groups on the detail page, ordered by what needs attention first —
 * deliberately not the workflow order used by the tasks page tabs.
 */
export const PROJECT_TASK_GROUPS: { status: TaskStatus; label: string }[] = [
  { status: "in_progress", label: "In progress" },
  { status: "todo", label: "To do" },
  { status: "done", label: "Done" },
];

// ── Edit form ───────────────────────────────────────────────────────────────

/** The detail page's editable fields, as the form holds them (all strings). */
export type ProjectDraft = {
  name: string;
  description: string;
  repository: string;
  techStack: string;
  color: string;
  status: ProjectStatus;
  notes: string;
};

export function draftFromProject(project: Project): ProjectDraft {
  return {
    name: project.name,
    description: project.description ?? "",
    repository: project.repository_url ?? "",
    techStack: formatTechStack(project.tech_stack),
    color: project.color,
    status: project.status,
    notes: project.notes ?? "",
  };
}

/** Maps the draft back to a DB patch — empty strings become NULL columns. */
export function draftToUpdate(draft: ProjectDraft): ProjectUpdate {
  return {
    name: draft.name.trim(),
    description: draft.description.trim() || null,
    repository_url: draft.repository.trim() || null,
    tech_stack: parseTechStack(draft.techStack),
    color: draft.color,
    status: draft.status,
    notes: draft.notes.trim() || null,
  };
}

/** True when the draft differs from the saved row — drives the Save button. */
export function isDraftDirty(project: Project, draft: ProjectDraft): boolean {
  return (
    draft.name.trim() !== project.name ||
    draft.description.trim() !== (project.description ?? "") ||
    draft.repository.trim() !== (project.repository_url ?? "") ||
    draft.color !== project.color ||
    draft.status !== project.status ||
    draft.notes !== (project.notes ?? "") ||
    parseTechStack(draft.techStack).join("|") !== project.tech_stack.join("|")
  );
}
