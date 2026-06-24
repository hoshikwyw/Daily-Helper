import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.kayv.dashboard",
  appName: "Kayv",
  // Capacitor packages the Next.js static export (the `out/` folder) into the
  // native app. Regenerate it with `npm run build` before `npx cap sync`.
  webDir: "out",
};

export default config;
