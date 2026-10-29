"use client";

import { useCallback, useEffect, useState } from "react";
import { listBudgets, setBudget } from "@/lib/api/budgets";
import type { Budget } from "@/lib/types";

/**
 * The user's budget rows, loaded once per mount, with a setter that writes
 * through and keeps the local list in step. Pair with `effectiveBudgets` and
 * `budgetProgress` from lib/budgets.ts to get a month's figures.
 */
export function useBudgets() {
  const [budgets, setBudgets] = useState<Budget[]>([]);

  useEffect(() => {
    listBudgets().then(setBudgets);
  }, []);

  /** Sets a limit from `month` on; returns false when the write failed. */
  const saveBudget = useCallback(
    async (category: string, month: string, amount: number): Promise<boolean> => {
      const saved = await setBudget(category, month, amount);
      if (!saved) return false;
      setBudgets((prev) => [
        ...prev.filter((b) => !(b.category === category && b.month === month)),
        saved,
      ]);
      return true;
    },
    []
  );

  return { budgets, saveBudget };
}
