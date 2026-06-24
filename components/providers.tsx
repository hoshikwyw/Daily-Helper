"use client";

import { useEffect, useState } from "react";
import { ThemeProvider, Toaster } from "@kwyw/kayv-glass-ui";
import { DeepLinkHandler } from "@/components/deep-link-handler";
import { NativeInit } from "@/components/native-init";

// The library's ThemeProvider accesses localStorage and document.documentElement
// synchronously inside its useState initializer, which runs during SSR.
// Provide no-op shims so the library doesn't throw on the server.
if (typeof window === "undefined") {
  (global as Record<string, unknown>).localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
    key: () => null,
    length: 0,
  };
}

if (typeof document === "undefined") {
  const fakeStyle = {
    setProperty: () => {},
    removeProperty: () => {},
    getPropertyValue: () => "",
  };
  const fakeEl: Record<string, unknown> = {
    nodeType: 1, // Required by ReactDOM.createPortal validation
    style: fakeStyle,
    setAttribute: () => {},
    getAttribute: () => null,
    addEventListener: () => {},
    removeEventListener: () => {},
    querySelector: () => null,
    querySelectorAll: () => [],
    contains: () => false,
    appendChild: () => fakeEl,
    removeChild: () => {},
    insertBefore: () => fakeEl,
  };
  (global as Record<string, unknown>).document = {
    nodeType: 9,
    documentElement: fakeEl,
    body: fakeEl,
    head: fakeEl,
    activeElement: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    createElement: () => ({ ...fakeEl }),
    createTextNode: () => ({ nodeType: 3, data: "" }),
    getElementById: () => null,
    querySelector: () => null,
  };
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <ThemeProvider>
      {children}
      {/* Forwards native auth deep links to /auth/callback */}
      {mounted && <DeepLinkHandler />}
      {/* Applies native status-bar styling */}
      {mounted && <NativeInit />}
      {/* Toaster uses createPortal → needs real document; only render on client */}
      {mounted && <Toaster position="top-right" />}
    </ThemeProvider>
  );
}
