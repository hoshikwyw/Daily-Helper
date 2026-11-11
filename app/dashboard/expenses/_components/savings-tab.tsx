import { Alert, Badge, Button, Card, CardContent, CardHeader, Progress } from "@kwyw/kayv-glass-ui";
import { fmt } from "@/lib/expenses";
import { formatDate } from "@/lib/date";
import { plural } from "@/lib/text";
import { LATEST_MIGRATION } from "@/lib/db";
import type { GoalProgress } from "@/lib/savings-goals";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonList } from "@/components/ui/skeleton";
import type { GoalsStatus } from "@/hooks/use-savings-goals";
import type { SavingsGoal } from "@/lib/types";

type SavingsTabProps = {
  status: GoalsStatus;
  /** Every goal with its progress, in display order. */
  goals: GoalProgress[];
  /** Everything set aside, with or without a goal. */
  totalSaved: number;
  /** Savings entries not attached to any goal. */
  unassigned: { amount: number; count: number };
  onNewGoal: () => void;
  onEditGoal: (goal: SavingsGoal) => void;
  onDeleteGoal: (goal: SavingsGoal) => void;
  /** Opens the entry form preset to a Savings expense toward this goal. */
  onContribute: (goal: SavingsGoal) => void;
};

/** What a goal needs next, in one line. */
function goalHint(p: GoalProgress): string {
  if (p.reached) return `Reached with ${plural(p.contributions, "entry", "entries")}. 🎉`;
  if (p.goal.deadline === null) return `${fmt(p.left)} to go.`;
  if (p.overdue) return `${fmt(p.left)} to go; the date was ${formatDate(p.goal.deadline)}.`;
  return `${fmt(p.perMonth ?? p.left)} a month for ${plural(p.monthsLeft ?? 1, "month", "months")} reaches it by ${formatDate(p.goal.deadline)}.`;
}

/**
 * Savings goals and how each is doing. A goal is fed by ordinary Savings
 * entries, so this tab adds nothing to the ledger that the other tabs do
 * not already show.
 */
export function SavingsTab({
  status,
  goals,
  totalSaved,
  unassigned,
  onNewGoal,
  onEditGoal,
  onDeleteGoal,
  onContribute,
}: SavingsTabProps) {
  const ready = status === "ready";
  return (
    <div className="mt-4 space-y-4">
      {status === "schema" && (
        <Alert variant="warning" title="The database needs updating">
          Run the files in supabase/migrations up to {LATEST_MIGRATION} in the Supabase SQL editor, then
          reload. Savings entries still count toward My World in the meantime.
        </Alert>
      )}
      {status === "error" && (
        <Alert variant="danger">Couldn&apos;t load your goals. Try again in a moment.</Alert>
      )}

      <Card variant="elevated">
        <CardHeader title="Set aside so far" description="Every entry in the Savings category, all time." />
        <CardContent>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-2xl font-semibold tabular-nums text-emerald-400">{fmt(totalSaved)}</p>
              <p className="text-xs text-slate-400">
                {unassigned.count > 0
                  ? `${fmt(unassigned.amount)} of it in ${plural(unassigned.count, "entry", "entries")} with no goal.`
                  : goals.length > 0
                    ? "All of it toward a goal."
                    : "Add a Money entry in the Savings category to grow this."}
              </p>
            </div>
            <Button variant="primary" size="sm" onClick={onNewGoal} disabled={!ready}>
              + New goal
            </Button>
          </div>
        </CardContent>
      </Card>

      {status === "loading" ? (
        <SkeletonList count={2} />
      ) : goals.length === 0 ? (
        ready && (
          <EmptyState padding="lg">
            No goals yet. Name something to save for and the Savings entries you add can count toward it.
          </EmptyState>
        )
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {goals.map((p) => (
            <Card key={p.goal.id} variant="elevated">
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span role="img" aria-hidden className="text-2xl leading-none">
                      {p.goal.emoji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-100 truncate">{p.goal.name}</p>
                      <p className="text-xs text-slate-400 tabular-nums">
                        {fmt(p.saved)} of {fmt(p.goal.target)}
                      </p>
                    </div>
                    {p.reached ? (
                      <Badge size="sm" variant="success">
                        Reached
                      </Badge>
                    ) : p.overdue ? (
                      <Badge size="sm" variant="warning">
                        Past date
                      </Badge>
                    ) : (
                      <Badge size="sm" variant="default">
                        {p.pct}%
                      </Badge>
                    )}
                  </div>
                  <Progress
                    value={p.pct}
                    size="sm"
                    variant={p.reached ? "success" : "primary"}
                    aria-label={`${p.goal.name}: ${p.pct}% saved`}
                  />
                  <p className="text-xs text-slate-400">{goalHint(p)}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    {!p.reached && (
                      <Button variant="secondary" size="sm" onClick={() => onContribute(p.goal)}>
                        + Add money
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => onEditGoal(p.goal)}>
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-auto text-slate-400 hover:text-red-400"
                      onClick={() => onDeleteGoal(p.goal)}
                      aria-label={`Delete ${p.goal.name}`}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
