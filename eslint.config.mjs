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
  ]),
  { ignores: ["out/**", ".next/**", "public/**"] },
  {
    files: ["src/posters/**/*.{ts,tsx}", "src/og/**/*.{ts,tsx}"],
    ignores: ["src/posters/rasterize.ts", "src/posters/**/*.test.{ts,tsx}"],
    rules: {
      "no-restricted-globals": ["error", "Date", "performance"],
      "no-restricted-properties": ["error", { object: "Math", property: "random" }],
      "no-restricted-imports": ["error", { patterns: ["next", "next/*", "*.css", "*.module.css"] }],
    },
  },
]);

export default eslintConfig;
