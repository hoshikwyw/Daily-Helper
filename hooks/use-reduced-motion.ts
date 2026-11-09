"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void): () => void {
  const media = window.matchMedia(QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function getSnapshot(): boolean {
  return window.matchMedia(QUERY).matches;
}

/**
 * Whether the person has asked the OS for less motion. CSS animations are
 * already switched off by the media query in globals.css; this is for the
 * JavaScript side (confetti) so nothing moves that CSS does not control.
 * False during prerender, so the static HTML is the same for everyone.
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
