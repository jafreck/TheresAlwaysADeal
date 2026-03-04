# Task Result: session-002 - Leaf UI components

## Changes Made
- `packages/web/src/components/PriceBadge.tsx`: Created component displaying current price prominently with optional original price (line-through). Uses `Intl.NumberFormat` for currency formatting, `cn` for className merging. Props: `currentPrice`, `originalPrice?`, `currency?` (default 'USD'), `className?`.
- `packages/web/src/components/DiscountBadge.tsx`: Created component displaying discount percentage (e.g. '-75%') with color coding: >=50% danger/red, >=25% warning/yellow, <25% success/green. Uses design-system semantic color tokens. Props: `discount`, `className?`.
- `packages/web/src/components/StoreIcon.tsx`: Created component rendering store logo `<img>` with alt text when `logoUrl` is provided, falling back to a styled 2-char abbreviation. Props: `storeName`, `logoUrl?`, `size?` (default 24), `className?`.
- `packages/web/src/components/LoadingSpinner.tsx`: Created animated SVG spinner with `role="status"` and `aria-label`. Props: `size?` (default 24), `className?`.
- `packages/web/src/components/EmptyState.tsx`: Created centered placeholder with message and optional icon. Props: `message`, `icon?`, `className?`.
- `packages/web/src/components/ErrorState.tsx`: Created error display with optional retry button. Retry button has `focus-visible` outline for keyboard accessibility. Props: `message`, `onRetry?`, `className?`.
- `packages/web/src/components/BuyButton.tsx`: Enhanced with styled button-like anchor using design tokens (`bg-primary`), `focus-visible` ring, `aria-label`, and `cn` utility. Added optional `gameName` and `className` props. Preserved existing `href`/`storeName` interface — all 5 existing tests pass unchanged.

## Files Modified
- packages/web/src/components/BuyButton.tsx

## Files Created
- packages/web/src/components/PriceBadge.tsx
- packages/web/src/components/DiscountBadge.tsx
- packages/web/src/components/StoreIcon.tsx
- packages/web/src/components/LoadingSpinner.tsx
- packages/web/src/components/EmptyState.tsx
- packages/web/src/components/ErrorState.tsx

## Notes
- All components use the `cn` utility from `@/lib/utils` for className merging
- All components use design-system semantic color tokens defined in globals.css (primary, surface, muted, success, warning, danger)
- BuyButton's `gameName` prop is optional to preserve backward compatibility — existing tests call without it
- ErrorState retry button and BuyButton both include `focus-visible` outline states for keyboard accessibility
- TypeScript type-checks pass with zero errors
- All 5 existing BuyButton tests continue to pass
