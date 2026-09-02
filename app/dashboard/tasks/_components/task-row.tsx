import { Badge } from "@kwyw/kayv-glass-ui";
import {
  TASK_PRIORITY_VARIANTS,
  TASK_STATUS_DOTS,
  TASK_STATUS_OPTIONS,
  TASK_STATUS_ROW_STYLES,
} from "@/lib/constants";
import { formatDate } from "@/lib/date";
import { NativeSelect } from "@/components/ui/native-select";
import type { Task, TaskStatus } from "@/lib/types";

type TaskRowProps = {
  task: Task;
  /** Display name of the task's project, or null when unassigned. */
  projectName: string | null;
  onOpen: (task: Task) => void;
  onStatusChange: (task: Task, status: TaskStatus) => void;
};

export function TaskRow({ task, projectName, onOpen, onStatusChange }: TaskRowProps) {
  const done = task.status === "done";

  return (
    <div
      className={`w-full flex items-center gap-3 p-3 rounded-lg border-l-4 transition-colors ${TASK_STATUS_ROW_STYLES[task.status]}`}
    >
      <span className={`w-2 h-2 rounded-full shrink-0 ${TASK_STATUS_DOTS[task.status]}`} />

      <button onClick={() => onOpen(task)} className="flex-1 min-w-0 text-left">
        <p
          className={`text-sm font-medium ${done ? "text-slate-500 line-through" : "text-slate-200"}`}
        >
          {task.title}
        </p>
        {projectName && <p className="text-xs text-slate-500 mt-0.5">{projectName}</p>}
      </button>

      <div className="flex items-center gap-2 shrink-0">
        {task.due_date && (
          <span className="hidden sm:inline text-xs text-slate-500">
            {formatDate(task.due_date)}
          </span>
        )}
        <Badge variant={TASK_PRIORITY_VARIANTS[task.priority]} size="sm">
          {task.priority}
        </Badge>
        {/* Inline status switcher — moves the task between tabs without opening it */}
        <NativeSelect
          size="sm"
          aria-label="Change status"
          value={task.status}
          onChange={(v) => onStatusChange(task, v as TaskStatus)}
          options={TASK_STATUS_OPTIONS}
        />
      </div>
    </div>
  );
}
