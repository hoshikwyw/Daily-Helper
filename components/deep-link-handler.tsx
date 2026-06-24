"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Capacitor } from "@capacitor/core";

// On native, listens for incoming custom-scheme deep links (e.g.
// kayv://auth/callback?code=...&next=/update-password) and forwards the query
// to the in-app /auth/callback page, which completes the Supabase exchange.
export function DeepLinkHandler() {
  const router = useRouter();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let cleanup: (() => void) | undefined;

    (async () => {
      const { App } = await import("@capacitor/app");
      const listener = await App.addListener("appUrlOpen", ({ url }) => {
        try {
          const parsed = new URL(url);
          const query = parsed.search; // includes leading "?" with code/next
          router.replace(`/auth/callback${query}`);
        } catch {
          // Not a URL we can parse — ignore.
        }
      });
      cleanup = () => {
        listener.remove();
      };
    })();

    return () => cleanup?.();
  }, [router]);

  return null;
}
