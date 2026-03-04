# Implementation Plan — Issue #22: Frontend Foundation & Shared Components

## Overview

This plan breaks the large frontend foundation feature into 4 sessions that build on each other logically:

1. **Session 1** — Dependencies, design tokens, utility modules (foundation layer)
2. **Session 2** — Leaf UI components (PriceBadge, DiscountBadge, StoreIcon, LoadingSpinner, EmptyState, ErrorState, enhanced BuyButton)
3. **Session 3** — Composite component (GameCard) and SEO route handlers (robots.txt, sitemap.xml)
4. **Session 4** — Root layout, responsive navigation, homepage, and SEO metadata

Sessions are ordered so that each builds on the previous: design tokens → leaf components → composite components → layout integration.

---

```cadre-json
[
  {
    "id": "session-001",
    "name": "Foundation: deps, design tokens, and lib modules",
    "rationale": "All subsequent sessions depend on the design tokens, utility functions, auth store, API client, and TanStack Query provider created here. Grouping them ensures consistent foundation.",
    "dependencies": [],
    "steps": [
      {
        "id": "session-001-step-001",
        "name": "Install new dependencies",
        "description": "Add zustand, react-hook-form, and recharts to packages/web/package.json dependencies. These are required by downstream lib modules and components.",
        "files": ["packages/web/package.json"],
        "complexity": "simple",
        "acceptanceCriteria": [
          "`zustand` is listed in `dependencies` in packages/web/package.json",
          "`react-hook-form` is listed in `dependencies`",
          "`recharts` is listed in `dependencies`",
          "`@testing-library/react` and `@testing-library/jest-dom` and `jsdom` are listed in `devDependencies`",
          "`pnpm install` completes without errors from the monorepo root"
        ]
      },
      {
        "id": "session-001-step-002",
        "name": "Define design-system color palette and typography scale",
        "description": "Expand packages/web/src/app/globals.css with semantic color tokens (primary, background, surface, muted, success, warning, danger) and a typography scale (heading, body, caption, label) inside the @theme block.",
        "files": ["packages/web/src/app/globals.css"],
        "complexity": "moderate",
        "acceptanceCriteria": [
          "globals.css @theme block defines --color-primary, --color-background, --color-surface, --color-muted, --color-success, --color-warning, --color-danger tokens (with light/dark variants as needed)",
          "Typography scale tokens are defined for heading (font-size, font-weight), body, caption, and label",
          "Existing brand-50, brand-500, brand-900 tokens are preserved",
          "Body still applies bg and text color via Tailwind utility classes"
        ]
      },
      {
        "id": "session-001-step-003",
        "name": "Create cn utility helper",
        "description": "Create packages/web/src/lib/utils.ts exporting a `cn` helper that combines clsx and tailwind-merge for conditional className merging, as required by shadcn/ui pattern.",
        "files": ["packages/web/src/lib/utils.ts"],
        "complexity": "simple",
        "acceptanceCriteria": [
          "`cn` function is exported from `packages/web/src/lib/utils.ts`",
          "`cn` accepts variadic ClassValue arguments and returns a merged string",
          "Uses `clsx` and `tailwind-merge` (both already in package.json)"
        ]
      },
      {
        "id": "session-001-step-004",
        "name": "Create Zustand auth store",
        "description": "Create packages/web/src/lib/auth-store.ts with a Zustand store holding accessToken (string | null) and userProfile (object | null), with setAccessToken, setUserProfile, and logout actions.",
        "files": ["packages/web/src/lib/auth-store.ts"],
        "complexity": "moderate",
        "acceptanceCriteria": [
          "`useAuthStore` hook is exported from `packages/web/src/lib/auth-store.ts`",
          "Store shape includes `accessToken: string | null` and `userProfile: UserProfile | null`",
          "Store exposes `setAccessToken`, `setUserProfile`, and `logout` actions",
          "`logout` resets both accessToken and userProfile to null"
        ]
      },
      {
        "id": "session-001-step-005",
        "name": "Create typed API client",
        "description": "Create packages/web/src/lib/api-client.ts with a typed fetch wrapper that reads the access token from the auth store and attaches it as an Authorization bearer header. Define TypeScript interfaces mirroring EnvelopeResponse<T> and EnvelopeMeta from the API.",
        "files": ["packages/web/src/lib/api-client.ts"],
        "complexity": "moderate",
        "acceptanceCriteria": [
          "`apiClient` is exported with typed `get`, `post`, `put`, `delete` methods",
          "Each method automatically attaches `Authorization: Bearer <token>` header when an access token exists in the auth store",
          "`EnvelopeResponse<T>` and `EnvelopeMeta` TypeScript interfaces are exported matching the API's response shape",
          "Base URL is configurable via `NEXT_PUBLIC_API_URL` environment variable",
          "Methods throw or return structured errors for non-2xx responses"
        ]
      },
      {
        "id": "session-001-step-006",
        "name": "Create TanStack Query provider",
        "description": "Create packages/web/src/lib/query-provider.tsx as a client component wrapping children in QueryClientProvider with a default QueryClient configured with sensible defaults (staleTime, retry).",
        "files": ["packages/web/src/lib/query-provider.tsx"],
        "complexity": "simple",
        "acceptanceCriteria": [
          "`QueryProvider` is exported as a 'use client' component from `packages/web/src/lib/query-provider.tsx`",
          "It wraps children in `@tanstack/react-query`'s `QueryClientProvider`",
          "QueryClient is created with default options (e.g., staleTime of 60s, retry of 1)",
          "QueryClient is created outside the component or with useState to avoid re-creation on re-renders"
        ]
      },
      {
        "id": "session-001-step-007",
        "name": "Add image domains to next.config.ts",
        "description": "Add Steam CDN (steamcdn-a.akamaihd.net, cdn.akamai.steamstatic.com), GOG (images.gog-statics.com), and Epic (cdn1.epicgames.com) to the images.remotePatterns array in next.config.ts.",
        "files": ["packages/web/next.config.ts"],
        "complexity": "simple",
        "acceptanceCriteria": [
          "remotePatterns includes patterns for Steam CDN, GOG, and Epic Games image domains",
          "Existing Amazon, BestBuy, Walmart patterns are preserved"
        ]
      },
      {
        "id": "session-001-step-008",
        "name": "Update vitest config for path aliases and jsdom",
        "description": "Update packages/web/vitest.config.ts to resolve the @/* path alias and set the test environment to jsdom for component testing.",
        "files": ["packages/web/vitest.config.ts"],
        "complexity": "simple",
        "acceptanceCriteria": [
          "vitest.config.ts resolves `@/*` to `./src/*`",
          "Test environment is set to `jsdom`",
          "Existing config options (passWithNoTests, esbuild jsx) are preserved"
        ]
      }
    ]
  },
  {
    "id": "session-002",
    "name": "Leaf UI components",
    "rationale": "These leaf components (PriceBadge, DiscountBadge, StoreIcon, utility components, enhanced BuyButton) are independent of each other but all depend on the design tokens and cn utility from session-001. Grouping them allows the agent to maintain consistent styling and API conventions across all components.",
    "dependencies": ["session-001"],
    "steps": [
      {
        "id": "session-002-step-001",
        "name": "Create PriceBadge component",
        "description": "Create packages/web/src/components/PriceBadge.tsx showing a current price and an optional original price crossed out. Uses cn utility for conditional styling.",
        "files": ["packages/web/src/components/PriceBadge.tsx"],
        "complexity": "simple",
        "acceptanceCriteria": [
          "`PriceBadge` component is exported from `packages/web/src/components/PriceBadge.tsx`",
          "Props include `currentPrice: number`, `originalPrice?: number`, and `currency?: string` (default 'USD')",
          "When originalPrice is provided and differs from currentPrice, it is displayed with line-through styling",
          "Current price is displayed prominently",
          "Component uses `cn` for className merging and accepts a `className` prop"
        ]
      },
      {
        "id": "session-002-step-002",
        "name": "Create DiscountBadge component",
        "description": "Create packages/web/src/components/DiscountBadge.tsx displaying a discount percentage (e.g. '-75%') with color coding by discount depth (green for small, yellow for medium, red for deep discounts).",
        "files": ["packages/web/src/components/DiscountBadge.tsx"],
        "complexity": "simple",
        "acceptanceCriteria": [
          "`DiscountBadge` component is exported from `packages/web/src/components/DiscountBadge.tsx`",
          "Props include `discount: number` (0-100 percentage value)",
          "Displays formatted text like '-75%'",
          "Color varies by discount depth (e.g., >=50% uses danger/red, >=25% uses warning/yellow, <25% uses success/green)",
          "Accepts a `className` prop for external styling"
        ]
      },
      {
        "id": "session-002-step-003",
        "name": "Create StoreIcon component",
        "description": "Create packages/web/src/components/StoreIcon.tsx displaying a store logo image with a text fallback when the image is unavailable.",
        "files": ["packages/web/src/components/StoreIcon.tsx"],
        "complexity": "simple",
        "acceptanceCriteria": [
          "`StoreIcon` component is exported from `packages/web/src/components/StoreIcon.tsx`",
          "Props include `storeName: string`, `logoUrl?: string | null`, and `size?: number` (default 24)",
          "Renders an `<img>` tag with alt text when logoUrl is provided",
          "Falls back to a styled text abbreviation (first 2 chars of storeName) when logoUrl is null/undefined",
          "Accepts a `className` prop"
        ]
      },
      {
        "id": "session-002-step-004",
        "name": "Create LoadingSpinner, EmptyState, ErrorState utility components",
        "description": "Create three utility components: LoadingSpinner (animated spinner), EmptyState (message + optional icon for empty lists), and ErrorState (error message + optional retry button).",
        "files": [
          "packages/web/src/components/LoadingSpinner.tsx",
          "packages/web/src/components/EmptyState.tsx",
          "packages/web/src/components/ErrorState.tsx"
        ],
        "complexity": "simple",
        "acceptanceCriteria": [
          "`LoadingSpinner` is exported and renders an animated spinning indicator with an optional `size` prop",
          "`EmptyState` is exported with `message: string` and optional `icon` prop, rendering centered placeholder content",
          "`ErrorState` is exported with `message: string` and optional `onRetry?: () => void` prop; renders a retry button when onRetry is provided",
          "All three components accept a `className` prop",
          "All interactive elements (retry button) have visible focus states for keyboard accessibility"
        ]
      },
      {
        "id": "session-002-step-005",
        "name": "Enhance BuyButton component",
        "description": "Update the existing packages/web/src/components/BuyButton.tsx with proper styling (button-like appearance using design tokens), keyboard focus states, aria-label, and the cn utility. Preserve the existing props interface (href, storeName) for backward compatibility with existing tests.",
        "files": [
          "packages/web/src/components/BuyButton.tsx",
          "packages/web/tests/components/BuyButton.test.tsx"
        ],
        "complexity": "moderate",
        "acceptanceCriteria": [
          "BuyButton renders as a styled anchor element with button-like appearance using design-system tokens",
          "Includes visible keyboard focus states (focus-visible ring or outline)",
          "Has `aria-label` attribute describing the action (e.g., 'Buy {game} on {storeName}')",
          "Existing props interface (href, storeName) is preserved",
          "Existing tests in BuyButton.test.tsx continue to pass (update tests only if necessary to accommodate new aria/styling attributes)",
          "Component uses `cn` from `@/lib/utils` for className merging"
        ]
      }
    ]
  },
  {
    "id": "session-003",
    "name": "GameCard composite component and SEO stubs",
    "rationale": "GameCard depends on the leaf components from session-002. SEO route handlers (robots.ts, sitemap.ts) are independent but small enough to group here rather than warrant a separate session.",
    "dependencies": ["session-002"],
    "steps": [
      {
        "id": "session-003-step-001",
        "name": "Create GameCard composite component",
        "description": "Create packages/web/src/components/GameCard.tsx composing cover image (Next.js Image), title, PriceBadge, DiscountBadge, BuyButton, and StoreIcon into a card layout. Define a GameCardProps interface with fields derived from the API/DB schema (gameTitle, gameSlug, headerImageUrl, currentPrice, originalPrice, discount, storeName, storeLogoUrl, storeUrl).",
        "files": ["packages/web/src/components/GameCard.tsx"],
        "complexity": "complex",
        "acceptanceCriteria": [
          "`GameCard` component is exported from `packages/web/src/components/GameCard.tsx`",
          "Renders a card with cover image (using Next.js `<Image>` with proper alt text), game title, PriceBadge, DiscountBadge (conditionally when discount > 0), StoreIcon, and BuyButton",
          "Cover image has `alt` text set to the game title",
          "Card has hover/focus styles for interactivity",
          "Props interface includes: gameTitle, gameSlug, headerImageUrl, currentPrice, originalPrice, discount, storeName, storeLogoUrl, storeUrl",
          "Component accepts a `className` prop for external layout control"
        ]
      },
      {
        "id": "session-003-step-002",
        "name": "Create stubbed robots.ts and sitemap.ts route handlers",
        "description": "Create packages/web/src/app/robots.ts and packages/web/src/app/sitemap.ts as Next.js route handlers that return basic robots.txt and sitemap.xml content. Both are stubbed with placeholder data until the game data API is available.",
        "files": [
          "packages/web/src/app/robots.ts",
          "packages/web/src/app/sitemap.ts"
        ],
        "complexity": "simple",
        "acceptanceCriteria": [
          "packages/web/src/app/robots.ts exports a default function returning a MetadataRoute.Robots object with basic Allow/Disallow rules and a sitemap reference",
          "packages/web/src/app/sitemap.ts exports a default function returning a MetadataRoute.Sitemap array with at least the homepage entry",
          "Both use the Next.js App Router metadata file convention",
          "Sitemap includes a TODO comment indicating it should be populated with game page URLs when the API is available"
        ]
      }
    ]
  },
  {
    "id": "session-004",
    "name": "Root layout, responsive nav, and homepage",
    "rationale": "The root layout and homepage depend on all prior sessions — they integrate the QueryProvider, design tokens, and shared components into the app shell. Grouping layout, navigation, and homepage together ensures consistent integration.",
    "dependencies": ["session-003"],
    "steps": [
      {
        "id": "session-004-step-001",
        "name": "Build root layout with header, footer, and providers",
        "description": "Overhaul packages/web/src/app/layout.tsx to include: QueryProvider wrapping children, a sticky header with logo text, search bar placeholder, nav links placeholder, and auth CTA placeholder. Add a footer with affiliate disclosure text and link placeholders. Add ad slot placeholder divs. Enhance SEO metadata with JSON-LD structured data for the site.",
        "files": ["packages/web/src/app/layout.tsx"],
        "complexity": "complex",
        "acceptanceCriteria": [
          "Layout wraps children in `QueryProvider` from `@/lib/query-provider`",
          "Header is sticky (position: sticky, top: 0) and contains logo, search bar placeholder, nav link placeholders, and auth CTA placeholder",
          "Footer contains affiliate disclosure text and placeholder links",
          "At least one ad slot placeholder `<div>` is present in the layout with a data-slot attribute or comment",
          "Existing metadata (title, description, openGraph) is preserved",
          "JSON-LD script tag is included with WebSite structured data",
          "All interactive elements in header/footer have keyboard focus states"
        ]
      },
      {
        "id": "session-004-step-002",
        "name": "Implement responsive navigation",
        "description": "Add responsive behavior to the header navigation: visible nav links on desktop (md+ breakpoint), hamburger menu button on mobile that toggles a mobile menu. Use Tailwind responsive classes and minimal client-side state.",
        "files": ["packages/web/src/app/layout.tsx"],
        "complexity": "moderate",
        "acceptanceCriteria": [
          "Nav links are visible on md+ screens via Tailwind responsive classes (e.g., hidden md:flex)",
          "A hamburger menu button is visible on small screens (md:hidden)",
          "Mobile menu can be toggled open/closed",
          "Hamburger button has an aria-label and aria-expanded attribute",
          "The responsive nav is implemented as a client component (either inline or extracted)"
        ]
      },
      {
        "id": "session-004-step-003",
        "name": "Update homepage with shared components",
        "description": "Update packages/web/src/app/page.tsx to use the new layout structure. Show a hero section with the tagline, and a placeholder section for featured deals that uses LoadingSpinner, EmptyState, or sample GameCard components to demonstrate the design system.",
        "files": ["packages/web/src/app/page.tsx"],
        "complexity": "moderate",
        "acceptanceCriteria": [
          "Homepage renders a hero section with the site title and tagline",
          "A 'Featured Deals' section is present with placeholder content (at minimum an EmptyState or sample GameCards with mock data)",
          "Page imports and uses at least one shared component (GameCard, EmptyState, or LoadingSpinner)",
          "Page is responsive and readable on mobile and desktop viewports",
          "Existing heading and description text are preserved or refined"
        ]
      }
    ]
  }
]
```
