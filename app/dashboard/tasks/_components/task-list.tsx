import { Card, CardContent } from "@kwyw/kayv-glass-ui";
import { SkeletonList } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { TaskRow } from "./task-row";
import type { Task, TaskStatus } from "@/lib/types";

type TaskListProps = {
  loading: boolean;
  tasks: Task[];
  /** Shown in place of the list when `tasks` is empty. */
  emptyLabel: string;
  projectName: (id: string | null) => string | null;
  onOpen: (task: Task) => void;
  onStatusChange: (task: Task, status: TaskStatus) => void;
};

export function TaskList({
  loading,
  tasks,
  emptyLabel,
  projectName,
  onOpen,
  onStatusChange,
}: TaskListProps) {
  return (
    <Card variant="elevated">
      <CardContent>
        {loading ? (
          <SkeletonList count={4} rowClassName="h-14" className="space-y-3 pt-4" />
        ) : tasks.length === 0 ? (
          <EmptyState>{emptyLabel}</EmptyState>
        ) : (
          <div className="space-y-2 pt-2">
            {tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                projectName={projectName(task.project_id)}
                onOpen={onOpen}
                onStatusChange={onStatusChange}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
