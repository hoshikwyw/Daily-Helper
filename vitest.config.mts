import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Only the pure domain modules are covered. They are deliberately React-free
// and side-effect-free, so they need no DOM and run in plain node.
export default defineConfig({
  resolve: {
    alias: {
      // Mirrors the "@/*" path alias in tsconfig.json.
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts"],
  },
});
