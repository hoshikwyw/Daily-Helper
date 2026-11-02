import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.kayv.dashboard",
  appName: "Kayv",
  // Capacitor packages the Next.js static export (the `out/` folder) into the
  // native app. Regenerate it with `npm run build` before `npx cap sync`.
  webDir: "out",
  plugins: {
    // Android 15+ draws the app edge to edge under the status and navigation
    // bars, and on Android 16 that can no longer be opted out of. Capacitor's
    // SystemBars plugin then makes `env(safe-area-inset-*)` report the real
    // bar sizes (the layout pads with those in globals.css and the shell).
    // The viewport hint matches app/layout.tsx so the first paint is right.
    SystemBars: {
      insetsHandling: "css",
      initialViewportFitValueHint: "cover",
      // Light icons on the dark background.
      style: "DARK",
    },
  },
};

export default config;
