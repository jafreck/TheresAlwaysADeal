import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'react',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'packages/web/src'),
    },
  },
  test: {
    environment: 'jsdom',
    include: [
      'packages/*/tests/**/*.test.{ts,tsx}',
    ],
  },
});
