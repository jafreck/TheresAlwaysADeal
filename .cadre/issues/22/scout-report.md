# Scout Report

## Relevant Files

| File | Reason |
|------|--------|
| `packages/web/package.json` | Must add new dependencies: zustand, react-hook-form, recharts, shadcn/ui CLI tooling |
| `packages/web/src/app/globals.css` | Design-system color palette and typography scale tokens must be added |
| `packages/web/src/app/layout.tsx` | Root layout must be expanded with sticky header, footer, TanStack Query provider, ad slot placeholders, SEO meta/JSON-LD |
| `packages/web/src/app/page.tsx` | Homepage must be updated to use new shared components and layout |
| `packages/web/next.config.ts` | Image domain additions for game store header images (Steam, GOG, Epic, etc.) |
| `packages/web/tsconfig.json` | Verify `@/*` path alias is correct for new lib/components directories |
| `packages/web/src/components/BuyButton.tsx` | Existing skeleton must be enhanced with styling, accessibility, and referral URL integration |
| `packages/web/src/components/GameCard.tsx` | New shared component: cover image, title, best price badge, discount badge |
| `packages/web/src/components/PriceBadge.tsx` | New shared component: current price + original price crossed out |
| `packages/web/src/components/DiscountBadge.tsx` | New shared component: percentage badge with color coding |
| `packages/web/src/components/StoreIcon.tsx` | New shared component: store logo with fallback |
| `packages/web/src/components/LoadingSpinner.tsx` | New utility component |
| `packages/web/src/components/EmptyState.tsx` | New utility component |
| `packages/web/src/components/ErrorState.tsx` | New utility component |
| `packages/web/src/components/ui/` | Directory for shadcn/ui generated primitives (Button, Dialog, DropdownMenu, Toast, etc.) |
| `packages/web/src/lib/api-client.ts` | New typed fetch wrapper with automatic Authorization header |
| `packages/web/src/lib/query-provider.tsx` | New TanStack Query v5 provider with global error/loading handling |
| `packages/web/src/lib/auth-store.ts` | New Zustand store for auth state (access token, user profile) |
| `packages/web/src/lib/utils.ts` | New utility file for `cn` helper (clsx + tailwind-merge) |
| `packages/web/src/app/robots.ts` | New dynamic robots.txt route handler (stubbed) |
| `packages/web/src/app/sitemap.ts` | New dynamic sitemap.xml route handler (stubbed) |
| `packages/web/vitest.config.ts` | May need path alias resolution for new `@/*` imports in tests |
| `packages/db/src/schema.ts` | Reference file — defines DB schema shapes that frontend types must mirror |
| `packages/api/src/routes/games.ts` | Reference file — defines API response shapes for games list, detail, price history |
| `packages/api/src/routes/deals.ts` | Reference file — defines API response shapes for deals, free games, all-time lows, rankings |
| `packages/api/src/routes/stores.ts` | Reference file — defines API response shape for store listing (id, name, slug, logoUrl, baseUrl) |
| `packages/api/src/lib/response.ts` | Reference file — defines `EnvelopeResponse<T>` wrapper used by all API list endpoints |
| `packages/scraper/src/referral.ts` | Reference file — `buildReferralUrl` logic that BuyButton integration must align with |

## Dependency Map

- `packages/web/src/app/layout.tsx` imports `globals.css` and will import `lib/query-provider.tsx`
- `packages/web/src/app/page.tsx` will import `components/GameCard.tsx` and other shared components
- `packages/web/src/components/GameCard.tsx` will import `PriceBadge.tsx`, `DiscountBadge.tsx`, `BuyButton.tsx`, `StoreIcon.tsx`
- `packages/web/src/components/BuyButton.tsx` will use types from `lib/api-client.ts` for referral URLs
- `packages/web/src/components/PriceBadge.tsx` and `DiscountBadge.tsx` are leaf components with no local deps
- `packages/web/src/components/LoadingSpinner.tsx`, `EmptyState.tsx`, `ErrorState.tsx` are leaf utility components
- `packages/web/src/lib/query-provider.tsx` depends on `@tanstack/react-query`
- `packages/web/src/lib/api-client.ts` depends on `lib/auth-store.ts` (reads access token for Authorization header)
- `packages/web/src/lib/auth-store.ts` depends on `zustand`
- `packages/web/src/lib/utils.ts` depends on `clsx` and `tailwind-merge` (both already in `package.json`)
- `packages/web/src/components/ui/*` (shadcn) will depend on `@radix-ui/*`, `class-variance-authority`, `lib/utils.ts`
- `packages/web/package.json` already has `@taad/db` as workspace dep — used if frontend needs to share types from DB schema
- `packages/api/src/lib/response.ts` defines `EnvelopeResponse<T>` — the frontend API client must match this envelope shape
- `packages/db/src/schema.ts` is the source-of-truth for entity shapes (games, stores, priceHistory, etc.)

## Test Files

- `packages/web/tests/components/BuyButton.test.tsx` — covers existing `BuyButton.tsx` (will need updates when component is enhanced)
- `packages/web/tests/vercel.test.ts` — covers `vercel.json` configuration (no changes needed)
- **No tests exist** for: `GameCard`, `PriceBadge`, `DiscountBadge`, `StoreIcon`, `LoadingSpinner`, `EmptyState`, `ErrorState` (all new components)
- **No tests exist** for: `lib/api-client.ts`, `lib/query-provider.tsx`, `lib/auth-store.ts`, `lib/utils.ts` (all new modules)
- **No tests exist** for: `layout.tsx`, `page.tsx`, `robots.ts`, `sitemap.ts` (app-level files)
- `packages/web/vitest.config.ts` is configured with `passWithNoTests: true` and JSX automatic transform

## Estimated Change Surface

This is a **large** feature touching ~20+ files in the `packages/web` package. The majority are **new files** (components, lib modules, route handlers), which reduces risk to existing code. Key observations:

- **Most complex changes**: `layout.tsx` (root layout with header, footer, providers, responsive nav, SEO), `GameCard.tsx` (composite component integrating multiple sub-components), `api-client.ts` (typed fetch wrapper matching API envelope shape)
- **Existing files requiring modification**: `package.json` (deps), `globals.css` (design tokens), `layout.tsx` (layout overhaul), `page.tsx` (homepage content), `BuyButton.tsx` (enhancement), `next.config.ts` (image domains), possibly `vitest.config.ts` (path aliases)
- **New files to create**: ~12-15 files across `src/components/`, `src/lib/`, `src/app/`, and `src/components/ui/`
- **Low-risk reference files** (read-only): API routes, DB schema, referral module — inform types but are not modified
- **Risk areas**: The `@taad/db` workspace dependency in web's `package.json` could cause build issues if DB types are used directly in client components (needs careful handling with server components). The shadcn/ui setup requires CLI initialization which may scaffold additional config files.

```cadre-json
{
  "relevantFiles": [
    { "path": "packages/web/package.json", "reason": "Must add new dependencies: zustand, react-hook-form, recharts, shadcn/ui CLI tooling" },
    { "path": "packages/web/src/app/globals.css", "reason": "Design-system color palette and typography scale tokens must be defined" },
    { "path": "packages/web/src/app/layout.tsx", "reason": "Root layout must be expanded with sticky header, footer, TanStack Query provider, ad slot placeholders, SEO meta/JSON-LD" },
    { "path": "packages/web/src/app/page.tsx", "reason": "Homepage must be updated to use new shared components and layout" },
    { "path": "packages/web/next.config.ts", "reason": "Image domain additions for game store header images (Steam, GOG, Epic, etc.)" },
    { "path": "packages/web/tsconfig.json", "reason": "Verify path alias @/* is correct for new lib/components directories" },
    { "path": "packages/web/src/components/BuyButton.tsx", "reason": "Existing skeleton must be enhanced with styling, accessibility, and referral URL integration" },
    { "path": "packages/web/src/components/GameCard.tsx", "reason": "New shared component: cover image, title, best price badge, discount badge" },
    { "path": "packages/web/src/components/PriceBadge.tsx", "reason": "New shared component: current price + original price crossed out" },
    { "path": "packages/web/src/components/DiscountBadge.tsx", "reason": "New shared component: percentage badge with color coding by discount depth" },
    { "path": "packages/web/src/components/StoreIcon.tsx", "reason": "New shared component: store logo with fallback icon" },
    { "path": "packages/web/src/components/LoadingSpinner.tsx", "reason": "New utility component for loading states" },
    { "path": "packages/web/src/components/EmptyState.tsx", "reason": "New utility component for empty data states" },
    { "path": "packages/web/src/components/ErrorState.tsx", "reason": "New utility component for error states" },
    { "path": "packages/web/src/lib/api-client.ts", "reason": "New typed fetch wrapper with automatic Authorization header matching API envelope shape" },
    { "path": "packages/web/src/lib/query-provider.tsx", "reason": "New TanStack Query v5 provider with global error/loading handling" },
    { "path": "packages/web/src/lib/auth-store.ts", "reason": "New Zustand store for auth state (access token, user profile)" },
    { "path": "packages/web/src/lib/utils.ts", "reason": "New cn helper utility (clsx + tailwind-merge) required by shadcn/ui components" },
    { "path": "packages/web/src/app/robots.ts", "reason": "New dynamic robots.txt route handler (stubbed)" },
    { "path": "packages/web/src/app/sitemap.ts", "reason": "New dynamic sitemap.xml route handler (stubbed)" },
    { "path": "packages/web/vitest.config.ts", "reason": "May need path alias resolution for @/* imports in tests" },
    { "path": "packages/db/src/schema.ts", "reason": "Reference: DB schema shapes that frontend types must mirror" },
    { "path": "packages/api/src/routes/games.ts", "reason": "Reference: API response shapes for games endpoints" },
    { "path": "packages/api/src/routes/deals.ts", "reason": "Reference: API response shapes for deals endpoints" },
    { "path": "packages/api/src/routes/stores.ts", "reason": "Reference: API response shape for stores listing" },
    { "path": "packages/api/src/lib/response.ts", "reason": "Reference: EnvelopeResponse<T> wrapper used by all API list endpoints" },
    { "path": "packages/scraper/src/referral.ts", "reason": "Reference: buildReferralUrl logic that BuyButton must align with" }
  ],
  "dependencyMap": {
    "packages/web/src/app/layout.tsx": ["packages/web/src/app/globals.css", "packages/web/src/lib/query-provider.tsx"],
    "packages/web/src/app/page.tsx": ["packages/web/src/components/GameCard.tsx", "packages/web/src/components/LoadingSpinner.tsx", "packages/web/src/components/EmptyState.tsx", "packages/web/src/components/ErrorState.tsx"],
    "packages/web/src/components/GameCard.tsx": ["packages/web/src/components/PriceBadge.tsx", "packages/web/src/components/DiscountBadge.tsx", "packages/web/src/components/BuyButton.tsx", "packages/web/src/components/StoreIcon.tsx"],
    "packages/web/src/components/BuyButton.tsx": ["packages/web/src/lib/utils.ts"],
    "packages/web/src/components/PriceBadge.tsx": ["packages/web/src/lib/utils.ts"],
    "packages/web/src/components/DiscountBadge.tsx": ["packages/web/src/lib/utils.ts"],
    "packages/web/src/components/StoreIcon.tsx": [],
    "packages/web/src/components/LoadingSpinner.tsx": [],
    "packages/web/src/components/EmptyState.tsx": [],
    "packages/web/src/components/ErrorState.tsx": [],
    "packages/web/src/lib/api-client.ts": ["packages/web/src/lib/auth-store.ts"],
    "packages/web/src/lib/query-provider.tsx": [],
    "packages/web/src/lib/auth-store.ts": [],
    "packages/web/src/lib/utils.ts": [],
    "packages/web/src/app/robots.ts": [],
    "packages/web/src/app/sitemap.ts": [],
    "packages/web/src/app/globals.css": [],
    "packages/web/package.json": [],
    "packages/web/next.config.ts": [],
    "packages/web/vitest.config.ts": []
  },
  "testFiles": [
    "packages/web/tests/components/BuyButton.test.tsx",
    "packages/web/tests/vercel.test.ts"
  ],
  "estimatedChanges": [
    { "path": "packages/web/package.json", "linesEstimate": 10 },
    { "path": "packages/web/src/app/globals.css", "linesEstimate": 40 },
    { "path": "packages/web/src/app/layout.tsx", "linesEstimate": 80 },
    { "path": "packages/web/src/app/page.tsx", "linesEstimate": 50 },
    { "path": "packages/web/next.config.ts", "linesEstimate": 10 },
    { "path": "packages/web/src/components/BuyButton.tsx", "linesEstimate": 30 },
    { "path": "packages/web/src/components/GameCard.tsx", "linesEstimate": 60 },
    { "path": "packages/web/src/components/PriceBadge.tsx", "linesEstimate": 25 },
    { "path": "packages/web/src/components/DiscountBadge.tsx", "linesEstimate": 30 },
    { "path": "packages/web/src/components/StoreIcon.tsx", "linesEstimate": 30 },
    { "path": "packages/web/src/components/LoadingSpinner.tsx", "linesEstimate": 15 },
    { "path": "packages/web/src/components/EmptyState.tsx", "linesEstimate": 20 },
    { "path": "packages/web/src/components/ErrorState.tsx", "linesEstimate": 20 },
    { "path": "packages/web/src/lib/api-client.ts", "linesEstimate": 60 },
    { "path": "packages/web/src/lib/query-provider.tsx", "linesEstimate": 30 },
    { "path": "packages/web/src/lib/auth-store.ts", "linesEstimate": 25 },
    { "path": "packages/web/src/lib/utils.ts", "linesEstimate": 8 },
    { "path": "packages/web/src/app/robots.ts", "linesEstimate": 15 },
    { "path": "packages/web/src/app/sitemap.ts", "linesEstimate": 20 },
    { "path": "packages/web/vitest.config.ts", "linesEstimate": 5 }
  ]
}
```
