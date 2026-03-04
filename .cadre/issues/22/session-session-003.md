# Session: session-003 - GameCard composite component and SEO stubs

**Rationale:** GameCard depends on the leaf components from session-002. SEO route handlers (robots.ts, sitemap.ts) are independent but small enough to group here rather than warrant a separate session.
**Dependencies:** session-002

## Steps

### session-003-step-001: Create GameCard composite component
**Description:** Create packages/web/src/components/GameCard.tsx composing cover image (Next.js Image), title, PriceBadge, DiscountBadge, BuyButton, and StoreIcon into a card layout. Define a GameCardProps interface with fields derived from the API/DB schema (gameTitle, gameSlug, headerImageUrl, currentPrice, originalPrice, discount, storeName, storeLogoUrl, storeUrl).
**Files:** packages/web/src/components/GameCard.tsx
**Complexity:** complex
**Acceptance Criteria:**
- `GameCard` component is exported from `packages/web/src/components/GameCard.tsx`
- Renders a card with cover image (using Next.js `<Image>` with proper alt text), game title, PriceBadge, DiscountBadge (conditionally when discount > 0), StoreIcon, and BuyButton
- Cover image has `alt` text set to the game title
- Card has hover/focus styles for interactivity
- Props interface includes: gameTitle, gameSlug, headerImageUrl, currentPrice, originalPrice, discount, storeName, storeLogoUrl, storeUrl
- Component accepts a `className` prop for external layout control

### session-003-step-002: Create stubbed robots.ts and sitemap.ts route handlers
**Description:** Create packages/web/src/app/robots.ts and packages/web/src/app/sitemap.ts as Next.js route handlers that return basic robots.txt and sitemap.xml content. Both are stubbed with placeholder data until the game data API is available.
**Files:** packages/web/src/app/robots.ts, packages/web/src/app/sitemap.ts
**Complexity:** simple
**Acceptance Criteria:**
- packages/web/src/app/robots.ts exports a default function returning a MetadataRoute.Robots object with basic Allow/Disallow rules and a sitemap reference
- packages/web/src/app/sitemap.ts exports a default function returning a MetadataRoute.Sitemap array with at least the homepage entry
- Both use the Next.js App Router metadata file convention
- Sitemap includes a TODO comment indicating it should be populated with game page URLs when the API is available