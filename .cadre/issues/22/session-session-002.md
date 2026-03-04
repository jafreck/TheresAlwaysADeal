# Session: session-002 - Leaf UI components

**Rationale:** These leaf components (PriceBadge, DiscountBadge, StoreIcon, utility components, enhanced BuyButton) are independent of each other but all depend on the design tokens and cn utility from session-001. Grouping them allows the agent to maintain consistent styling and API conventions across all components.
**Dependencies:** session-001

## Steps

### session-002-step-001: Create PriceBadge component
**Description:** Create packages/web/src/components/PriceBadge.tsx showing a current price and an optional original price crossed out. Uses cn utility for conditional styling.
**Files:** packages/web/src/components/PriceBadge.tsx
**Complexity:** simple
**Acceptance Criteria:**
- `PriceBadge` component is exported from `packages/web/src/components/PriceBadge.tsx`
- Props include `currentPrice: number`, `originalPrice?: number`, and `currency?: string` (default 'USD')
- When originalPrice is provided and differs from currentPrice, it is displayed with line-through styling
- Current price is displayed prominently
- Component uses `cn` for className merging and accepts a `className` prop

### session-002-step-002: Create DiscountBadge component
**Description:** Create packages/web/src/components/DiscountBadge.tsx displaying a discount percentage (e.g. '-75%') with color coding by discount depth (green for small, yellow for medium, red for deep discounts).
**Files:** packages/web/src/components/DiscountBadge.tsx
**Complexity:** simple
**Acceptance Criteria:**
- `DiscountBadge` component is exported from `packages/web/src/components/DiscountBadge.tsx`
- Props include `discount: number` (0-100 percentage value)
- Displays formatted text like '-75%'
- Color varies by discount depth (e.g., >=50% uses danger/red, >=25% uses warning/yellow, <25% uses success/green)
- Accepts a `className` prop for external styling

### session-002-step-003: Create StoreIcon component
**Description:** Create packages/web/src/components/StoreIcon.tsx displaying a store logo image with a text fallback when the image is unavailable.
**Files:** packages/web/src/components/StoreIcon.tsx
**Complexity:** simple
**Acceptance Criteria:**
- `StoreIcon` component is exported from `packages/web/src/components/StoreIcon.tsx`
- Props include `storeName: string`, `logoUrl?: string | null`, and `size?: number` (default 24)
- Renders an `<img>` tag with alt text when logoUrl is provided
- Falls back to a styled text abbreviation (first 2 chars of storeName) when logoUrl is null/undefined
- Accepts a `className` prop

### session-002-step-004: Create LoadingSpinner, EmptyState, ErrorState utility components
**Description:** Create three utility components: LoadingSpinner (animated spinner), EmptyState (message + optional icon for empty lists), and ErrorState (error message + optional retry button).
**Files:** packages/web/src/components/LoadingSpinner.tsx, packages/web/src/components/EmptyState.tsx, packages/web/src/components/ErrorState.tsx
**Complexity:** simple
**Acceptance Criteria:**
- `LoadingSpinner` is exported and renders an animated spinning indicator with an optional `size` prop
- `EmptyState` is exported with `message: string` and optional `icon` prop, rendering centered placeholder content
- `ErrorState` is exported with `message: string` and optional `onRetry?: () => void` prop; renders a retry button when onRetry is provided
- All three components accept a `className` prop
- All interactive elements (retry button) have visible focus states for keyboard accessibility

### session-002-step-005: Enhance BuyButton component
**Description:** Update the existing packages/web/src/components/BuyButton.tsx with proper styling (button-like appearance using design tokens), keyboard focus states, aria-label, and the cn utility. Preserve the existing props interface (href, storeName) for backward compatibility with existing tests.
**Files:** packages/web/src/components/BuyButton.tsx, packages/web/tests/components/BuyButton.test.tsx
**Complexity:** moderate
**Acceptance Criteria:**
- BuyButton renders as a styled anchor element with button-like appearance using design-system tokens
- Includes visible keyboard focus states (focus-visible ring or outline)
- Has `aria-label` attribute describing the action (e.g., 'Buy {game} on {storeName}')
- Existing props interface (href, storeName) is preserved
- Existing tests in BuyButton.test.tsx continue to pass (update tests only if necessary to accommodate new aria/styling attributes)
- Component uses `cn` from `@/lib/utils` for className merging