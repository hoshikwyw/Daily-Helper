import { describe, expect, it } from "vitest";
import {
  MAX_ACTIVE_HABITS,
  activeHabits,
  canActivate,
  checksByHabit,
  computeStreak,
  doneTodayCount,
  habitStatuses,
  reorderedIds,
} from "@/lib/habits";
import type { Habit, HabitCheck } from "@/lib/types";

function habit(id: string, name: string, position = 0, archived = false): Habit {
  return { id, name, position, archived } as Habit;
}

function check(habit_id: string, date: string): HabitCheck {
  return { habit_id, date } as HabitCheck;
}

describe("computeStreak", () => {
  const today = "2026-11-10";

  it("is zero with no checks", () => {
    expect(computeStreak([], today)).toEqual({ current: 0, best: 0 });
  });

  it("counts consecutive days ending today", () => {
    const dates = ["2026-11-08", "2026-11-09", "2026-11-10"];
    expect(computeStreak(dates, today)).toEqual({ current: 3, best: 3 });
  });

  it("keeps the streak alive while today is still unchecked", () => {
    const dates = ["2026-11-08", "2026-11-09"];
    expect(computeStreak(dates, today).current).toBe(2);
  });

  it("drops to zero once yesterday is also missing", () => {
    const dates = ["2026-11-06", "2026-11-07", "2026-11-08"];
    expect(computeStreak(dates, today).current).toBe(0);
    expect(computeStreak(dates, today).best).toBe(3);
  });

  it("spans a month boundary", () => {
    const dates = ["2026-10-30", "2026-10-31", "2026-11-01", "2026-11-02"];
    expect(computeStreak(dates, "2026-11-02")).toEqual({ current: 4, best: 4 });
  });

  it("remembers a longer earlier run as the best", () => {
    const dates = ["2026-11-01", "2026-11-02", "2026-11-03", "2026-11-04", "2026-11-09", "2026-11-10"];
    expect(computeStreak(dates, today)).toEqual({ current: 2, best: 4 });
  });

  it("ignores duplicate and unsorted dates", () => {
    const dates = ["2026-11-10", "2026-11-09", "2026-11-09", "2026-11-08"];
    expect(computeStreak(dates, today)).toEqual({ current: 3, best: 3 });
  });

  it("ignores future dates for both the current and the best streak", () => {
    const dates = ["2026-11-10", "2026-11-11", "2026-11-12"];
    expect(computeStreak(dates, today)).toEqual({ current: 1, best: 1 });
  });
});

describe("canActivate", () => {
  it("allows another habit until the limit, counting active ones only", () => {
    const atLimit = Array.from({ length: MAX_ACTIVE_HABITS }, (_, i) => habit(`h${i}`, `H${i}`, i));
    expect(canActivate(atLimit)).toBe(false);
    expect(canActivate([...atLimit.slice(1), habit("old", "Old", 9, true)])).toBe(true);
  });
});

describe("reorderedIds", () => {
  const habits = [habit("a", "A", 0), habit("b", "B", 1), habit("c", "C", 2), habit("z", "Z", 3, true)];

  it("swaps with the neighbour and leaves archived habits out", () => {
    expect(reorderedIds(habits, 1, 1)).toEqual(["a", "c", "b"]);
    expect(reorderedIds(habits, 1, -1)).toEqual(["b", "a", "c"]);
  });

  it("does nothing at the edges", () => {
    expect(reorderedIds(habits, 0, -1)).toEqual(["a", "b", "c"]);
    expect(reorderedIds(habits, 2, 1)).toEqual(["a", "b", "c"]);
  });

  it("still orders habits that share a position", () => {
    const messy = [habit("a", "A", 0), habit("b", "B", 0)];
    expect(reorderedIds(messy, 0, 1)).toEqual(["b", "a"]);
  });
});

describe("checksByHabit", () => {
  it("groups dates by habit", () => {
    const grouped = checksByHabit([check("a", "2026-11-01"), check("b", "2026-11-01"), check("a", "2026-11-02")]);
    expect(grouped).toEqual({ a: ["2026-11-01", "2026-11-02"], b: ["2026-11-01"] });
  });
});

describe("activeHabits", () => {
  it("drops archived habits and orders by position then name", () => {
    const habits = [
      habit("c", "Read", 2),
      habit("a", "Water", 0),
      habit("x", "Old", 1, true),
      habit("b", "Exercise", 1),
      habit("d", "Alpha", 1),
    ];
    expect(activeHabits(habits).map((h) => h.id)).toEqual(["a", "d", "b", "c"]);
  });
});

describe("habitStatuses and doneTodayCount", () => {
  const today = "2026-11-10";
  const habits = [habit("water", "Water", 0), habit("read", "Read", 1), habit("gone", "Gone", 2, true)];
  const checks = [
    check("water", "2026-11-09"),
    check("water", "2026-11-10"),
    check("read", "2026-11-08"),
    check("gone", "2026-11-10"),
  ];

  it("reports today's state and streak per active habit, in order", () => {
    const statuses = habitStatuses(habits, checks, today);
    expect(statuses.map((s) => s.habit.id)).toEqual(["water", "read"]);
    expect(statuses[0]).toMatchObject({ doneToday: true, streak: { current: 2, best: 2 } });
    expect(statuses[1]).toMatchObject({ doneToday: false, streak: { current: 0, best: 1 } });
  });

  it("counts only active habits done today", () => {
    expect(doneTodayCount(habitStatuses(habits, checks, today))).toBe(1);
  });
});
