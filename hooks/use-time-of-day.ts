"use client";

import { useSyncExternalStore } from "react";
import { timeOfDayAt, type TimeOfDay } from "@/lib/scene";

// Re-checks once a minute and whenever the tab comes back into view, so a
// room left open through the evening goes dark on time and a phone app
// resumed in the morning wakes the sprout up.
function subscribe(onChange: () => void): () => void {
  const timer = window.setInterval(onChange, 60_000);
  document.addEventListener("visibilitychange", onChange);
  return () => {
    window.clearInterval(timer);
    document.removeEventListener("visibilitychange", onChange);
  };
}

function getSnapshot(): TimeOfDay {
  return timeOfDayAt(new Date());
}

/** "day" or "night" for the scene, kept current while the page is open. */
export function useTimeOfDay(): TimeOfDay {
  // Prerendered HTML says "day"; the client corrects it on hydration.
  return useSyncExternalStore(subscribe, getSnapshot, () => "day");
}
