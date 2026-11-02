"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";

// Applies native-only chrome to match the dark glass UI. No-op on web. Runs
// once on mount.
//
// Only the icon style is set here. The status bar's background colour and
// whether it overlays the page are no longer controllable on Android 16
// (edge to edge is enforced); the layout steps inside the bars with
// env(safe-area-inset-*) instead, configured through the SystemBars plugin in
// capacitor.config.ts.
export function NativeInit() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    (async () => {
      try {
        const { StatusBar, Style } = await import("@capacitor/status-bar");
        // Dark style = light (white) text/icons, for our dark background.
        await StatusBar.setStyle({ style: Style.Dark });
      } catch {
        // StatusBar plugin unavailable — ignore.
      }
    })();
  }, []);

  return null;
}
