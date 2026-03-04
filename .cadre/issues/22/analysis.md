## Requirements

1. Initialize the Next.js project with TypeScript and Tailwind CSS (already partially done — validate existing setup, fill gaps)
2. Install and configure shadcn/ui with Radix UI primitives for accessible component building
3. Set up TanStack Query (v5) provider with global error and loading handling in the app root
4. Set up a Zustand store for auth state (access token, user profile)
5. Create a typed API client (`fetch` wrapper) that automatically attaches the `Authorization` header
6. Define a design-system color palette in Tailwind config: primary (brand), background, surface, muted, success, warning, danger
7. Define a typography scale (heading, body, caption, label) in the Tailwind theme
8. Create shared `<GameCard>` component (cover image, title, best price badge, discount badge)
9. Create shared `<PriceBadge>` component (current price + original price crossed out)
10. Create shared `<DiscountBadge>` component (e.g. "-75%" with color coding by discount depth)
11. Create shared `<BuyButton>` component that uses referral URL from API (skeleton exists — enhance with styling and accessibility)
12. Create shared `<StoreIcon>` component (store logo)
13. Create shared utility components: `<LoadingSpinner>`, `<EmptyState>`, `<ErrorState>`
14. Build root layout with sticky header (logo, search bar, nav links, auth CTA), footer (links, affiliate disclosure), and ad slot placeholders
15. Implement responsive layout: full sidebar on desktop, hamburger menu on mobile
16. Add default SEO `<meta>` tags, Open Graph metadata, and JSON-LD structured data for game pages
17. Set up dynamic `robots.txt` and `sitemap.xml` generation (stubbed until game data API is available)
18. Ensure all interactive elements have keyboard focus states
19. Ensure images have `alt` text
20. Ensure color contrast meets WCAG AA
21. `npm run dev` (or `pnpm dev`) starts the frontend successfully against the local API
22. Lighthouse score ≥ 90 on Performance, Accessibility, and SEO for the homepage

## Change Type

feature

## Scope Estimate

large

## Affected Areas

- `packages/web/src/app/` — root layout, page, globals.css, SEO metadata, robots.txt, sitemap.xml route handlers
- `packages/web/src/components/` — all new shared UI components (GameCard, PriceBadge, DiscountBadge, BuyButton, StoreIcon, LoadingSpinner, EmptyState, ErrorState)
- `packages/web/src/components/ui/` — shadcn/ui generated primitive components (Button, Dialog, DropdownMenu, Toast, etc.)
- `packages/web/src/lib/` — API client, TanStack Query provider, Zustand auth store, utility functions (cn helper)
- `packages/web/src/app/globals.css` — design-system color palette, typography scale, Tailwind theme tokens
- `packages/web/package.json` — new dependencies (zustand, react-hook-form, recharts, shadcn/ui CLI tooling)
- `packages/web/next.config.ts` — potential image domain additions
- `packages/web/tests/` — component tests for new shared components
- `packages/web/tsconfig.json` — possible path alias updates

## Ambiguities

1. API shape (endpoints, response types) from #13 is not specified — component props and API client types need to be inferred or stubbed based on `packages/api/src/routes/` (games, deals, stores endpoints exist but response schemas are not directly available to the frontend yet)
2. Ad slots are mentioned in the layout but no ad provider or placement strategy is specified — placeholder `<div>` slots are the safest approach
3. `<StoreIcon>` requires store logos but the list of stores and logo asset sources are not defined — will need a placeholder/fallback icon strategy
4. Referral URL API endpoint and response shape for `<BuyButton>` are not specified — the existing BuyButton takes `href` as a prop, but the issue says it should always use the referral URL from the API
5. JSON-LD structured data type and required fields for game pages are not clarified (Product? VideoGame? SoftwareApplication?)
6. Dynamic `robots.txt` and `sitemap.xml` depend on game data API not yet available — stub implementations should suffice for now
7. Storybook is described as "optional but nice" — unclear whether a component showcase page or Storybook integration is expected as part of acceptance
8. Zustand auth store shape and auth flow details (login, logout, token refresh) are not specified — a minimal store with `accessToken` and `userProfile` fields should be created, with the full auth flow deferred
9. The issue mentions Recharts for price history charts and React Hook Form + Zod for forms, but no specific chart or form components are listed in the tasks — these may be install-only for now

```cadre-json
{
  "requirements": [
    "Initialize Next.js project with TypeScript and Tailwind CSS (validate existing setup, fill gaps)",
    "Install and configure shadcn/ui with Radix UI primitives",
    "Set up TanStack Query v5 provider with global error/loading handling",
    "Set up Zustand store for auth state (access token, user profile)",
    "Create typed API client (fetch wrapper) with automatic Authorization header",
    "Define design-system color palette in Tailwind: primary, background, surface, muted, success, warning, danger",
    "Define typography scale: heading, body, caption, label",
    "Create GameCard component (cover image, title, best price badge, discount badge)",
    "Create PriceBadge component (current price + original price crossed out)",
    "Create DiscountBadge component (percentage badge with color coding by discount depth)",
    "Create BuyButton component using referral URL from API",
    "Create StoreIcon component (store logo)",
    "Create utility components: LoadingSpinner, EmptyState, ErrorState",
    "Build root layout with sticky header (logo, search bar, nav, auth CTA), footer, ad slot placeholders",
    "Implement responsive layout: sidebar on desktop, hamburger menu on mobile",
    "Add default SEO meta tags, Open Graph, and JSON-LD structured data for game pages",
    "Set up dynamic robots.txt and sitemap.xml generation (stubbed)",
    "Ensure all interactive elements have keyboard focus states",
    "Ensure images have alt text",
    "Ensure color contrast meets WCAG AA",
    "npm run dev starts the frontend against local API",
    "Lighthouse score >= 90 on Performance, Accessibility, SEO for homepage"
  ],
  "changeType": "feature",
  "scope": "large",
  "affectedAreas": [
    "packages/web/src/app/",
    "packages/web/src/components/",
    "packages/web/src/components/ui/",
    "packages/web/src/lib/",
    "packages/web/src/app/globals.css",
    "packages/web/package.json",
    "packages/web/next.config.ts",
    "packages/web/tests/"
  ],
  "ambiguities": [
    "API shape (endpoints, response types) from #13 is not specified — component props and API client types need to be inferred or stubbed",
    "Ad slots mentioned in layout but no ad provider or placement strategy is specified",
    "StoreIcon requires store logos but the list of stores and logo asset sources are not defined",
    "Referral URL API endpoint and response shape for BuyButton are not specified",
    "JSON-LD structured data type and required fields for game pages are not clarified",
    "Dynamic robots.txt and sitemap.xml depend on game data API not yet available — unclear whether to stub or build full dynamic generation",
    "Storybook is described as optional — unclear whether a component showcase is expected as part of acceptance",
    "Zustand auth store shape and auth flow details (login, logout, token refresh) are not specified",
    "Recharts and React Hook Form mentioned in tech recommendations but no specific components listed in tasks — install-only scope is unclear"
  ]
}
```
