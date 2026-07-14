"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  Badge,
  Button,
  Input,
  Select,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Drawer,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  toast,
} from "@kwyw/kayv-glass-ui";
import { supabase } from "@/lib/supabase";
import { getUserId, reportError } from "@/lib/db";
import {
  TASK_PRIORITY_VARIANTS,
  TASK_STATUS_LABELS,
  TASK_STATUS_OPTIONS,
} from "@/lib/constants";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { NativeSelect } from "@/components/ui/native-select";
import { SkeletonList } from "@/components/ui/skeleton";
import type { Task, Project, TaskStatus, TaskPriority } from "@/lib/types";

// Per-status card colors (left accent stripe + subtle tint) for quick recognition.
const STATUS_ROW_STYLES: Record<TaskStatus, string> = {
  todo: "border-slate-500/60 bg-slate-500/5 hover:bg-slate-500/10",
  in_progress: "border-kv-500/70 bg-kv-500/10 hover:bg-kv-500/15",
  done: "border-green-500/60 bg-green-500/5 hover:bg-green-500/10",
};

const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

function EmptyState({ label }: { label: string }) {
  return <p className="text-slate-500 text-sm text-center py-10">{label}</p>;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPriority, setNewPriority] = useState<TaskPriority>("medium");
  const [newProject, setNewProject] = useState("");
  const [newDue, setNewDue] = useState("");
  const [saving, setSaving] = useState(false);

  // Detail drawer
  const [selected, setSelected] = useState<Task | null>(null);
  const [editStatus, setEditStatus] = useState<TaskStatus>("todo");

  async function loadData() {
    const [tasksRes, projectsRes] = await Promise.all([
      supabase.from("tasks").select("*").order("created_at", { ascending: false }),
      supabase.from("projects").select("id, name, color").order("name"),
    ]);
    if (tasksRes.data) setTasks(tasksRes.data);
    if (projectsRes.data) setProjects(projectsRes.data as Project[]);
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

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setSaving(true);
    const userId = await getUserId();
    if (!userId) { setSaving(false); return; }
    const { data, error } = await supabase
      .from("tasks")
      .insert({
        title: newTitle.trim(),
        description: newDesc.trim() || null,
        priority: newPriority,
        status: "todo",
        project_id: newProject || null,
        due_date: newDue || null,
        user_id: userId,
      })
      .select()
      .single();
    setSaving(false);
    if (error || !data) { reportError(error); return; }
    setTasks((prev) => [data, ...prev]);
    setShowCreate(false);
    setNewTitle("");
    setNewDesc("");
    setNewPriority("medium");
    setNewProject("");
    setNewDue("");
    toast({ title: "Task created", variant: "success" });
  }

  // Shared status writer used by both the inline row dropdown and the drawer.
  async function updateTaskStatus(id: string, status: TaskStatus): Promise<boolean> {
    const completed_at = status === "done" ? new Date().toISOString() : null;
    const { error } = await supabase
      .from("tasks")
      .update({ status, completed_at })
      .eq("id", id);
    if (reportError(error)) return false;
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status, completed_at } : t)));
    return true;
  }

  // Inline quick-move from a task row.
  async function handleQuickStatus(task: Task, status: TaskStatus) {
    if (status === task.status) return;
    const ok = await updateTaskStatus(task.id, status);
    if (ok) toast({ title: `Moved to ${TASK_STATUS_LABELS[status]}`, variant: "success" });
  }

  async function handleStatusUpdate() {
    if (!selected) return;
    const ok = await updateTaskStatus(selected.id, editStatus);
    if (ok) {
      setSelected(null);
      toast({ title: "Status updated", variant: "success" });
    }
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (!error) {
      setTasks((prev) => prev.filter((t) => t.id !== id));
      setSelected(null);
      toast({ title: "Task deleted", variant: "warning" });
    }
  }

  const doneCount = tasks.filter((t) => t.status === "done").length;
  const filtered = {
    all: tasks,
    todo: tasks.filter((t) => t.status === "todo"),
    in_progress: tasks.filter((t) => t.status === "in_progress"),
    done: tasks.filter((t) => t.status === "done"),
  }[activeTab] ?? tasks;

  const projectName = (id: string | null) => projects.find((p) => p.id === id)?.name ?? null;

  return (
    <PageContainer>
      <PageHeader
        breadcrumb={[{ label: "Today", href: "/dashboard" }, { label: "Tasks" }]}
        title="Tasks"
        subtitle={`${tasks.length} total · ${doneCount} done`}
        actions={
          <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>
            + New Task
          </Button>
        }
      />

      <div className="relative">
        <Tabs value={activeTab} onChange={setActiveTab}>
          <TabList>
            <Tab value="all">All ({tasks.length})</Tab>
            <Tab value="todo">To Do ({tasks.filter((t) => t.status === "todo").length})</Tab>
            <Tab value="in_progress">In Progress ({tasks.filter((t) => t.status === "in_progress").length})</Tab>
            <Tab value="done">Done ({doneCount})</Tab>
          </TabList>

          <TabPanels className="mt-4">
            {["all", "todo", "in_progress", "done"].map((tab) => (
              <TabPanel key={tab} value={tab}>
                <Card variant="elevated">
                  <CardContent>
                    {loading ? (
                      <SkeletonList count={4} rowClassName="h-14" className="space-y-3 pt-4" />
                    ) : filtered.length === 0 ? (
                      <EmptyState label={tab === "done" ? "No completed tasks yet." : "No tasks here. Add one!"} />
                    ) : (
                      <div className="space-y-2 pt-2">
                        {filtered.map((task) => (
                          <div
                            key={task.id}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg border-l-4 transition-colors ${STATUS_ROW_STYLES[task.status]}`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full shrink-0 ${
                                task.status === "done" ? "bg-green-400" :
                                task.status === "in_progress" ? "bg-kv-400" : "bg-slate-500"
                              }`}
                            />
                            <button
                              onClick={() => openDetail(task)}
                              className="flex-1 min-w-0 text-left"
                            >
                              <p className={`text-sm font-medium ${task.status === "done" ? "text-slate-500 line-through" : "text-slate-200"}`}>
                                {task.title}
                              </p>
                              {projectName(task.project_id) && (
                                <p className="text-xs text-slate-500 mt-0.5">{projectName(task.project_id)}</p>
                              )}
                            </button>
                            <div className="flex items-center gap-2 shrink-0">
                              {task.due_date && (
                                <span className="hidden sm:inline text-xs text-slate-500">{task.due_date}</span>
                              )}
                              <Badge variant={TASK_PRIORITY_VARIANTS[task.priority]} size="sm">
                                {task.priority}
                              </Badge>
                              {/* Inline status switcher — moves the task between columns */}
                              <NativeSelect
                                size="sm"
                                aria-label="Change status"
                                value={task.status}
                                onChange={(v) => handleQuickStatus(task, v as TaskStatus)}
                                options={TASK_STATUS_OPTIONS}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabPanel>
            ))}
          </TabPanels>
        </Tabs>
      </div>

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} size="md">
        <ModalHeader>New Task</ModalHeader>
        <form onSubmit={handleCreate}>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Title"
                placeholder="What needs to be done?"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
              />
              <Input
                label="Description"
                placeholder="Optional details..."
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-3">
                <NativeSelect
                  label="Priority"
                  value={newPriority}
                  onChange={(v) => setNewPriority(v as TaskPriority)}
                  options={PRIORITY_OPTIONS}
                />
                <NativeSelect
                  label="Project"
                  value={newProject}
                  onChange={setNewProject}
                  options={[
                    { value: "", label: "No project" },
                    ...projects.map((p) => ({ value: p.id, label: p.name })),
                  ]}
                />
              </div>
              <Input
                label="Due date"
                type="date"
                value={newDue}
                onChange={(e) => setNewDue(e.target.value)}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={() => setShowCreate(false)} type="button">Cancel</Button>
            <Button variant="primary" type="submit" disabled={saving}>
              {saving ? "Creating…" : "Create Task"}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Detail Drawer */}
      <Drawer open={!!selected} onClose={() => setSelected(null)} placement="right" size="md">
        {selected && (
          <>
            <DrawerHeader>{selected.title}</DrawerHeader>
            <DrawerBody>
              <div className="space-y-5">
                {selected.description && (
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Description</p>
                    <p className="text-slate-300 text-sm">{selected.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Priority</p>
                    <Badge variant={TASK_PRIORITY_VARIANTS[selected.priority]}>{selected.priority}</Badge>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Project</p>
                    <p className="text-slate-300 text-sm">{projectName(selected.project_id) ?? "—"}</p>
                  </div>
                  {selected.due_date && (
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Due</p>
                      <p className="text-slate-300 text-sm">{selected.due_date}</p>
                    </div>
                  )}
                  {selected.completed_at && (
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Completed</p>
                      <p className="text-slate-300 text-sm">{new Date(selected.completed_at).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Status</p>
                  <Select
                    value={editStatus}
                    onChange={(value) => setEditStatus(value as TaskStatus)}
                    options={TASK_STATUS_OPTIONS}
                  />
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
    </PageContainer>
  );
}
