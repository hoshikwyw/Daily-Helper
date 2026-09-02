import { supabase } from "@/lib/supabase";
import { getUserId, reportError } from "@/lib/db";
import type { Project, ProjectStatus } from "@/lib/types";

// Data access for the `projects` table.

export type NewProject = {
  name: string;
  description?: string | null;
  status?: ProjectStatus;
  color?: string;
  tech_stack?: string[];
  repository_url?: string | null;
  notes?: string | null;
};

/** Writable project fields — what the detail page's save button sends. */
export type ProjectUpdate = Partial<Omit<NewProject, "name">> & { name?: string };

/** Every project, most recently updated first. */
export async function listProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("updated_at", { ascending: false });
  if (reportError(error)) return [];
  return data ?? [];
}

/** Active projects for the Today page's focus list. */
export async function listActiveProjects(limit = 4): Promise<Project[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("status", "active")
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (reportError(error)) return [];
  return data ?? [];
}

/** Id + name + color only — enough to label a task with its project. */
export async function listProjectOptions(): Promise<Project[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("id, name, color")
    .order("name");
  if (reportError(error)) return [];
  return (data ?? []) as Project[];
}

/**
 * One project by id. Returns null when it doesn't exist — deliberately silent,
 * since the detail page renders its own "not found" state for that case.
 */
export async function getProject(id: string): Promise<Project | null> {
  const { data, error } = await supabase.from("projects").select("*").eq("id", id).single();
  if (error) return null;
  return data;
}

export async function createProject(input: NewProject): Promise<Project | null> {
  const user_id = await getUserId();
  if (!user_id) return null;
  const { data, error } = await supabase
    .from("projects")
    .insert({ status: "active", ...input, user_id })
    .select()
    .single();
  if (reportError(error)) return null;
  return data;
}

export async function updateProject(id: string, patch: ProjectUpdate): Promise<boolean> {
  const { error } = await supabase.from("projects").update(patch).eq("id", id);
  return !reportError(error);
}

export async function deleteProject(id: string): Promise<boolean> {
  const { error } = await supabase.from("projects").delete().eq("id", id);
  return !reportError(error);
}
