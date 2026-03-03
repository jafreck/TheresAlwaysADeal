import { defineWorkspace } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineWorkspace([
  {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './packages/web/src'),
      },
    },
    esbuild: {
      jsx: 'automatic',
      jsxImportSource: 'react',
    },
    test: {
      name: 'web',
      include: ['packages/web/tests/**/*.test.{ts,tsx}'],
      environment: 'jsdom',
      passWithNoTests: true,
    },
  },
  {
    test: {
      name: 'non-web',
      include: [
        'packages/api/tests/**/*.test.{ts,tsx}',
        'packages/db/tests/**/*.test.{ts,tsx}',
        'packages/scraper/tests/**/*.test.{ts,tsx}',
        'packages/worker/tests/**/*.test.{ts,tsx}',
      ],
    },
  },
]);
