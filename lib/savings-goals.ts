import { isSavingsEntry } from "@/lib/game";
import { fromISODate } from "@/lib/date";
import type { Expense, SavingsGoal } from "@/lib/types";

// Pure rules for savings goals. A goal's progress is the sum of the Savings
// entries linked to it; nothing is stored, so the ledger is the only truth.

/** The part of a money entry that matters here. */
export type SavingsEntry = Pick<Expense, "id" | "kind" | "amount" | "category" | "date" | "goal_id">;

export type GoalProgress = {
  goal: SavingsGoal;
  saved: number;
  /** Target minus saved; never below zero. */
  left: number;
  /** Saved as a share of the target, capped at 100 for a bar. */
  pct: number;
  reached: boolean;
  /** How many entries fed it. */
  contributions: number;
  /** Whole months from today to the deadline, at least 1; null without one or once reached. */
  monthsLeft: number | null;
  /** What each remaining month needs to put in; null without a deadline or once reached. */
  perMonth: number | null;
  /** The deadline has passed and the goal is short. */
  overdue: boolean;
};

/**
 * Months still available to save, counting the current month as one. A
 * deadline inside this month, or already past, leaves one month: the
 * question "how much per month" needs an answer that is not infinity.
 */
export function monthsUntil(todayISO: string, deadlineISO: string): number {
  const today = fromISODate(todayISO);
  const deadline = fromISODate(deadlineISO);
  const months =
    (deadline.getFullYear() - today.getFullYear()) * 12 + (deadline.getMonth() - today.getMonth()) + 1;
  return Math.max(1, months);
}

/** One goal against the entries that feed it. `entries` may be the full Savings list. */
export function goalProgress(goal: SavingsGoal, entries: SavingsEntry[], todayISO: string): GoalProgress {
  const mine = entries.filter((e) => e.goal_id === goal.id && isSavingsEntry(e));
  const saved = mine.reduce((sum, e) => sum + e.amount, 0);
  const left = Math.max(0, goal.target - saved);
  const reached = saved >= goal.target;
  const monthsLeft = goal.deadline && !reached ? monthsUntil(todayISO, goal.deadline) : null;
  return {
    goal,
    saved,
    left,
    pct: Math.min(100, Math.round((saved / goal.target) * 100)),
    reached,
    contributions: mine.length,
    monthsLeft,
    perMonth: monthsLeft === null ? null : Math.ceil(left / monthsLeft),
    overdue: !reached && goal.deadline !== null && goal.deadline < todayISO,
  };
}

/**
 * Every goal with its progress: open goals first, the nearest deadline
 * leading and undated ones after, then reached goals, newest first.
 */
export function goalsProgress(goals: SavingsGoal[], entries: SavingsEntry[], todayISO: string): GoalProgress[] {
  const all = goals.map((g) => goalProgress(g, entries, todayISO));
  const open = all
    .filter((p) => !p.reached)
    .sort((a, b) => {
      if (a.goal.deadline && b.goal.deadline) return a.goal.deadline.localeCompare(b.goal.deadline);
      if (a.goal.deadline) return -1;
      if (b.goal.deadline) return 1;
      return a.goal.created_at.localeCompare(b.goal.created_at);
    });
  const reached = all
    .filter((p) => p.reached)
    .sort((a, b) => b.goal.created_at.localeCompare(a.goal.created_at));
  return [...open, ...reached];
}

/** Savings set aside with no goal attached, plus the count of such entries. */
export function unassignedSavings(entries: SavingsEntry[]): { amount: number; count: number } {
  let amount = 0;
  let count = 0;
  for (const e of entries) {
    if (!isSavingsEntry(e) || e.goal_id !== null) continue;
    amount += e.amount;
    count += 1;
  }
  return { amount, count };
}

/** Everything saved, with or without a goal. */
export function totalSaved(entries: SavingsEntry[]): number {
  return entries.filter(isSavingsEntry).reduce((sum, e) => sum + e.amount, 0);
}

export const GOAL_NAME_MAX = 60;
export const DEFAULT_GOAL_EMOJI = "🎯";
