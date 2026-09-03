import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Capacitor's native projects. `cap sync` copies the minified web bundle
    // into them and Gradle generates more on top, none of it hand-written —
    // linting it buries real findings under thousands of warnings.
    "android/**",
    "ios/**",
  ]),
]);

export default eslintConfig;
