import js from "@eslint/js";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import prettier from "eslint-config-prettier";

/** @type {import("eslint").Linter.Config[]} */
const config = [
  js.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    plugins: { "@typescript-eslint": tsPlugin },
    languageOptions: { parser: tsParser },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      "no-undef": "off",
      "no-useless-assignment": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "@typescript-eslint/consistent-type-imports": "error",
    },
  },
  prettier,
  {
    ignores: ["**/node_modules/**", "**/dist/**", "**/.next/**", "**/coverage/**"],
  },
];

export default config;
