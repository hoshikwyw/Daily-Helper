import { Card, CardHeader, CardContent } from "@kwyw/kayv-glass-ui";
import type { HabitWeek } from "@/lib/review";
import { EmptyState } from "@/components/ui/empty-state";

export function HabitsReviewCard({ rows }: { rows: HabitWeek[] }) {
  return (
    <Card variant="elevated">
      <CardHeader title="Habits" description="Monday to Sunday" />
      <CardContent>
        {rows.length === 0 ? (
          <EmptyState padding="sm">No habits yet. Add some on the Today page.</EmptyState>
        ) : (
          <div className="space-y-3">
            {rows.map(({ habit, days, doneCount, streak }) => (
              <div key={habit.id} className="flex items-center gap-3">
                <span className="text-lg leading-none shrink-0" aria-hidden="true">
                  {habit.emoji}
                </span>
                <span
                  className={`text-sm w-24 sm:w-32 truncate shrink-0 ${
                    habit.archived ? "text-slate-500" : "text-slate-200"
                  }`}
                >
                  {habit.name}
                  {habit.archived && <span className="text-xs"> (archived)</span>}
                </span>
                <div className="flex items-center gap-1 flex-1" aria-label={`${doneCount} of 7 days`}>
                  {days.map((done, i) => (
                    <span
                      key={i}
                      className={`h-2.5 w-2.5 rounded-full ${done ? "bg-kv-400" : "bg-white/10"}`}
                    />
                  ))}
                </div>
                <span className="text-xs text-slate-400 tabular-nums shrink-0">{doneCount}/7</span>
                <span
                  className={`text-xs tabular-nums w-10 text-right shrink-0 ${
                    streak > 0 ? "text-amber-300" : "text-slate-600"
                  }`}
                >
                  {streak > 0 ? `🔥 ${streak}` : "—"}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
