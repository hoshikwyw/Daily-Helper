import {
  Drawer,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  Button,
  Input,
} from "@kwyw/kayv-glass-ui";
import { TASK_PRIORITY_OPTIONS, TASK_STATUS_OPTIONS } from "@/lib/constants";
import { formatDate } from "@/lib/date";
import type { TaskDraft } from "@/lib/tasks";
import { NativeSelect } from "@/components/ui/native-select";
import { FieldLabel } from "@/components/ui/label";
import type { Project, Task, TaskPriority, TaskStatus } from "@/lib/types";

type TaskDetailDrawerProps = {
  /** The open task, or null when the drawer is closed. */
  task: Task | null;
  projects: Project[];
  /** Pending edits — owned by the page so they survive the drawer's unmount. */
  draft: TaskDraft;
  onChange: (patch: Partial<TaskDraft>) => void;
  /** True when the draft differs from the task; drives the Save button. */
  dirty: boolean;
  saving: boolean;
  onClose: () => void;
  onSave: () => void;
  onDelete: (id: string) => void;
};

/** Every field of a task, editable in place. Save writes only what changed. */
export function TaskDetailDrawer({
  task,
  projects,
  draft,
  onChange,
  dirty,
  saving,
  onClose,
  onSave,
  onDelete,
}: TaskDetailDrawerProps) {
  return (
    <Drawer open={!!task} onClose={onClose} placement="right" size="md">
      {task && (
        <>
          <DrawerHeader>Edit task</DrawerHeader>
          <DrawerBody>
            <div className="space-y-4">
              <Input
                label="Title"
                value={draft.title}
                onChange={(e) => onChange({ title: e.target.value })}
                required
              />
              <Input
                label="Description"
                placeholder="Optional details..."
                value={draft.description}
                onChange={(e) => onChange({ description: e.target.value })}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <NativeSelect
                  label="Priority"
                  value={draft.priority}
                  onChange={(v) => onChange({ priority: v as TaskPriority })}
                  options={TASK_PRIORITY_OPTIONS}
                />
                <NativeSelect
                  label="Project"
                  value={draft.project_id}
                  onChange={(v) => onChange({ project_id: v })}
                  options={[
                    { value: "", label: "No project" },
                    ...projects.map((p) => ({ value: p.id, label: p.name })),
                  ]}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Due date"
                  type="date"
                  value={draft.due_date}
                  onChange={(e) => onChange({ due_date: e.target.value })}
                />
                <NativeSelect
                  label="Status"
                  value={draft.status}
                  onChange={(v) => onChange({ status: v as TaskStatus })}
                  options={TASK_STATUS_OPTIONS}
                />
              </div>

              {task.completed_at && (
                <div>
                  <FieldLabel mb="1">Completed</FieldLabel>
                  <p className="text-slate-200 text-sm">{formatDate(task.completed_at)}</p>
                </div>
              )}
              {task.recurrence_id && (
                <p className="text-xs text-slate-500">
                  ⟳ Created by a repeating rule. Changes here apply to this task only.
                </p>
              )}
            </div>
          </DrawerBody>
          <DrawerFooter>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(task.id)}
              className="text-red-400 hover:text-red-300"
            >
              Delete
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={onSave}
              disabled={!dirty || saving || !draft.title.trim()}
            >
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </DrawerFooter>
        </>
      )}
    </Drawer>
  );
}
