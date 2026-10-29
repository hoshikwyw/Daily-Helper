"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { listExpensesForYear } from "@/lib/api/expenses";
import { fromISODate } from "@/lib/date";
import type { Expense } from "@/lib/types";

/**
 * The money entries for one calendar year, kept current as `year` changes.
 *
 * Years already fetched this visit are cached, so hopping between tabs that
 * point at different years swaps instantly instead of re-downloading a whole
 * year and flashing skeletons. Empty results are not kept, so a year that came
 * back empty because of a network error is retried next time.
 *
 * Flipping a calendar across a year boundary and back fires two fetches in
 * quick succession, and the slower one can land last. Each request takes a
 * ticket; a response whose ticket is no longer current is thrown away, so the
 * screen never shows one year's entries under another year's calendar.
 */
export function useExpenseYear(year: number) {
  const [entries, setEntries] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  const cache = useRef(new Map<number, Expense[]>());
  const ticket = useRef(0);
  const inFlight = useRef(false);

  const load = useCallback(async (target: number) => {
    const mine = ++ticket.current;
    const cached = cache.current.get(target);
    if (cached) {
      inFlight.current = false;
      setEntries(cached);
      setLoading(false);
      return;
    }
    inFlight.current = true;
    setLoading(true);
    try {
      const rows = await listExpensesForYear(target);
      if (mine !== ticket.current) return;
      if (rows.length > 0) cache.current.set(target, rows);
      setEntries(rows);
    } finally {
      if (mine === ticket.current) {
        inFlight.current = false;
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    load(year);
  }, [year, load]);

  /** Shows a just-created entry without waiting for a refetch. */
  const addEntry = useCallback(
    (created: Expense) => {
      const createdYear = fromISODate(created.date).getFullYear();
      const cached = cache.current.get(createdYear);
      if (cached) cache.current.set(createdYear, [created, ...cached]);
      if (createdYear !== year) return;
      // A fetch that started before the insert would land without the new row
      // and wipe it from the list, so in that case fetch again instead.
      if (inFlight.current) {
        cache.current.delete(createdYear);
        load(createdYear);
      } else {
        setEntries((prev) => [created, ...prev]);
      }
    },
    [year, load]
  );

  const removeEntry = useCallback((id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    for (const [cachedYear, rows] of cache.current) {
      cache.current.set(cachedYear, rows.filter((e) => e.id !== id));
    }
  }, []);

  return { entries, loading, addEntry, removeEntry };
}
