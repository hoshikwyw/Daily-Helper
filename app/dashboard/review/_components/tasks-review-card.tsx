import { Card, CardHeader, CardContent } from "@kwyw/kayv-glass-ui";
import { formatDate, toISODate } from "@/lib/date";
import { delta, type TaskReview } from "@/lib/review";
import { plural } from "@/lib/text";
import { EmptyState } from "@/components/ui/empty-state";
import { FieldLabel } from "@/components/ui/label";
import { DeltaBadge } from "./delta-badge";

export function TasksReviewCard({ review }: { review: TaskReview }) {
  return (
    <Card variant="elevated">
      <CardHeader title="Tasks" description={`${plural(review.done.length, "task")} finished`} />
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-white tabular-nums">{review.done.length}</span>
            <DeltaBadge delta={delta(review.done.length, review.previousDoneCount)} goodWhen="up" />
          </div>

          {review.done.length === 0 ? (
            <EmptyState padding="sm">Nothing finished this week.</EmptyState>
          ) : (
            <ul className="space-y-1.5">
              {review.done.map((task) => (
                <li key={task.id} className="flex items-center gap-3 text-sm">
                  <span className="text-emerald-400 shrink-0">✓</span>
                  <span className="text-slate-200 flex-1 min-w-0 truncate">{task.title}</span>
                  <span className="text-xs text-slate-500 shrink-0">
                    {formatDate(toISODate(new Date(task.completed_at ?? "")))}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {review.overdue.length > 0 && (
            <div>
              <FieldLabel>Still open</FieldLabel>
              <ul className="space-y-1.5">
                {review.overdue.map((task) => (
                  <li key={task.id} className="flex items-center gap-3 text-sm">
                    <span className="text-rose-400 shrink-0">!</span>
                    <span className="text-slate-300 flex-1 min-w-0 truncate">{task.title}</span>
                    <span className="text-xs text-rose-400/80 shrink-0">
                      due {formatDate(task.due_date ?? "")}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
