import { Progress } from "@kwyw/kayv-glass-ui";
import { fmt } from "@/lib/expenses";
import type { BudgetProgress, BudgetStatus } from "@/lib/budgets";

export const BUDGET_BAR: Record<BudgetStatus, "success" | "warning" | "danger"> = {
  under: "success",
  near: "warning",
  over: "danger",
};

export const BUDGET_TEXT: Record<BudgetStatus, string> = {
  under: "text-slate-500",
  near: "text-amber-400",
  over: "text-rose-400",
};

/** "K 15,000 left" or "K 3,000 over", in the status colour. */
export function BudgetLeft({ budget }: { budget: BudgetProgress }) {
  return (
    <span className={`tabular-nums ${BUDGET_TEXT[budget.status]}`}>
      {budget.left >= 0 ? `${fmt(budget.left)} left` : `${fmt(budget.left)} over`}
    </span>
  );
}

/** The spent-of-limit bar; never drawn past full, the text carries the overrun. */
export function BudgetBar({ budget }: { budget: BudgetProgress }) {
  return <Progress value={Math.min(budget.pct, 100)} variant={BUDGET_BAR[budget.status]} size="sm" />;
}
