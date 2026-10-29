"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createHabit,
  listHabitChecks,
  listHabits,
  setHabitDone,
  updateHabit,
  type HabitPatch,
} from "@/lib/api/habits";
import { addDays } from "@/lib/date";
import { DEFAULT_HABIT_EMOJI, STREAK_WINDOW_DAYS } from "@/lib/habits";
import type { Habit, HabitCheck } from "@/lib/types";

/**
 * The user's habits and their recent checks, with writers that update the
 * local copy first and the database second, so a tap on a chip answers at
 * once. A failed write puts the local copy back.
 */
export function useHabits(today: string) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [checks, setChecks] = useState<HabitCheck[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([listHabits(), listHabitChecks(addDays(today, -STREAK_WINDOW_DAYS), today)]).then(
      ([habitRows, checkRows]) => {
        setHabits(habitRows);
        setChecks(checkRows);
        setLoaded(true);
      }
    );
  }, [today]);

  /** Flips a habit's done state for `date`. */
  const toggle = useCallback(
    async (habitId: string, date: string) => {
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
        ok && check ? prev.map((c) => (c === placeholder ? check : c)) : prev.filter((c) => c !== placeholder)
      );
    },
    [checks]
  );

  /** Adds a habit at the end of the chip row. */
  const addHabit = useCallback(
    async (name: string, emoji = DEFAULT_HABIT_EMOJI): Promise<boolean> => {
      const position = habits.reduce((max, h) => Math.max(max, h.position), -1) + 1;
      const created = await createHabit(name, emoji, position);
      if (!created) return false;
      setHabits((prev) => [...prev, created]);
      return true;
    },
    [habits]
  );

  /** Renames, re-emojis, reorders, or archives/restores a habit. */
  const patchHabit = useCallback(async (id: string, patch: HabitPatch): Promise<boolean> => {
    const updated = await updateHabit(id, patch);
    if (!updated) return false;
    setHabits((prev) => prev.map((h) => (h.id === id ? updated : h)));
    return true;
  }, []);

  return { habits, checks, loaded, toggle, addHabit, patchHabit };
}
