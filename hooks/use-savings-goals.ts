"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createGoal,
  deleteGoal,
  listGoals,
  listSavingsEntries,
  updateGoal,
  type NewGoal,
} from "@/lib/api/savings-goals";
import type { SavingsEntry } from "@/lib/savings-goals";
import type { SavingsGoal } from "@/lib/types";

export type GoalsStatus = "loading" | "ready" | "schema" | "error";

/**
 * The person's savings goals and every Savings entry that could feed them.
 * The Money page calls `refresh` after it writes an entry, since a
 * contribution is just an entry with a goal attached; it resolves to the
 * fresh entry list so the caller can compare before and after.
 */
export function useSavingsGoals() {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [entries, setEntries] = useState<SavingsEntry[]>([]);
  const [status, setStatus] = useState<GoalsStatus>("loading");

  const refresh = useCallback(async (): Promise<SavingsEntry[]> => {
    const [result, rows] = await Promise.all([listGoals(), listSavingsEntries()]);
    setEntries(rows);
    if (result.ok) setGoals(result.goals);
    setStatus(result.ok ? "ready" : result.reason);
    return rows;
  }, []);

  useEffect(() => {
    // State is set only after the queries resolve.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);

  const addGoal = useCallback(async (input: NewGoal): Promise<boolean> => {
    const created = await createGoal(input);
    if (!created) return false;
    setGoals((prev) => [...prev, created]);
    return true;
  }, []);

  const editGoal = useCallback(async (id: string, patch: Partial<NewGoal>): Promise<boolean> => {
    const saved = await updateGoal(id, patch);
    if (!saved) return false;
    setGoals((prev) => prev.map((g) => (g.id === id ? saved : g)));
    return true;
  }, []);

  const removeGoal = useCallback(async (id: string): Promise<boolean> => {
    if (!(await deleteGoal(id))) return false;
    setGoals((prev) => prev.filter((g) => g.id !== id));
    // The database unlinks the entries; mirror that without a refetch.
    setEntries((prev) => prev.map((e) => (e.goal_id === id ? { ...e, goal_id: null } : e)));
    return true;
  }, []);

  return { goals, entries, status, refresh, addGoal, editGoal, removeGoal };
}
