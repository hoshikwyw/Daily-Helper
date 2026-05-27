"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  Drawer,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  Badge,
  Progress,
  Button,
  Input,
  Select,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Breadcrumb,
  Tooltip,
  ConfettiButton,
  GridPattern,
  GradientBackground,
  toast,
} from "@kwyw/kayv-glass-ui";
import { createClient } from "@/lib/supabase";

const supabase = createClient();
import type { Project, Task, ProjectStatus } from "@/lib/types";

const STATUS_VARIANTS: Record<ProjectStatus, "success" | "primary" | "warning" | "default"> = {
  active: "primary",
  paused: "warning",
  completed: "success",
  archived: "default",
};

const COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f97316",
  "#10b981", "#06b6d4", "#f59e0b", "#ef4444",
];

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [taskCounts, setTaskCounts] = useState<Record<string, { total: number; done: number }>>({});
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<"all" | ProjectStatus>("all");

  // Drawer
  const [selected, setSelected] = useState<Project | null>(null);
  const [projectTasks, setProjectTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newColor, setNewColor] = useState(COLORS[0]);
  const [newTech, setNewTech] = useState("");
  const [newRepo, setNewRepo] = useState("");
  const [saving, setSaving] = useState(false);

  // Edit status
  const [editStatus, setEditStatus] = useState<ProjectStatus>("active");

  async function loadData() {
    const { data: proj } = await supabase
      .from("projects")
      .select("*")
      .order("updated_at", { ascending: false });

    if (proj) {
      setProjects(proj);
      // Load task counts for all projects
      const { data: tasks } = await supabase
        .from("tasks")
        .select("project_id, status")
        .not("project_id", "is", null);
      if (tasks) {
        const counts: Record<string, { total: number; done: number }> = {};
        for (const t of tasks) {
          if (!t.project_id) continue;
          if (!counts[t.project_id]) counts[t.project_id] = { total: 0, done: 0 };
          counts[t.project_id].total++;
          if (t.status === "done") counts[t.project_id].done++;
        }
        setTaskCounts(counts);
      }
    }
    setLoading(false);
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function openDrawer(project: Project) {
    setSelected(project);
    setEditStatus(project.status);
    setLoadingTasks(true);
    const { data } = await supabase
      .from("tasks")
      .select("*")
      .eq("project_id", project.id)
      .order("created_at", { ascending: false });
    setProjectTasks(data ?? []);
    setLoadingTasks(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setSaving(true);
    const techStack = newTech.split(",").map((s) => s.trim()).filter(Boolean);
    const { data, error } = await supabase
      .from("projects")
      .insert({
        name: newName.trim(),
        description: newDesc.trim() || null,
        status: "active",
        color: newColor,
        tech_stack: techStack,
        repository_url: newRepo.trim() || null,
        notes: null,
      })
      .select()
      .single();
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "danger" });
    } else {
      setProjects((prev) => [data as Project, ...prev]);
      setShowCreate(false);
      setNewName("");
      setNewDesc("");
      setNewColor(COLORS[0]);
      setNewTech("");
      setNewRepo("");
      toast({ title: "Project created!", variant: "success" });
    }
  }

  async function handleStatusUpdate() {
    if (!selected) return;
    const { error } = await supabase
      .from("projects")
      .update({ status: editStatus })
      .eq("id", selected.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "danger" });
    } else {
      setProjects((prev) =>
        prev.map((p) => (p.id === selected.id ? { ...p, status: editStatus } : p))
      );
      setSelected(null);
      if (editStatus === "completed") {
        toast({ title: "Project completed! 🎉", variant: "success" });
      } else {
        toast({ title: "Status updated", variant: "success" });
      }
    }
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (!error) {
      setProjects((prev) => prev.filter((p) => p.id !== id));
      setSelected(null);
      toast({ title: "Project deleted", variant: "warning" });
    }
  }

  const filtered = activeFilter === "all" ? projects : projects.filter((p) => p.status === activeFilter);

  const counts = {
    all: projects.length,
    active: projects.filter((p) => p.status === "active").length,
    paused: projects.filter((p) => p.status === "paused").length,
    completed: projects.filter((p) => p.status === "completed").length,
    archived: projects.filter((p) => p.status === "archived").length,
  };

  return (
    <div className="relative min-h-screen p-6 space-y-6">
      <GradientBackground fixed={false} />
      <GridPattern
        className="absolute inset-0 opacity-5 [mask-image:radial-gradient(ellipse_at_top,white_20%,transparent_70%)]"
        squares={[[2,2],[5,1],[7,4]]}
      />

      <div className="relative">
        <Breadcrumb items={[{ label: "Today", href: "/dashboard" }, { label: "Projects" }]} />
      </div>

      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Projects</h1>
          <p className="text-slate-400 text-sm mt-1">{counts.active} active · {counts.completed} completed</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>
          + New Project
        </Button>
      </div>

      {/* Filter chips */}
      <div className="relative flex flex-wrap gap-2">
        {(["all", "active", "paused", "completed", "archived"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeFilter === f
                ? "bg-kv-500 text-white"
                : "bg-white/5 text-slate-400 hover:bg-white/10"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)} ({counts[f]})
          </button>
        ))}
      </div>

      {/* Projects grid */}
      <div className="relative grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-48 rounded-xl bg-white/5 animate-pulse" />
          ))
        ) : filtered.length === 0 ? (
          <div className="col-span-full">
            <Card variant="elevated">
              <CardContent>
                <p className="text-slate-500 text-sm text-center py-10">
                  {activeFilter === "all" ? "No projects yet — create your first one!" : `No ${activeFilter} projects.`}
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          filtered.map((project) => {
            const tc = taskCounts[project.id];
            const progress = tc && tc.total > 0 ? Math.round((tc.done / tc.total) * 100) : 0;
            const progressVariant = progress === 100 ? "success" : "primary";

            return (
              <Card key={project.id} variant="elevated" className="flex flex-col">
                <CardHeader
                  title={project.name}
                  description={project.description ?? undefined}
                />
                <CardContent className="flex-1 space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: project.color }} />
                    <Badge variant={STATUS_VARIANTS[project.status]} size="sm">
                      {project.status}
                    </Badge>
                    {project.tech_stack.slice(0, 3).map((t) => (
                      <Badge key={t} variant="default" size="sm">{t}</Badge>
                    ))}
                  </div>

                  {tc && tc.total > 0 && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Tasks</span>
                        <span>{tc.done}/{tc.total}</span>
                      </div>
                      <Progress value={progress} variant={progressVariant} size="sm" />
                    </div>
                  )}

                  {project.tech_stack.length > 3 && (
                    <Tooltip content={project.tech_stack.slice(3).join(", ")}>
                      <span className="text-xs text-slate-500 cursor-default">
                        +{project.tech_stack.length - 3} more
                      </span>
                    </Tooltip>
                  )}
                </CardContent>
                <CardFooter>
                  <Button variant="ghost" size="sm" onClick={() => openDrawer(project)}>
                    View details →
                  </Button>
                  {project.status === "completed" && (
                    <ConfettiButton
                      preset="stars"
                      className="ml-auto text-sm text-yellow-400 hover:text-yellow-300 transition-colors bg-transparent border-0"
                    >
                      🏆
                    </ConfettiButton>
                  )}
                </CardFooter>
              </Card>
            );
          })
        )}
      </div>

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} size="md">
        <ModalHeader>New Project</ModalHeader>
        <form onSubmit={handleCreate}>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Name"
                placeholder="My Awesome Project"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
              />
              <Input
                label="Description"
                placeholder="What is this project about?"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
              />
              <Input
                label="Tech stack (comma-separated)"
                placeholder="React, TypeScript, Supabase"
                value={newTech}
                onChange={(e) => setNewTech(e.target.value)}
              />
              <Input
                label="Repository URL"
                placeholder="https://github.com/..."
                value={newRepo}
                onChange={(e) => setNewRepo(e.target.value)}
              />
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewColor(c)}
                      className={`w-7 h-7 rounded-full transition-transform ${newColor === c ? "scale-125 ring-2 ring-white/50" : "hover:scale-110"}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={() => setShowCreate(false)} type="button">Cancel</Button>
            <Button variant="primary" type="submit" disabled={saving}>
              {saving ? "Creating…" : "Create Project"}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Detail Drawer */}
      <Drawer open={!!selected} onClose={() => setSelected(null)} placement="right" size="md">
        {selected && (
          <>
            <DrawerHeader>{selected.name}</DrawerHeader>
            <DrawerBody>
              <div className="space-y-6">
                {selected.description && (
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Description</p>
                    <p className="text-slate-300 text-sm">{selected.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Status</p>
                    <Select
                      value={editStatus}
                      onChange={(value) => setEditStatus(value as ProjectStatus)}
                      options={[
                        { value: "active", label: "Active" },
                        { value: "paused", label: "Paused" },
                        { value: "completed", label: "Completed" },
                        { value: "archived", label: "Archived" },
                      ]}
                    />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Color</p>
                    <span className="w-5 h-5 rounded-full inline-block mt-1" style={{ backgroundColor: selected.color }} />
                  </div>
                </div>

                {selected.tech_stack.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Tech stack</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selected.tech_stack.map((t) => (
                        <Badge key={t} variant="default" size="sm">{t}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {selected.repository_url && (
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Repository</p>
                    <a
                      href={selected.repository_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-kv-400 text-sm hover:text-kv-300 break-all"
                    >
                      {selected.repository_url}
                    </a>
                  </div>
                )}

                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Tasks</p>
                  {loadingTasks ? (
                    <div className="space-y-2">
                      {[1,2,3].map((i) => <div key={i} className="h-8 rounded bg-white/5 animate-pulse" />)}
                    </div>
                  ) : projectTasks.length === 0 ? (
                    <p className="text-slate-500 text-sm">No tasks linked to this project.</p>
                  ) : (
                    <Accordion>
                      <AccordionItem value="tasks">
                        <AccordionTrigger>
                          {projectTasks.length} task{projectTasks.length !== 1 ? "s" : ""} · {projectTasks.filter((t) => t.status === "done").length} done
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2 pt-2">
                            {projectTasks.map((task) => (
                              <div key={task.id} className="flex items-center gap-2 text-sm">
                                <span className={`w-1.5 h-1.5 rounded-full ${task.status === "done" ? "bg-green-400" : task.status === "in_progress" ? "bg-kv-400" : "bg-slate-500"}`} />
                                <span className={task.status === "done" ? "text-slate-500 line-through" : "text-slate-300"}>
                                  {task.title}
                                </span>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  )}
                </div>
              </div>
            </DrawerBody>
            <DrawerFooter>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(selected.id)}
                className="text-red-400 hover:text-red-300"
              >
                Delete
              </Button>
              <Button variant="primary" size="sm" onClick={handleStatusUpdate}>
                Save Changes
              </Button>
            </DrawerFooter>
          </>
        )}
      </Drawer>
    </div>
  );
}
