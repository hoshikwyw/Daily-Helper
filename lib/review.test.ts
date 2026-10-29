import { describe, expect, it } from "vitest";
import {
  gatherHighlights,
  inWeek,
  lastCompletedWeek,
  nextWeek,
  previousWeek,
  reviewHabits,
  reviewMoney,
  reviewMood,
  reviewTasks,
  summarizeWeek,
  weekDays,
  weekOf,
} from "@/lib/review";
import { delta } from "@/lib/progress";
import type { EntryKind, Expense, Habit, HabitCheck, JournalEntry, Mood, Task } from "@/lib/types";

// 2026-11-04 is a Wednesday; its week is Mon 2 Nov to Sun 8 Nov.
const WEEK = { from: "2026-11-02", to: "2026-11-08" };

describe("week ranges", () => {
  it("runs Monday to Sunday around any day of the week", () => {
    expect(weekOf("2026-11-04")).toEqual(WEEK);
    expect(weekOf("2026-11-02")).toEqual(WEEK);
    expect(weekOf("2026-11-08")).toEqual(WEEK);
  });

  it("spans a month boundary", () => {
    expect(weekOf("2026-10-31")).toEqual({ from: "2026-10-26", to: "2026-11-01" });
  });

  it("steps back and forward by whole weeks", () => {
    expect(previousWeek(WEEK)).toEqual({ from: "2026-10-26", to: "2026-11-01" });
    expect(nextWeek(WEEK)).toEqual({ from: "2026-11-09", to: "2026-11-15" });
  });

  it("opens on the week before today's, even on a Sunday", () => {
    expect(lastCompletedWeek("2026-11-10")).toEqual(WEEK);
    expect(lastCompletedWeek("2026-11-15")).toEqual({ from: "2026-11-02", to: "2026-11-08" });
  });

  it("lists the seven days and tests membership inclusively", () => {
    const days = weekDays(WEEK);
    expect(days).toHaveLength(7);
    expect(days[0]).toBe("2026-11-02");
    expect(days[6]).toBe("2026-11-08");
    expect(inWeek("2026-11-08", WEEK)).toBe(true);
    expect(inWeek("2026-11-09", WEEK)).toBe(false);
    expect(inWeek(null, WEEK)).toBe(false);
  });
});

function task(id: string, status: Task["status"], completed_at: string | null, due_date: string | null = null): Task {
  return { id, title: id, status, completed_at, due_date } as Task;
}

describe("reviewTasks", () => {
  const tasks = [
    task("a", "done", "2026-11-03T10:00:00"),
    task("b", "done", "2026-11-07T22:30:00"),
    task("c", "done", "2026-10-30T09:00:00"),
    task("d", "todo", null, "2026-11-06"),
    task("e", "in_progress", null, "2026-11-20"),
    task("f", "todo", null, "2026-10-01"),
  ];

  it("counts tasks finished in the week and the week before", () => {
    const review = reviewTasks(tasks, WEEK, "2026-11-10");
    expect(review.done.map((t) => t.id)).toEqual(["a", "b"]);
    expect(review.previousDoneCount).toBe(1);
  });

  it("lists open tasks due by the end of a past week, oldest first", () => {
    expect(reviewTasks(tasks, WEEK, "2026-11-10").overdue.map((t) => t.id)).toEqual(["f", "d"]);
  });

  it("does not call a task late before its day, in the week in progress", () => {
    // Viewing the current week on Wednesday the 4th: "d" is due Friday the 6th.
    expect(reviewTasks(tasks, WEEK, "2026-11-04").overdue.map((t) => t.id)).toEqual(["f"]);
  });
});

function entry(date: string, mood: Mood | null, highlights: string[] = []): JournalEntry {
  return { date, mood, highlights } as JournalEntry;
}

describe("reviewMood", () => {
  it("gives one tile per day and names the most common mood", () => {
    const review = reviewMood(
      [entry("2026-11-02", "good"), entry("2026-11-03", "okay"), entry("2026-11-05", "good")],
      WEEK
    );
    expect(review.days).toHaveLength(7);
    expect(review.days[0]).toEqual({ date: "2026-11-02", mood: "good" });
    expect(review.days[2]).toEqual({ date: "2026-11-04", mood: null });
    expect(review.mostCommon).toBe("good");
    expect(review.logged).toBe(3);
  });

  it("breaks a tie toward the better mood", () => {
    const review = reviewMood([entry("2026-11-02", "bad"), entry("2026-11-03", "great")], WEEK);
    expect(review.mostCommon).toBe("great");
  });

  it("is empty for a week without moods", () => {
    const review = reviewMood([entry("2026-11-02", null)], WEEK);
    expect(review.mostCommon).toBeNull();
    expect(review.logged).toBe(0);
  });
});

describe("reviewHabits", () => {
  const habits = [{ id: "w", name: "Water", position: 0, archived: false } as Habit];
  const checks = ["2026-11-02", "2026-11-03", "2026-11-05", "2026-11-09", "2026-11-10"].map(
    (date) => ({ habit_id: "w", date }) as HabitCheck
  );

  it("marks the week's days and counts them", () => {
    const [row] = reviewHabits(habits, checks, WEEK, "2026-11-10");
    expect(row.days).toEqual([true, true, false, true, false, false, false]);
    expect(row.doneCount).toBe(3);
  });

  it("reports the streak as of today, not the week shown", () => {
    const [row] = reviewHabits(habits, checks, WEEK, "2026-11-10");
    expect(row.streak).toBe(2);
  });

  it("keeps an archived habit's row for a week it was still done", () => {
    const reading = { id: "r", name: "Read", position: 1, archived: true } as Habit;
    const withArchived = [...habits, reading];
    const rows = reviewHabits(
      withArchived,
      [...checks, { habit_id: "r", date: "2026-11-04" } as HabitCheck],
      WEEK,
      "2026-11-20"
    );
    expect(rows.map((r) => r.habit.id)).toEqual(["w", "r"]);
    // ...but not for a week it was not.
    expect(reviewHabits(withArchived, checks, WEEK, "2026-11-20").map((r) => r.habit.id)).toEqual(["w"]);
  });
});

function expense(kind: EntryKind, amount: number, category: string, date: string): Expense {
  return { kind, amount, category, date } as Expense;
}

describe("reviewMoney", () => {
  const entries = [
    expense("expense", 50_000, "Food & Drink", "2026-11-03"),
    expense("expense", 20_000, "Transport", "2026-11-04"),
    expense("expense", 30_000, "Food & Drink", "2026-11-08"),
    expense("income", 500_000, "Salary", "2026-11-05"),
    expense("expense", 70_000, "Shopping", "2026-10-28"),
    expense("expense", 10_000, "Food & Drink", "2026-11-09"),
  ];

  it("totals the week and the week before", () => {
    const review = reviewMoney(entries, WEEK);
    expect(review.totals).toEqual({ income: 500_000, expense: 100_000, net: 400_000 });
    expect(review.previousTotals.expense).toBe(70_000);
  });

  it("ranks the week's spending categories", () => {
    expect(reviewMoney(entries, WEEK).topCategories.map((c) => c.category)).toEqual([
      "Food & Drink",
      "Transport",
    ]);
  });
});

describe("gatherHighlights", () => {
  it("collects non-empty highlight lines in date order", () => {
    const highlights = gatherHighlights(
      [
        entry("2026-11-05", null, ["Ran 5k", " "]),
        entry("2026-11-02", null, ["Shipped the calendar"]),
        entry("2026-11-12", null, ["Next week"]),
      ],
      WEEK
    );
    expect(highlights).toEqual([
      { date: "2026-11-02", text: "Shipped the calendar" },
      { date: "2026-11-05", text: "Ran 5k" },
    ]);
  });
});

describe("delta and summarizeWeek", () => {
  it("reports the direction of change", () => {
    expect(delta(6, 4)).toEqual({ diff: 2, direction: "up" });
    expect(delta(3, 5)).toEqual({ diff: -2, direction: "down" });
    expect(delta(2, 2)).toEqual({ diff: 0, direction: "same" });
  });

  it("joins the parts that have something to say", () => {
    const tasks = reviewTasks([task("a", "done", "2026-11-03T10:00:00")], WEEK, "2026-11-10");
    const mood = reviewMood([entry("2026-11-02", "good")], WEEK);
    const money = reviewMoney([expense("expense", 240_000, "Food & Drink", "2026-11-03")], WEEK);
    expect(summarizeWeek(tasks, mood, money)).toBe("1 task done · mood mostly good · spent K 240,000");
  });

  it("nudges instead when the week is empty", () => {
    expect(
      summarizeWeek(reviewTasks([], WEEK, "2026-11-10"), reviewMood([], WEEK), reviewMoney([], WEEK))
    ).toBe(
      "Nothing logged this week."
    );
  });
});
