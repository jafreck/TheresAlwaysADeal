import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  'packages/web/vitest.config.ts',
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
