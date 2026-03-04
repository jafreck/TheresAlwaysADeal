# Task Result: session-001 - Foundation: deps, design tokens, and lib modules

## Changes Made
- `packages/web/package.json`: Added `zustand`, `react-hook-form`, `recharts` to dependencies; added `@testing-library/react`, `@testing-library/jest-dom`, `jsdom` to devDependencies
- `packages/web/src/app/globals.css`: Added semantic color tokens (primary, background, surface, muted, success, warning, danger) and typography scale (heading, body, caption, label) to @theme block
- `packages/web/src/lib/utils.ts`: Created `cn` helper combining clsx and tailwind-merge
- `packages/web/src/lib/auth-store.ts`: Created Zustand auth store with accessToken, userProfile, setAccessToken, setUserProfile, and logout
- `packages/web/src/lib/api-client.ts`: Created typed fetch wrapper with automatic Bearer token, EnvelopeResponse/EnvelopeMeta types, and structured error handling
- `packages/web/src/lib/query-provider.tsx`: Created TanStack Query provider as a client component with sensible defaults (60s staleTime, 1 retry)
- `packages/web/next.config.ts`: Added Steam CDN, GOG, and Epic Games image domains to remotePatterns
- `packages/web/vitest.config.ts`: Added `@/*` path alias resolution and jsdom test environment

## Files Modified
- packages/web/package.json
- packages/web/src/app/globals.css
- packages/web/next.config.ts
- packages/web/vitest.config.ts

## Files Created
- packages/web/src/lib/utils.ts
- packages/web/src/lib/auth-store.ts
- packages/web/src/lib/api-client.ts
- packages/web/src/lib/query-provider.tsx

## Notes
- Added `/* eslint-disable no-undef */` to api-client.ts because the shared ESLint config enables `no-undef` for all files but doesn't configure Node/browser globals for TypeScript files. TypeScript itself handles undefined variable checking.
- All 8 existing tests pass and the Next.js production build succeeds.
