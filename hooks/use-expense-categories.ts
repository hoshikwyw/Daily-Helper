"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createExpenseCategory,
  deleteExpenseCategory,
  listExpenseCategories,
} from "@/lib/api/expenses";
import { buildColorMap, mergeCategories } from "@/lib/expenses";
import type { CustomCategory, EntryKind } from "@/lib/types";

/**
 * The user's money categories: built-in plus custom, per ledger, with the
 * colour lookup every money view needs. Loads once per mount; the Today page
 * and the Money page both used to do this by hand.
 */
export function useExpenseCategories() {
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);

  useEffect(() => {
    listExpenseCategories().then(setCustomCategories);
  }, []);

  const allCategories = useMemo(() => mergeCategories(customCategories), [customCategories]);
  const colorMap = useMemo(() => buildColorMap(allCategories), [allCategories]);

  /** Persists a custom category and adds it to the list; null when the write failed. */
  const addCategory = useCallback(
    async (kind: EntryKind, name: string, color: string): Promise<CustomCategory | null> => {
      const created = await createExpenseCategory(kind, name, color);
      if (created) setCustomCategories((prev) => [...prev, created]);
      return created;
    },
    []
  );

  const removeCategory = useCallback(async (id: string): Promise<boolean> => {
    const ok = await deleteExpenseCategory(id);
    if (ok) setCustomCategories((prev) => prev.filter((c) => c.id !== id));
    return ok;
  }, []);

  return { customCategories, allCategories, colorMap, addCategory, removeCategory };
}
