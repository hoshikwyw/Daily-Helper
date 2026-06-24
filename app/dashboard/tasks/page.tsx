"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
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
  Breadcrumb,
  GridPattern,
  GradientBackground,
  toast,
} from "@kwyw/kayv-glass-ui";
import { createClient } from "@/lib/supabase";

const supabase = createClient();
import type { Task, Project, TaskStatus, TaskPriority } from "@/lib/types";

const PRIORITY_VARIANTS: Record<TaskPriority, "danger" | "warning" | "primary" | "default"> = {
  urgent: "danger",
  high: "warning",
  medium: "primary",
  low: "default",
};

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  done: "Done",
};

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
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openDetail(task: Task) {
    setSelected(task);
    setEditStatus(task.status);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }
    const { data, error } = await supabase
      .from("tasks")
      .insert({
        title: newTitle.trim(),
        description: newDesc.trim() || null,
        priority: newPriority,
        status: "todo",
        project_id: newProject || null,
        due_date: newDue || null,
        user_id: user.id,
      })
      .select()
      .single();
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "danger" });
    } else {
      setTasks((prev) => [data as Task, ...prev]);
      setShowCreate(false);
      setNewTitle("");
      setNewDesc("");
      setNewPriority("medium");
      setNewProject("");
      setNewDue("");
      toast({ title: "Task created", variant: "success" });
    }
  }

  async function handleStatusUpdate() {
    if (!selected) return;
    const { error } = await supabase
      .from("tasks")
      .update({
        status: editStatus,
        completed_at: editStatus === "done" ? new Date().toISOString() : null,
      })
      .eq("id", selected.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "danger" });
    } else {
      setTasks((prev) => prev.map((t) => (t.id === selected.id ? { ...t, status: editStatus } : t)));
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

  const filtered = {
    all: tasks,
    todo: tasks.filter((t) => t.status === "todo"),
    in_progress: tasks.filter((t) => t.status === "in_progress"),
    done: tasks.filter((t) => t.status === "done"),
  }[activeTab] ?? tasks;

  const projectName = (id: string | null) => projects.find((p) => p.id === id)?.name ?? null;

  return (
    <div className="relative min-h-screen p-4 sm:p-6 space-y-6">
      <GradientBackground fixed={false} />
      <GridPattern
        className="absolute inset-0 opacity-5 [mask-image:radial-gradient(ellipse_at_top,white_20%,transparent_70%)]"
        squares={[[2,1],[5,3],[8,2]]}
      />

      <div className="relative">
        <Breadcrumb items={[{ label: "Today", href: "/dashboard" }, { label: "Tasks" }]} />
      </div>

      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Tasks</h1>
          <p className="text-slate-400 text-sm mt-1">{tasks.length} total · {tasks.filter((t) => t.status === "done").length} done</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>
          + New Task
        </Button>
      </div>

      <div className="relative">
        <Tabs value={activeTab} onChange={setActiveTab}>
          <TabList>
            <Tab value="all">All ({tasks.length})</Tab>
            <Tab value="todo">To Do ({tasks.filter((t) => t.status === "todo").length})</Tab>
            <Tab value="in_progress">In Progress ({tasks.filter((t) => t.status === "in_progress").length})</Tab>
            <Tab value="done">Done ({tasks.filter((t) => t.status === "done").length})</Tab>
          </TabList>

          <TabPanels>
            {["all", "todo", "in_progress", "done"].map((tab) => (
              <TabPanel key={tab} value={tab}>
                <Card variant="elevated">
                  <CardContent>
                    {loading ? (
                      <div className="space-y-3 pt-4">
                        {[1,2,3,4].map((i) => (
                          <div key={i} className="h-14 rounded-lg bg-white/5 animate-pulse" />
                        ))}
                      </div>
                    ) : filtered.length === 0 ? (
                      <EmptyState label={tab === "done" ? "No completed tasks yet." : "No tasks here. Add one!"} />
                    ) : (
                      <div className="space-y-2 pt-2">
                        {filtered.map((task) => (
                          <button
                            key={task.id}
                            onClick={() => openDetail(task)}
                            className="w-full flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-left"
                          >
                            <span
                              className={`w-2 h-2 rounded-full shrink-0 ${
                                task.status === "done" ? "bg-green-400" :
                                task.status === "in_progress" ? "bg-kv-400" : "bg-slate-500"
                              }`}
                            />
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium ${task.status === "done" ? "text-slate-500 line-through" : "text-slate-200"}`}>
                                {task.title}
                              </p>
                              {projectName(task.project_id) && (
                                <p className="text-xs text-slate-500 mt-0.5">{projectName(task.project_id)}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {task.due_date && (
                                <span className="text-xs text-slate-500">{task.due_date}</span>
                              )}
                              <Badge variant={PRIORITY_VARIANTS[task.priority]} size="sm">
                                {task.priority}
                              </Badge>
                            </div>
                          </button>
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
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
                    className="w-full px-3 py-2.5 rounded-lg bg-white/10 border border-white/10 text-slate-200 text-sm focus:outline-none focus:border-white/30 transition-colors"
                  >
                    <option value="low" className="bg-[#0f172a]">Low</option>
                    <option value="medium" className="bg-[#0f172a]">Medium</option>
                    <option value="high" className="bg-[#0f172a]">High</option>
                    <option value="urgent" className="bg-[#0f172a]">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Project</label>
                  <select
                    value={newProject}
                    onChange={(e) => setNewProject(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-white/10 border border-white/10 text-slate-200 text-sm focus:outline-none focus:border-white/30 transition-colors"
                  >
                    <option value="" className="bg-[#0f172a]">No project</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id} className="bg-[#0f172a]">{p.name}</option>
                    ))}
                  </select>
                </div>
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
                    <Badge variant={PRIORITY_VARIANTS[selected.priority]}>{selected.priority}</Badge>
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
                    options={[
                      { value: "todo", label: STATUS_LABELS.todo },
                      { value: "in_progress", label: STATUS_LABELS.in_progress },
                      { value: "done", label: STATUS_LABELS.done },
                    ]}
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
    </div>
  );
}
