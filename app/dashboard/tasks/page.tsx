"use client";

import { useEffect, useState } from "react";
import { Button, Tabs, TabList, Tab, TabPanels, TabPanel, toast } from "@kwyw/kayv-glass-ui";
import { createTask, deleteTask, listTasks, setTaskStatus, type NewTask } from "@/lib/api/tasks";
import { listProjectOptions } from "@/lib/api/projects";
import { TASK_STATUS_LABELS } from "@/lib/constants";
import {
  TASK_TABS,
  countByTab,
  emptyLabelForTab,
  filterByTab,
  projectNameById,
  type TaskTab,
} from "@/lib/tasks";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { TaskList } from "./_components/task-list";
import { CreateTaskModal } from "./_components/create-task-modal";
import { TaskDetailDrawer } from "./_components/task-detail-drawer";
import type { Project, Task, TaskStatus } from "@/lib/types";

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TaskTab>("all");
  const [showCreate, setShowCreate] = useState(false);

  // Detail drawer. `editStatus` lives here rather than in the drawer so the
  // pending edit isn't lost while the drawer animates in and out.
  const [selected, setSelected] = useState<Task | null>(null);
  const [editStatus, setEditStatus] = useState<TaskStatus>("todo");

  async function loadData() {
    const [taskRows, projectRows] = await Promise.all([listTasks(), listProjectOptions()]);
    setTasks(taskRows);
    setProjects(projectRows);
    setLoading(false);
  }

  useEffect(() => {
    // Fetch once on mount. State is only set after the awaited query resolves,
    // so this doesn't cause the cascading renders the rule guards against.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, []);

  function openDetail(task: Task) {
    setSelected(task);
    setEditStatus(task.status);
  }

  async function handleCreate(values: NewTask): Promise<boolean> {
    const created = await createTask(values);
    if (!created) return false;
    setTasks((prev) => [created, ...prev]);
    toast({ title: "Task created", variant: "success" });
    return true;
  }

  // Shared status writer used by both the inline row dropdown and the drawer.
  async function updateTaskStatus(id: string, status: TaskStatus): Promise<boolean> {
    const patch = await setTaskStatus(id, status);
    if (!patch) return false;
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    return true;
  }

  // Inline quick-move from a task row.
  async function handleQuickStatus(task: Task, status: TaskStatus) {
    if (status === task.status) return;
    if (await updateTaskStatus(task.id, status)) {
      toast({ title: `Moved to ${TASK_STATUS_LABELS[status]}`, variant: "success" });
    }
  }

  async function handleStatusUpdate() {
    if (!selected) return;
    if (await updateTaskStatus(selected.id, editStatus)) {
      setSelected(null);
      toast({ title: "Status updated", variant: "success" });
    }
  }

  async function handleDelete(id: string) {
    if (!(await deleteTask(id))) return;
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setSelected(null);
    toast({ title: "Task deleted", variant: "warning" });
  }

  const counts = countByTab(tasks);
  const projectName = (id: string | null) => projectNameById(projects, id);

  return (
    <PageContainer>
      <PageHeader
        breadcrumb={[{ label: "Today", href: "/dashboard" }, { label: "Tasks" }]}
        title="Tasks"
        subtitle={`${counts.all} total · ${counts.done} done`}
        actions={
          <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>
            + New Task
          </Button>
        }
      />

      <div className="relative">
        <Tabs value={activeTab} onChange={(v) => setActiveTab(v as TaskTab)}>
          <TabList className="scroll-x">
            {TASK_TABS.map(({ value, label }) => (
              <Tab key={value} value={value}>
                {label} ({counts[value]})
              </Tab>
            ))}
          </TabList>

          <TabPanels className="mt-4">
            {TASK_TABS.map(({ value }) => (
              <TabPanel key={value} value={value}>
                <TaskList
                  loading={loading}
                  tasks={filterByTab(tasks, value)}
                  emptyLabel={emptyLabelForTab(value)}
                  projectName={projectName}
                  onOpen={openDetail}
                  onStatusChange={handleQuickStatus}
                />
              </TabPanel>
            ))}
          </TabPanels>
        </Tabs>
      </div>

      <CreateTaskModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        projects={projects}
        onSubmit={handleCreate}
      />

      <TaskDetailDrawer
        task={selected}
        projectName={projectName(selected?.project_id ?? null)}
        status={editStatus}
        onStatusChange={setEditStatus}
        onClose={() => setSelected(null)}
        onSave={handleStatusUpdate}
        onDelete={handleDelete}
      />
    </PageContainer>
  );
}
