"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";

// Applies native-only chrome (status bar) to match the dark glass UI. No-op on
// web. Runs once on mount.
export function NativeInit() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    (async () => {
      try {
        const { StatusBar, Style } = await import("@capacitor/status-bar");
        // Dark style = light (white) text/icons, for our dark background.
        await StatusBar.setStyle({ style: Style.Dark });
        if (Capacitor.getPlatform() === "android") {
          await StatusBar.setBackgroundColor({ color: "#0d0d1a" });
        }
      } catch {
        // StatusBar plugin unavailable — ignore.
      }
    })();
  }, []);

  return null;
}
