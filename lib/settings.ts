// User preferences, persisted per-device in localStorage. Deliberately not in
// Supabase: this is a single-user app, the theme already persists this way, and
// keeping it local means the Capacitor builds work with no network round-trip.

export type Settings = {
  displayName: string;
  timezone: string;
  dailyReminders: boolean;
  weeklyReview: boolean;
  compactMode: boolean;
};

export const DEFAULT_SETTINGS: Settings = {
  displayName: "Kayv",
  timezone: "UTC+8",
  dailyReminders: false,
  weeklyReview: false,
  compactMode: false,
};

export const TIMEZONES = [
  { value: "UTC-8", label: "UTC-8 (PST)" },
  { value: "UTC-5", label: "UTC-5 (EST)" },
  { value: "UTC+0", label: "UTC+0 (GMT)" },
  { value: "UTC+1", label: "UTC+1 (CET)" },
  { value: "UTC+5:30", label: "UTC+5:30 (IST)" },
  { value: "UTC+8", label: "UTC+8 (SGT / HKT)" },
  { value: "UTC+9", label: "UTC+9 (JST)" },
];

const STORAGE_KEY = "kayv:settings";

/**
 * Reads stored settings, falling back to defaults. Safe to call on the server
 * (returns defaults) and safe against corrupt or partial stored JSON.
 */
export function loadSettings(): Settings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    // Spread over the defaults so a payload written by an older build can't
    // leave a newly-added field undefined.
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<Settings>) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Settings): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Storage disabled or full (private browsing) — preferences simply won't
    // survive a reload, which shouldn't break the page the user is on.
  }
}
