"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  Badge,
  Progress,
  Button,
  Input,
  Select,
  Breadcrumb,
  GridPattern,
  GradientBackground,
  toast,
} from "@kwyw/kayv-glass-ui";
import { createClient } from "@/lib/supabase";
import type { Project, Task, ProjectStatus, TaskStatus } from "@/lib/types";

const supabase = createClient();

const STATUS_VARIANTS: Record<ProjectStatus, "success" | "primary" | "warning" | "default"> = {
  active: "primary",
  paused: "warning",
  completed: "success",
  archived: "default",
};

const TASK_GROUPS: { status: TaskStatus; label: string; dot: string }[] = [
  { status: "in_progress", label: "In progress", dot: "bg-kv-400" },
  { status: "todo", label: "To do", dot: "bg-slate-500" },
  { status: "done", label: "Done", dot: "bg-green-400" },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f97316",
  "#10b981", "#06b6d4", "#f59e0b", "#ef4444",
];

function parseTech(s: string): string[] {
  return s.split(",").map((x) => x.trim()).filter(Boolean);
}

function ProjectDetail() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Editable fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [repository, setRepository] = useState("");
  const [techStack, setTechStack] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [status, setStatus] = useState<ProjectStatus>("active");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function load() {
      if (!id) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const { data: proj, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !proj) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setProject(proj);
      setName(proj.name);
      setDescription(proj.description ?? "");
      setRepository(proj.repository_url ?? "");
      setTechStack(proj.tech_stack.join(", "));
      setColor(proj.color);
      setStatus(proj.status);
      setNotes(proj.notes ?? "");

      const { data: t } = await supabase
        .from("tasks")
        .select("*")
        .eq("project_id", id)
        .order("created_at", { ascending: false });
      setTasks(t ?? []);
      setLoading(false);
    }
    load();
  }, [id]);

  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "done").length;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;

  const parsedTech = parseTech(techStack);
  const dirty =
    !!project &&
    (name.trim() !== project.name ||
      description.trim() !== (project.description ?? "") ||
      repository.trim() !== (project.repository_url ?? "") ||
      color !== project.color ||
      status !== project.status ||
      notes !== (project.notes ?? "") ||
      parsedTech.join("|") !== project.tech_stack.join("|"));

  async function handleSave() {
    if (!project) return;
    if (!name.trim()) {
      toast({ title: "Name can't be empty", variant: "warning" });
      return;
    }
    setSaving(true);
    const updates = {
      name: name.trim(),
      description: description.trim() || null,
      repository_url: repository.trim() || null,
      tech_stack: parsedTech,
      color,
      status,
      notes: notes.trim() || null,
    };
    const { error } = await supabase.from("projects").update(updates).eq("id", project.id);
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "danger" });
      return;
    }
    setProject({ ...project, ...updates });
    toast({
      title: status === "completed" ? "Project completed! 🎉" : "Changes saved",
      variant: "success",
    });
  }

  async function handleDelete() {
    if (!project) return;
    setDeleting(true);
    const { error } = await supabase.from("projects").delete().eq("id", project.id);
    if (error) {
      setDeleting(false);
      toast({ title: "Error", description: error.message, variant: "danger" });
      return;
    }
    toast({ title: "Project deleted", variant: "warning" });
    router.push("/dashboard/projects");
  }

  return (
    <div className="relative min-h-screen p-4 sm:p-6 space-y-6">
      <GradientBackground fixed={false} />
      <GridPattern
        className="absolute inset-0 opacity-5 [mask-image:radial-gradient(ellipse_at_top,white_20%,transparent_70%)]"
        squares={[[2, 2], [5, 1], [7, 4]]}
      />

      <div className="relative">
        <Breadcrumb
          items={[
            { label: "Today", href: "/dashboard" },
            { label: "Projects", href: "/dashboard/projects" },
            { label: loading ? "…" : project?.name ?? "Not found" },
          ]}
        />
      </div>

      {loading ? (
        <div className="relative space-y-4">
          <div className="h-10 w-64 rounded bg-white/5 animate-pulse" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-64 rounded-xl bg-white/5 animate-pulse" />
            <div className="h-64 rounded-xl bg-white/5 animate-pulse" />
          </div>
        </div>
      ) : notFound || !project ? (
        <div className="relative max-w-4xl">
          <Card variant="elevated">
            <CardContent>
              <p className="text-slate-400 text-sm text-center py-10">
                This project doesn&apos;t exist or was deleted.
              </p>
              <div className="flex justify-center">
                <Link href="/dashboard/projects">
                  <Button variant="primary" size="sm">← Back to projects</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="relative space-y-6">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span
                className="w-5 h-5 rounded-full shrink-0 mt-1.5"
                style={{ backgroundColor: color }}
              />
              <div>
                <h1 className="text-2xl font-bold text-white">{project.name}</h1>
                <div className="flex items-center gap-2 mt-1.5">
                  <Badge variant={STATUS_VARIANTS[project.status]} size="sm">
                    {project.status}
                  </Badge>
                  <span className="text-slate-500 text-sm">
                    {done}/{total} tasks done
                  </span>
                </div>
              </div>
            </div>
            <Link href="/dashboard/projects">
              <Button variant="ghost" size="sm">← All projects</Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Main column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Overview */}
              <Card variant="elevated">
                <CardHeader title="Overview" description="Project details and settings" />
                <CardContent>
                  <div className="space-y-5">
                    <Input
                      label="Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Project name"
                    />

                    <Input
                      label="Description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="What is this project about?"
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1.5">Status</p>
                        <Select
                          value={status}
                          onChange={(value) => setStatus(value as ProjectStatus)}
                          options={[
                            { value: "active", label: "Active" },
                            { value: "paused", label: "Paused" },
                            { value: "completed", label: "Completed" },
                            { value: "archived", label: "Archived" },
                          ]}
                        />
                      </div>
                      <div>
                        <Input
                          label="Repository URL"
                          type="url"
                          value={repository}
                          onChange={(e) => setRepository(e.target.value)}
                          placeholder="https://github.com/..."
                        />
                        {project.repository_url && (
                          <a
                            href={project.repository_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block mt-1.5 text-kv-400 text-xs hover:text-kv-300 break-all"
                          >
                            Open saved link ↗
                          </a>
                        )}
                      </div>
                    </div>

                    <div>
                      <Input
                        label="Tech stack (comma-separated)"
                        value={techStack}
                        onChange={(e) => setTechStack(e.target.value)}
                        placeholder="React, TypeScript, Supabase"
                      />
                      {parsedTech.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {parsedTech.map((t) => (
                            <Badge key={t} variant="default" size="sm">{t}</Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Color</p>
                      <div className="flex gap-2 flex-wrap">
                        {COLORS.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setColor(c)}
                            className={`w-7 h-7 rounded-full transition-transform ${color === c ? "scale-125 ring-2 ring-white/50" : "hover:scale-110"}`}
                            style={{ backgroundColor: c }}
                            aria-label={`Set color ${c}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tasks */}
              <Card variant="elevated">
                <CardHeader
                  title="Tasks"
                  description={total === 0 ? "No tasks linked yet" : `${total} task${total !== 1 ? "s" : ""} · ${done} done`}
                />
                <CardContent>
                  {total === 0 ? (
                    <p className="text-slate-500 text-sm">
                      No tasks linked to this project. Assign a project when creating a task to see it here.
                    </p>
                  ) : (
                    <div className="space-y-5">
                      {TASK_GROUPS.map((group) => {
                        const groupTasks = tasks.filter((t) => t.status === group.status);
                        if (groupTasks.length === 0) return null;
                        return (
                          <div key={group.status}>
                            <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">
                              {group.label} ({groupTasks.length})
                            </p>
                            <div className="space-y-1.5">
                              {groupTasks.map((task) => (
                                <div
                                  key={task.id}
                                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white/5 text-sm"
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${group.dot}`} />
                                  <span className={task.status === "done" ? "text-slate-500 line-through" : "text-slate-200"}>
                                    {task.title}
                                  </span>
                                  {task.due_date && (
                                    <span className="ml-auto text-xs text-slate-500">
                                      {formatDate(task.due_date)}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Notes / Vlogs */}
              <Card variant="elevated">
                <CardHeader title="Notes" description="Log updates, ideas, and progress for this project" />
                <CardContent>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={8}
                    placeholder="Write project notes, a changelog, or a running log of updates…"
                    className="w-full rounded-lg bg-white/5 border border-white/10 px-3.5 py-3 text-sm text-slate-200 placeholder-slate-600 resize-y focus:outline-none focus:border-kv-500/60 transition-colors"
                  />
                </CardContent>
                <CardFooter>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="text-red-400 hover:text-red-300"
                  >
                    {deleting ? "Deleting…" : "Delete project"}
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSave}
                    isLoading={saving}
                    disabled={!dirty || saving}
                    className="ml-auto"
                  >
                    Save changes
                  </Button>
                </CardFooter>
              </Card>
            </div>

            {/* Right rail */}
            <div className="lg:sticky lg:top-6 space-y-6">
              <Card variant="elevated">
                <CardHeader title="Progress" />
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Tasks complete</span>
                        <span className="text-slate-200 font-medium">{progress}%</span>
                      </div>
                      <Progress value={progress} variant={progress === 100 ? "success" : "primary"} size="md" />
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Created</p>
                        <p className="text-slate-300">{formatDate(project.created_at)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Updated</p>
                        <p className="text-slate-300">{formatDate(project.updated_at)}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProjectDetailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen animate-pulse bg-white/5" />}>
      <ProjectDetail />
    </Suspense>
  );
}
