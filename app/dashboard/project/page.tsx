"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Breadcrumb, toast } from "@kwyw/kayv-glass-ui";
import { deleteProject, getProject, updateProject } from "@/lib/api/projects";
import { listTasksByProject } from "@/lib/api/tasks";
import {
  draftFromProject,
  draftToUpdate,
  isDraftDirty,
  type ProjectDraft,
} from "@/lib/projects";
import { PageContainer } from "@/components/ui/page-container";
import { PageLoader } from "@/components/ui/page-loader";
import { ProjectHeader } from "./_components/project-header";
import { ProjectOverviewCard } from "./_components/project-overview-card";
import { ProjectTasksCard } from "./_components/project-tasks-card";
import { ProjectNotesCard } from "./_components/project-notes-card";
import { ProjectProgressCard } from "./_components/project-progress-card";
import {
  ProjectDetailSkeleton,
  ProjectNotFound,
} from "./_components/project-detail-states";
import type { Project, Task } from "@/lib/types";

function ProjectDetail() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  // One draft object rather than a state hook per editable field.
  const [draft, setDraft] = useState<ProjectDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function load() {
      if (!id) {
        setLoading(false);
        return;
      }

      const proj = await getProject(id);
      if (!proj) {
        setLoading(false);
        return;
      }

      setProject(proj);
      setDraft(draftFromProject(proj));
      setTasks(await listTasksByProject(id));
      setLoading(false);
    }
    load();
  }, [id]);

  function patchDraft(patch: Partial<ProjectDraft>) {
    setDraft((prev) => (prev ? { ...prev, ...patch } : prev));
  }

  async function handleSave() {
    if (!project || !draft) return;
    if (!draft.name.trim()) {
      toast({ title: "Name can't be empty", variant: "warning" });
      return;
    }
    setSaving(true);
    const updates = draftToUpdate(draft);
    const ok = await updateProject(project.id, updates);
    setSaving(false);
    if (!ok) return;
    setProject({ ...project, ...updates });
    toast({
      title: draft.status === "completed" ? "Project completed! 🎉" : "Changes saved",
      variant: "success",
    });
  }

  async function handleDelete() {
    if (!project) return;
    setDeleting(true);
    if (!(await deleteProject(project.id))) {
      setDeleting(false);
      return;
    }
    toast({ title: "Project deleted", variant: "warning" });
    router.push("/dashboard/projects");
  }

  const done = tasks.filter((t) => t.status === "done").length;

  return (
    <PageContainer squares={[[2, 2], [5, 1], [7, 4]]}>
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
        <ProjectDetailSkeleton />
      ) : !project || !draft ? (
        <ProjectNotFound />
      ) : (
        <div className="relative space-y-6">
          <ProjectHeader
            project={project}
            color={draft.color}
            done={done}
            total={tasks.length}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2 space-y-6">
              <ProjectOverviewCard
                draft={draft}
                onChange={patchDraft}
                savedRepositoryUrl={project.repository_url}
              />
              <ProjectTasksCard tasks={tasks} done={done} />
              <ProjectNotesCard
                notes={draft.notes}
                onNotesChange={(notes) => patchDraft({ notes })}
                dirty={isDraftDirty(project, draft)}
                saving={saving}
                deleting={deleting}
                onSave={handleSave}
                onDelete={handleDelete}
              />
            </div>

            <div className="lg:sticky lg:top-6 space-y-6">
              <ProjectProgressCard project={project} done={done} total={tasks.length} />
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}

export default function ProjectDetailPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <ProjectDetail />
    </Suspense>
  );
}
