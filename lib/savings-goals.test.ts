import { describe, expect, it } from "vitest";
import {
  goalProgress,
  goalsProgress,
  monthsUntil,
  totalSaved,
  unassignedSavings,
  type SavingsEntry,
} from "@/lib/savings-goals";
import type { SavingsGoal } from "@/lib/types";

const TODAY = "2026-11-10";

function goal(patch: Partial<SavingsGoal> = {}): SavingsGoal {
  return {
    id: "g1",
    user_id: "u",
    name: "Laptop",
    emoji: "💻",
    target: 1000,
    deadline: null,
    created_at: "2026-10-01T00:00:00Z",
    updated_at: "2026-10-01T00:00:00Z",
    ...patch,
  };
}

let seq = 0;
function entry(patch: Partial<SavingsEntry> = {}): SavingsEntry {
  return {
    id: `e${++seq}`,
    kind: "expense",
    amount: 100,
    category: "Savings",
    date: "2026-11-01",
    goal_id: "g1",
    ...patch,
  };
}

describe("monthsUntil", () => {
  it("counts this month as one and never goes below one", () => {
    expect(monthsUntil(TODAY, "2026-11-30")).toBe(1);
    expect(monthsUntil(TODAY, "2026-12-01")).toBe(2);
    expect(monthsUntil(TODAY, "2027-04-15")).toBe(6);
    expect(monthsUntil(TODAY, "2026-01-01")).toBe(1);
  });
});

describe("goalProgress", () => {
  it("sums only the Savings expenses linked to the goal", () => {
    const entries = [
      entry({ amount: 300 }),
      entry({ amount: 200 }),
      entry({ amount: 999, goal_id: "other" }),
      entry({ amount: 999, goal_id: null }),
      entry({ amount: 999, kind: "income" }),
      entry({ amount: 999, category: "Food & Drink" }),
    ];
    const p = goalProgress(goal(), entries, TODAY);
    expect(p.saved).toBe(500);
    expect(p.left).toBe(500);
    expect(p.pct).toBe(50);
    expect(p.contributions).toBe(2);
    expect(p.reached).toBe(false);
    expect(p.monthsLeft).toBeNull();
    expect(p.perMonth).toBeNull();
    expect(p.overdue).toBe(false);
  });

  it("caps the bar and stops asking for money once reached", () => {
    const p = goalProgress(goal({ deadline: "2027-01-31" }), [entry({ amount: 1200 })], TODAY);
    expect(p.reached).toBe(true);
    expect(p.pct).toBe(100);
    expect(p.left).toBe(0);
    expect(p.monthsLeft).toBeNull();
    expect(p.perMonth).toBeNull();
    expect(p.overdue).toBe(false);
  });

  it("works out what each remaining month needs", () => {
    // 1000 target, 100 saved, deadline in 3 months counting this one: 300 a month.
    const p = goalProgress(goal({ deadline: "2027-01-15" }), [entry({ amount: 100 })], TODAY);
    expect(p.monthsLeft).toBe(3);
    expect(p.perMonth).toBe(300);
  });

  it("flags a missed deadline but still asks for the rest this month", () => {
    const p = goalProgress(goal({ deadline: "2026-10-01" }), [entry({ amount: 400 })], TODAY);
    expect(p.overdue).toBe(true);
    expect(p.monthsLeft).toBe(1);
    expect(p.perMonth).toBe(600);
  });
});

describe("goalsProgress", () => {
  it("puts open goals by nearest deadline first, undated next, reached last", () => {
    const goals = [
      goal({ id: "done", name: "Done", target: 10, created_at: "2026-01-01T00:00:00Z" }),
      goal({ id: "late", name: "Late", deadline: "2027-06-01", created_at: "2026-02-01T00:00:00Z" }),
      goal({ id: "none", name: "None", created_at: "2026-03-01T00:00:00Z" }),
      goal({ id: "soon", name: "Soon", deadline: "2026-12-01", created_at: "2026-04-01T00:00:00Z" }),
    ];
    const entries = [entry({ goal_id: "done", amount: 10 })];
    expect(goalsProgress(goals, entries, TODAY).map((p) => p.goal.id)).toEqual(["soon", "late", "none", "done"]);
  });
});

describe("unassignedSavings and totalSaved", () => {
  it("separates savings with no goal from the whole", () => {
    const entries = [
      entry({ amount: 50, goal_id: null }),
      entry({ amount: 25, goal_id: null }),
      entry({ amount: 300 }),
      entry({ amount: 999, goal_id: null, kind: "income" }),
    ];
    expect(unassignedSavings(entries)).toEqual({ amount: 75, count: 2 });
    expect(totalSaved(entries)).toBe(375);
  });
});
