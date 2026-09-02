"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_SETTINGS,
  loadSettings,
  saveSettings,
  type Settings,
} from "@/lib/settings";

/**
 * Reads and writes the user's preferences.
 *
 * `loaded` is false for the first render: these pages are prerendered by the
 * static export, so localStorage can only be touched after mount — reading it
 * during render would desync hydration. Callers that seed form state from
 * `settings` should wait for `loaded`.
 */
export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSettings(loadSettings());
    setLoaded(true);
  }, []);

  const save = useCallback((next: Settings) => {
    setSettings(next);
    saveSettings(next);
  }, []);

  return { settings, save, loaded };
}
