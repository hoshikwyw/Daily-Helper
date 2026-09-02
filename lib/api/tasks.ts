import { supabase } from "@/lib/supabase";
import { getUserId, reportError } from "@/lib/db";
import type { Task, TaskPriority, TaskStatus } from "@/lib/types";

// Data access for the `tasks` table. Pages call these instead of touching
// Supabase directly, so query shape, default values, and the `completed_at`
// bookkeeping live in exactly one place.

export type NewTask = {
  title: string;
  description?: string | null;
  priority?: TaskPriority;
  status?: TaskStatus;
  project_id?: string | null;
  due_date?: string | null;
};

/** Every task, newest first. */
export async function listTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: false });
  if (reportError(error)) return [];
  return data ?? [];
}

/** The Today feed: tasks due on `date`, plus anything still in progress. */
export async function listTasksDueOrActive(date: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .or(`due_date.eq.${date},status.eq.in_progress`)
    .order("created_at", { ascending: false });
  if (reportError(error)) return [];
  return data ?? [];
}

/** Tasks linked to one project, newest first. */
export async function listTasksByProject(projectId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (reportError(error)) return [];
  return data ?? [];
}

export type TaskCount = { total: number; done: number };

/**
 * Total/done task counts keyed by project id, for the projects grid. Counting
 * happens here rather than in the page so the projects list only ever handles
 * the aggregate it actually renders.
 */
export async function listProjectTaskCounts(): Promise<Record<string, TaskCount>> {
  const { data, error } = await supabase
    .from("tasks")
    .select("project_id, status")
    .not("project_id", "is", null);
  if (reportError(error) || !data) return {};

  const counts: Record<string, TaskCount> = {};
  for (const t of data) {
    if (!t.project_id) continue;
    counts[t.project_id] ??= { total: 0, done: 0 };
    counts[t.project_id].total++;
    if (t.status === "done") counts[t.project_id].done++;
  }
  return counts;
}

/** Creates a task for the signed-in user. Returns the inserted row, or null. */
export async function createTask(input: NewTask): Promise<Task | null> {
  const user_id = await getUserId();
  if (!user_id) return null;
  const { data, error } = await supabase
    .from("tasks")
    .insert({ status: "todo", priority: "medium", ...input, user_id })
    .select()
    .single();
  if (reportError(error)) return null;
  return data;
}

/** The fields a status change writes — mirror them into local state. */
export type TaskStatusPatch = { status: TaskStatus; completed_at: string | null };

/**
 * Moves a task to `status`, stamping `completed_at` when it lands on "done"
 * and clearing it otherwise. Returns the patch so callers can apply the exact
 * same shape to their local copy.
 */
export async function setTaskStatus(
  id: string,
  status: TaskStatus
): Promise<TaskStatusPatch | null> {
  const patch: TaskStatusPatch = {
    status,
    completed_at: status === "done" ? new Date().toISOString() : null,
  };
  const { error } = await supabase.from("tasks").update(patch).eq("id", id);
  if (reportError(error)) return null;
  return patch;
}

export async function deleteTask(id: string): Promise<boolean> {
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  return !reportError(error);
}
