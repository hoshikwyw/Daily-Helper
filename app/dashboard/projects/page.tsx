"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, Button, toast } from "@kwyw/kayv-glass-ui";
import { createProject, listProjects, type NewProject } from "@/lib/api/projects";
import { listProjectTaskCounts, type TaskCount } from "@/lib/api/tasks";
import {
  PROJECT_FILTERS,
  countByFilter,
  filterProjects,
  type ProjectFilter,
} from "@/lib/projects";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ProjectCard } from "./_components/project-card";
import { CreateProjectModal } from "./_components/create-project-modal";
import type { Project } from "@/lib/types";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [taskCounts, setTaskCounts] = useState<Record<string, TaskCount>>({});
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<ProjectFilter>("all");
  const [showCreate, setShowCreate] = useState(false);

  async function loadData() {
    const [projectRows, counts] = await Promise.all([listProjects(), listProjectTaskCounts()]);
    setProjects(projectRows);
    setTaskCounts(counts);
    setLoading(false);
  }

  useEffect(() => {
    // Fetch once on mount. State is only set after the awaited query resolves,
    // so this doesn't cause the cascading renders the rule guards against.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, []);

  async function handleCreate(values: NewProject): Promise<boolean> {
    const created = await createProject(values);
    if (!created) return false;
    setProjects((prev) => [created, ...prev]);
    toast({ title: "Project created!", variant: "success" });
    return true;
  }

  const counts = countByFilter(projects);
  const filtered = filterProjects(projects, activeFilter);

  return (
    <PageContainer>
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
        {PROJECT_FILTERS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setActiveFilter(value)}
            className={`px-3.5 py-2 rounded-full text-sm font-medium transition-colors ${
              activeFilter === value
                ? "bg-kv-500 text-white"
                : "bg-white/5 text-slate-400 hover:bg-white/10"
            }`}
          >
            {label} ({counts[value]})
          </button>
        ))}
      </div>

      <div className="relative grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))
        ) : filtered.length === 0 ? (
          <div className="col-span-full">
            <Card variant="elevated">
              <CardContent>
                <EmptyState>
                  {activeFilter === "all"
                    ? "No projects yet — create your first one!"
                    : `No ${activeFilter} projects.`}
                </EmptyState>
              </CardContent>
            </Card>
          </div>
        ) : (
          filtered.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              taskCount={taskCounts[project.id]}
            />
          ))
        )}
      </div>

      <CreateProjectModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={handleCreate}
      />
    </PageContainer>
  );
}
