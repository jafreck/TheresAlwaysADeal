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
    environmentMatchGlobs: [
      ["packages/web/**", "jsdom"],
    ],
  },
});
