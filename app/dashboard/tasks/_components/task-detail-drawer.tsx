import {
  Drawer,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  Badge,
  Button,
  Select,
} from "@kwyw/kayv-glass-ui";
import { TASK_PRIORITY_VARIANTS, TASK_STATUS_OPTIONS } from "@/lib/constants";
import { formatDate } from "@/lib/date";
import { FieldLabel } from "@/components/ui/label";
import type { Task, TaskStatus } from "@/lib/types";

type TaskDetailDrawerProps = {
  /** The open task, or null when the drawer is closed. */
  task: Task | null;
  projectName: string | null;
  /** Pending status edit — owned by the page so it survives the drawer's unmount. */
  status: TaskStatus;
  onStatusChange: (status: TaskStatus) => void;
  onClose: () => void;
  onSave: () => void;
  onDelete: (id: string) => void;
};

export function TaskDetailDrawer({
  task,
  projectName,
  status,
  onStatusChange,
  onClose,
  onSave,
  onDelete,
}: TaskDetailDrawerProps) {
  return (
    <Drawer open={!!task} onClose={onClose} placement="right" size="md">
      {task && (
        <>
          <DrawerHeader>{task.title}</DrawerHeader>
          <DrawerBody>
            <div className="space-y-5">
              {task.description && (
                <div>
                  <FieldLabel mb="1">Description</FieldLabel>
                  <p className="text-slate-200 text-sm">{task.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel mb="1">Priority</FieldLabel>
                  <Badge variant={TASK_PRIORITY_VARIANTS[task.priority]}>{task.priority}</Badge>
                </div>
                <div>
                  <FieldLabel mb="1">Project</FieldLabel>
                  <p className="text-slate-200 text-sm">{projectName ?? "—"}</p>
                </div>
                {task.due_date && (
                  <div>
                    <FieldLabel mb="1">Due</FieldLabel>
                    <p className="text-slate-200 text-sm">{formatDate(task.due_date)}</p>
                  </div>
                )}
                {task.completed_at && (
                  <div>
                    <FieldLabel mb="1">Completed</FieldLabel>
                    <p className="text-slate-200 text-sm">{formatDate(task.completed_at)}</p>
                  </div>
                )}
              </div>

              <div>
                <FieldLabel>Status</FieldLabel>
                <Select
                  value={status}
                  onChange={(value) => onStatusChange(value as TaskStatus)}
                  options={TASK_STATUS_OPTIONS}
                />
              </div>
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
            <Button variant="primary" size="sm" onClick={onSave}>
              Save Changes
            </Button>
          </DrawerFooter>
        </>
      )}
    </Drawer>
  );
}
