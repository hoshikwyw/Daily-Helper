"use client";

import { useState } from "react";
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
} from "@kwyw/kayv-glass-ui";
import { NativeSelect } from "@/components/ui/native-select";
import { RepeatPicker } from "@/components/ui/repeat-picker";
import { TASK_PRIORITY_OPTIONS } from "@/lib/constants";
import { todayISO } from "@/lib/date";
import type { NewTask } from "@/lib/api/tasks";
import type { Project, RecurrenceCadence, TaskPriority } from "@/lib/types";

type CreateTaskModalProps = {
  open: boolean;
  onClose: () => void;
  projects: Project[];
  /**
   * Persists the task, or sets up a repeating rule when `repeat` is given;
   * returns true on success. A repeating task always has a due date.
   */
  onSubmit: (values: NewTask, repeat: RecurrenceCadence | null) => Promise<boolean>;
};

export function CreateTaskModal({ open, onClose, projects, onSubmit }: CreateTaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [projectId, setProjectId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [repeat, setRepeat] = useState<RecurrenceCadence | null>(null);
  const [saving, setSaving] = useState(false);

  // A schedule needs a date to anchor on, so choosing a repeat without a due
  // date fills in today rather than silently picking one.
  function handleRepeatChange(next: RecurrenceCadence | null) {
    setRepeat(next);
    if (next && !dueDate) setDueDate(todayISO());
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    const ok = await onSubmit(
      {
        title: title.trim(),
        description: description.trim() || null,
        priority,
        status: "todo",
        project_id: projectId || null,
        due_date: dueDate || null,
      },
      repeat
    );
    setSaving(false);
    if (!ok) return;

    setTitle("");
    setDescription("");
    setPriority("medium");
    setProjectId("");
    setDueDate("");
    setRepeat(null);
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} size="md">
      <ModalHeader>New Task</ModalHeader>
      <form onSubmit={handleSubmit}>
        <ModalBody>
          <div className="space-y-4">
            <Input
              label="Title"
              placeholder="What needs to be done?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <Input
              label="Description"
              placeholder="Optional details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <NativeSelect
                label="Priority"
                value={priority}
                onChange={(v) => setPriority(v as TaskPriority)}
                options={TASK_PRIORITY_OPTIONS}
              />
              <NativeSelect
                label="Project"
                value={projectId}
                onChange={setProjectId}
                options={[
                  { value: "", label: "No project" },
                  ...projects.map((p) => ({ value: p.id, label: p.name })),
                ]}
              />
            </div>
            <Input
              label="Due date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
            <RepeatPicker
              value={repeat}
              onChange={handleRepeatChange}
              date={dueDate || todayISO()}
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={saving}>
            {saving ? "Saving…" : repeat ? "Set up repeat" : "Create Task"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
