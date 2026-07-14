"use client";

import { useEffect, useState } from "react";
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
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Tooltip,
  ConfettiButton,
  toast,
} from "@kwyw/kayv-glass-ui";
import { supabase } from "@/lib/supabase";
import { getUserId, reportError } from "@/lib/db";
import { PROJECT_COLORS, PROJECT_STATUS_VARIANTS } from "@/lib/constants";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { ColorPicker } from "@/components/ui/color-picker";
import { Skeleton } from "@/components/ui/skeleton";
import type { Project, ProjectStatus } from "@/lib/types";

type TaskCount = { total: number; done: number };

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [taskCounts, setTaskCounts] = useState<Record<string, TaskCount>>({});
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<"all" | ProjectStatus>("all");

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newColor, setNewColor] = useState<string>(PROJECT_COLORS[0]);
  const [newTech, setNewTech] = useState("");
  const [newRepo, setNewRepo] = useState("");
  const [saving, setSaving] = useState(false);

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
        const counts: Record<string, TaskCount> = {};
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
    // Fetch once on mount. State is only set after the awaited query resolves,
    // so this doesn't cause the cascading renders the rule guards against.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setSaving(true);
    const userId = await getUserId();
    if (!userId) { setSaving(false); return; }
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
        user_id: userId,
      })
      .select()
      .single();
    setSaving(false);
    if (error || !data) { reportError(error); return; }
    setProjects((prev) => [data, ...prev]);
    setShowCreate(false);
    setNewName("");
    setNewDesc("");
    setNewColor(PROJECT_COLORS[0]);
    setNewTech("");
    setNewRepo("");
    toast({ title: "Project created!", variant: "success" });
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
    <PageContainer squares={[[2, 2], [5, 1], [7, 4]]}>
      <PageHeader
        breadcrumb={[{ label: "Today", href: "/dashboard" }, { label: "Projects" }]}
        title="Projects"
        subtitle={`${counts.active} active · ${counts.completed} completed`}
        actions={
          <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>
            + New Project
          </Button>
        }
      />

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
            <Skeleton key={i} className="h-48 rounded-xl" />
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
                    <Badge variant={PROJECT_STATUS_VARIANTS[project.status]} size="sm">
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
                  <Link href={`/dashboard/project?id=${project.id}`}>
                    <Button variant="ghost" size="sm">
                      View details →
                    </Button>
                  </Link>
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
              <ColorPicker
                label="Color"
                colors={PROJECT_COLORS}
                value={newColor}
                onChange={setNewColor}
              />
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
    </PageContainer>
  );
}
