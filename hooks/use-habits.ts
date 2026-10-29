"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  createHabit,
  listHabitChecks,
  listHabits,
  setHabitDone,
  updateHabit,
  type HabitPatch,
} from "@/lib/api/habits";
import { addDays } from "@/lib/date";
import {
  DEFAULT_HABIT_EMOJI,
  STREAK_WINDOW_DAYS,
  activeHabits,
  canActivate,
} from "@/lib/habits";
import type { Habit, HabitCheck } from "@/lib/types";

// Remembers across visits whether this user has habits, so the Today page
// can lay out its summary tiles correctly before the first fetch returns
// instead of reflowing when the habits tile appears.
const EXPECT_KEY = "kayv:has-habits";

/**
 * The user's habits and their recent checks, with writers that update the
 * local copy first and the database second, so a tap on a chip answers at
 * once. A failed write puts the local copy back.
 */
export function useHabits(today: string) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [checks, setChecks] = useState<HabitCheck[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [expected, setExpected] = useState(false);
  // Habits with a write in flight; a second tap while one is pending is
  // dropped rather than racing the first (a delete could overtake an insert).
  const pending = useRef(new Set<string>());

  useEffect(() => {
    // localStorage only after mount: these pages are prerendered.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setExpected(window.localStorage.getItem(EXPECT_KEY) === "1");
    Promise.all([listHabits(), listHabitChecks(addDays(today, -STREAK_WINDOW_DAYS), today)]).then(
      ([habitRows, checkRows]) => {
        setHabits(habitRows);
        setChecks(checkRows);
        setLoaded(true);
        try {
          window.localStorage.setItem(EXPECT_KEY, activeHabits(habitRows).length > 0 ? "1" : "0");
        } catch {
          // Storage unavailable; the layout just settles after the fetch.
        }
      }
    );
  }, [today]);

  /** Flips a habit's done state for `date`. Ignored while a write for it is pending. */
  const toggle = useCallback(
    async (habitId: string, date: string) => {
      if (pending.current.has(habitId)) return;
      pending.current.add(habitId);
      try {
        const existing = checks.find((c) => c.habit_id === habitId && c.date === date);
        if (existing) {
          setChecks((prev) => prev.filter((c) => c !== existing));
          const { ok } = await setHabitDone(habitId, date, false);
          if (!ok) setChecks((prev) => [...prev, existing]);
          return;
        }
        // A placeholder row shows the tick immediately; the saved row replaces it.
        const placeholder = { id: `pending-${habitId}-${date}`, habit_id: habitId, date } as HabitCheck;
        setChecks((prev) => [...prev, placeholder]);
        const { ok, check } = await setHabitDone(habitId, date, true);
        setChecks((prev) =>
          ok && check
            ? prev.map((c) => (c === placeholder ? check : c))
            : prev.filter((c) => c !== placeholder)
        );
      } finally {
        pending.current.delete(habitId);
      }
    },
    [checks]
  );

  /** Adds a habit at the end of the chip row; refused at the active limit. */
  const addHabit = useCallback(
    async (name: string, emoji = DEFAULT_HABIT_EMOJI): Promise<boolean> => {
      if (!canActivate(habits)) return false;
      const position = habits.reduce((max, h) => Math.max(max, h.position), -1) + 1;
      const created = await createHabit(name, emoji, position);
      if (!created) return false;
      setHabits((prev) => [...prev, created]);
      return true;
    },
    [habits]
  );

  /**
   * Renames, re-emojis, or archives/restores a habit. Restoring is refused at
   * the active limit, the same rule the quick-add form follows.
   */
  const patchHabit = useCallback(
    async (id: string, patch: HabitPatch): Promise<boolean> => {
      if (patch.archived === false && !canActivate(habits)) return false;
      const updated = await updateHabit(id, patch);
      if (!updated) return false;
      setHabits((prev) => prev.map((h) => (h.id === id ? updated : h)));
      return true;
    },
    [habits]
  );

  /**
   * Writes positions so the active habits take the order of `ids`. Only rows
   * whose position changes are written, one after another; a failure stops
   * the sequence and leaves the earlier writes, which are each a valid order
   * on their own.
   */
  const reorder = useCallback(
    async (ids: string[]): Promise<boolean> => {
      const byId = new Map(habits.map((h) => [h.id, h]));
      for (const [index, id] of ids.entries()) {
        const habit = byId.get(id);
        if (!habit || habit.position === index) continue;
        const updated = await updateHabit(id, { position: index });
        if (!updated) return false;
        setHabits((prev) => prev.map((h) => (h.id === id ? updated : h)));
      }
      return true;
    },
    [habits]
  );

  return { habits, checks, loaded, expected, toggle, addHabit, patchHabit, reorder };
}
