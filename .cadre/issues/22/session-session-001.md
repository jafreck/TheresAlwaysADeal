# Session: session-001 - Foundation: deps, design tokens, and lib modules

**Rationale:** All subsequent sessions depend on the design tokens, utility functions, auth store, API client, and TanStack Query provider created here. Grouping them ensures consistent foundation.
**Dependencies:** none

## Steps

### session-001-step-001: Install new dependencies
**Description:** Add zustand, react-hook-form, and recharts to packages/web/package.json dependencies. These are required by downstream lib modules and components.
**Files:** packages/web/package.json
**Complexity:** simple
**Acceptance Criteria:**
- `zustand` is listed in `dependencies` in packages/web/package.json
- `react-hook-form` is listed in `dependencies`
- `recharts` is listed in `dependencies`
- `@testing-library/react` and `@testing-library/jest-dom` and `jsdom` are listed in `devDependencies`
- `pnpm install` completes without errors from the monorepo root

### session-001-step-002: Define design-system color palette and typography scale
**Description:** Expand packages/web/src/app/globals.css with semantic color tokens (primary, background, surface, muted, success, warning, danger) and a typography scale (heading, body, caption, label) inside the @theme block.
**Files:** packages/web/src/app/globals.css
**Complexity:** moderate
**Acceptance Criteria:**
- globals.css @theme block defines --color-primary, --color-background, --color-surface, --color-muted, --color-success, --color-warning, --color-danger tokens (with light/dark variants as needed)
- Typography scale tokens are defined for heading (font-size, font-weight), body, caption, and label
- Existing brand-50, brand-500, brand-900 tokens are preserved
- Body still applies bg and text color via Tailwind utility classes

### session-001-step-003: Create cn utility helper
**Description:** Create packages/web/src/lib/utils.ts exporting a `cn` helper that combines clsx and tailwind-merge for conditional className merging, as required by shadcn/ui pattern.
**Files:** packages/web/src/lib/utils.ts
**Complexity:** simple
**Acceptance Criteria:**
- `cn` function is exported from `packages/web/src/lib/utils.ts`
- `cn` accepts variadic ClassValue arguments and returns a merged string
- Uses `clsx` and `tailwind-merge` (both already in package.json)

### session-001-step-004: Create Zustand auth store
**Description:** Create packages/web/src/lib/auth-store.ts with a Zustand store holding accessToken (string | null) and userProfile (object | null), with setAccessToken, setUserProfile, and logout actions.
**Files:** packages/web/src/lib/auth-store.ts
**Complexity:** moderate
**Acceptance Criteria:**
- `useAuthStore` hook is exported from `packages/web/src/lib/auth-store.ts`
- Store shape includes `accessToken: string | null` and `userProfile: UserProfile | null`
- Store exposes `setAccessToken`, `setUserProfile`, and `logout` actions
- `logout` resets both accessToken and userProfile to null

### session-001-step-005: Create typed API client
**Description:** Create packages/web/src/lib/api-client.ts with a typed fetch wrapper that reads the access token from the auth store and attaches it as an Authorization bearer header. Define TypeScript interfaces mirroring EnvelopeResponse<T> and EnvelopeMeta from the API.
**Files:** packages/web/src/lib/api-client.ts
**Complexity:** moderate
**Acceptance Criteria:**
- `apiClient` is exported with typed `get`, `post`, `put`, `delete` methods
- Each method automatically attaches `Authorization: Bearer <token>` header when an access token exists in the auth store
- `EnvelopeResponse<T>` and `EnvelopeMeta` TypeScript interfaces are exported matching the API's response shape
- Base URL is configurable via `NEXT_PUBLIC_API_URL` environment variable
- Methods throw or return structured errors for non-2xx responses

### session-001-step-006: Create TanStack Query provider
**Description:** Create packages/web/src/lib/query-provider.tsx as a client component wrapping children in QueryClientProvider with a default QueryClient configured with sensible defaults (staleTime, retry).
**Files:** packages/web/src/lib/query-provider.tsx
**Complexity:** simple
**Acceptance Criteria:**
- `QueryProvider` is exported as a 'use client' component from `packages/web/src/lib/query-provider.tsx`
- It wraps children in `@tanstack/react-query`'s `QueryClientProvider`
- QueryClient is created with default options (e.g., staleTime of 60s, retry of 1)
- QueryClient is created outside the component or with useState to avoid re-creation on re-renders

### session-001-step-007: Add image domains to next.config.ts
**Description:** Add Steam CDN (steamcdn-a.akamaihd.net, cdn.akamai.steamstatic.com), GOG (images.gog-statics.com), and Epic (cdn1.epicgames.com) to the images.remotePatterns array in next.config.ts.
**Files:** packages/web/next.config.ts
**Complexity:** simple
**Acceptance Criteria:**
- remotePatterns includes patterns for Steam CDN, GOG, and Epic Games image domains
- Existing Amazon, BestBuy, Walmart patterns are preserved

### session-001-step-008: Update vitest config for path aliases and jsdom
**Description:** Update packages/web/vitest.config.ts to resolve the @/* path alias and set the test environment to jsdom for component testing.
**Files:** packages/web/vitest.config.ts
**Complexity:** simple
**Acceptance Criteria:**
- vitest.config.ts resolves `@/*` to `./src/*`
- Test environment is set to `jsdom`
- Existing config options (passWithNoTests, esbuild jsx) are preserved