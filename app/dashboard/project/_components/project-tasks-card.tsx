import { Card, CardHeader, CardContent } from "@kwyw/kayv-glass-ui";
import { TASK_STATUS_DOTS } from "@/lib/constants";
import { PROJECT_TASK_GROUPS } from "@/lib/projects";
import { formatDate } from "@/lib/date";
import { FieldLabel } from "@/components/ui/label";
import type { Task } from "@/lib/types";

type ProjectTasksCardProps = {
  tasks: Task[];
  done: number;
};

export function ProjectTasksCard({ tasks, done }: ProjectTasksCardProps) {
  const total = tasks.length;

  return (
    <Card variant="elevated">
      <CardHeader
        title="Tasks"
        description={
          total === 0
            ? "No tasks linked yet"
            : `${total} task${total !== 1 ? "s" : ""} · ${done} done`
        }
      />
      <CardContent>
        {total === 0 ? (
          <p className="text-slate-400 text-sm">
            No tasks linked to this project. Assign a project when creating a task to see it
            here.
          </p>
        ) : (
          <div className="space-y-5">
            {PROJECT_TASK_GROUPS.map(({ status, label }) => {
              const groupTasks = tasks.filter((t) => t.status === status);
              if (groupTasks.length === 0) return null;

              return (
                <div key={status}>
                  <FieldLabel>
                    {label} ({groupTasks.length})
                  </FieldLabel>
                  <div className="space-y-1.5">
                    {groupTasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white/5 text-sm"
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${TASK_STATUS_DOTS[status]}`}
                        />
                        <span
                          className={
                            status === "done" ? "text-slate-400 line-through" : "text-slate-200"
                          }
                        >
                          {task.title}
                        </span>
                        {task.due_date && (
                          <span className="ml-auto text-xs text-slate-400">
                            {formatDate(task.due_date)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
