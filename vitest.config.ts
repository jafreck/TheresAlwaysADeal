import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  esbuild: {
    jsx: "automatic",
    jsxImportSource: "react",
  },
  resolve: {
    alias: {
      "@": resolve(__dir, "packages/web/src"),
    },
  },
  test: {
    passWithNoTests: true,
    projects: [
      {
        test: {
          include: [
            "packages/api/**/*.test.ts",
            "packages/db/**/*.test.ts",
            "packages/scraper/**/*.test.ts",
            "packages/worker/**/*.test.ts",
          ],
          environment: "node",
        },
      },
      {
        extends: true,
        test: {
          include: ["packages/web/**/*.test.{ts,tsx}"],
          environment: "jsdom",
        },
      },
    ],
  },
});
