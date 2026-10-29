"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Capacitor } from "@capacitor/core";
import { materializeRecurrences } from "@/lib/api/recurrences";
import { todayISO } from "@/lib/date";

type RecurrenceSyncValue = {
  /**
   * Goes up by one each time a sync created rows. Data hooks that cache or
   * fetch once on mount refetch when it changes, so rows the sync just
   * created show up without a reload.
   */
  version: number;
  /** Runs a sync right away, e.g. straight after a rule is created. */
  sync: () => Promise<void>;
};

const RecurrenceSyncContext = createContext<RecurrenceSyncValue>({
  version: 0,
  sync: async () => {},
});

export function useRecurrenceSync(): RecurrenceSyncValue {
  return useContext(RecurrenceSyncContext);
}

/**
 * Turns recurring rules into real rows at the moments that matter: once when
 * the dashboard opens, and again whenever the app comes back on a later day,
 * whether that is a browser tab shown again or the native app resuming.
 *
 * Sits inside the auth guard so it never runs signed out. It does not block
 * rendering; pages load as usual and refetch through `version` if the sync
 * created anything.
 */
export function RecurrenceSyncProvider({ children }: { children: React.ReactNode }) {
  const [version, setVersion] = useState(0);
  // The local date of the last completed run, so returning to the app on the
  // same day costs nothing.
  const lastRunDate = useRef<string | null>(null);
  const inFlight = useRef<Promise<void> | null>(null);

  const sync = useCallback(async (): Promise<void> => {
    // A run already going may predate the rule the caller just saved, so wait
    // for it and then run again rather than piggybacking on it.
    if (inFlight.current) await inFlight.current;
    const today = todayISO();
    inFlight.current = (async () => {
      try {
        const created = await materializeRecurrences(today);
        // A failed run (offline, say) is not "done for today": leave the date
        // unset so the next tab return or resume tries again.
        if (created === null) return;
        lastRunDate.current = today;
        if (created > 0) setVersion((v) => v + 1);
      } finally {
        inFlight.current = null;
      }
    })();
    return inFlight.current;
  }, []);

  useEffect(() => {
    sync();
  }, [sync]);

  useEffect(() => {
    const onReturn = () => {
      if (document.visibilityState !== "visible") return;
      if (lastRunDate.current !== todayISO()) sync();
    };
    document.addEventListener("visibilitychange", onReturn);

    // The native listener is registered after an awaited import. If the effect
    // is cleaned up before that resolves (Strict Mode's mount/unmount/mount,
    // or a real unmount), the listener must be dropped on arrival rather than
    // leaking and firing a second sync on every resume.
    let cancelled = false;
    let removeNative: (() => void) | undefined;
    if (Capacitor.isNativePlatform()) {
      (async () => {
        const { App } = await import("@capacitor/app");
        const listener = await App.addListener("resume", onReturn);
        if (cancelled) {
          listener.remove();
          return;
        }
        removeNative = () => {
          listener.remove();
        };
      })();
    }

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onReturn);
      removeNative?.();
    };
  }, [sync]);

  const value = useMemo(() => ({ version, sync }), [version, sync]);
  return <RecurrenceSyncContext.Provider value={value}>{children}</RecurrenceSyncContext.Provider>;
}
