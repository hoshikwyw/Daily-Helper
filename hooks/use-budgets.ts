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

  /** Sets a limit from the `YYYY-MM` month on; returns false when the write failed. */
  const saveBudget = useCallback(
    async (category: string, monthPrefix: string, amount: number): Promise<boolean> => {
      const saved = await setBudget(category, monthPrefix, amount);
      if (!saved) return false;
      setBudgets((prev) => [
        ...prev.filter((b) => !(b.category === category && b.month === saved.month)),
        saved,
      ]);
      return true;
    },
    []
  );

  return { budgets, saveBudget };
}
