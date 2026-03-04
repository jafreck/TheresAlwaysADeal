# Session: session-004 - Root layout, responsive nav, and homepage

**Rationale:** The root layout and homepage depend on all prior sessions — they integrate the QueryProvider, design tokens, and shared components into the app shell. Grouping layout, navigation, and homepage together ensures consistent integration.
**Dependencies:** session-003

## Steps

### session-004-step-001: Build root layout with header, footer, and providers
**Description:** Overhaul packages/web/src/app/layout.tsx to include: QueryProvider wrapping children, a sticky header with logo text, search bar placeholder, nav links placeholder, and auth CTA placeholder. Add a footer with affiliate disclosure text and link placeholders. Add ad slot placeholder divs. Enhance SEO metadata with JSON-LD structured data for the site.
**Files:** packages/web/src/app/layout.tsx
**Complexity:** complex
**Acceptance Criteria:**
- Layout wraps children in `QueryProvider` from `@/lib/query-provider`
- Header is sticky (position: sticky, top: 0) and contains logo, search bar placeholder, nav link placeholders, and auth CTA placeholder
- Footer contains affiliate disclosure text and placeholder links
- At least one ad slot placeholder `<div>` is present in the layout with a data-slot attribute or comment
- Existing metadata (title, description, openGraph) is preserved
- JSON-LD script tag is included with WebSite structured data
- All interactive elements in header/footer have keyboard focus states

### session-004-step-002: Implement responsive navigation
**Description:** Add responsive behavior to the header navigation: visible nav links on desktop (md+ breakpoint), hamburger menu button on mobile that toggles a mobile menu. Use Tailwind responsive classes and minimal client-side state.
**Files:** packages/web/src/app/layout.tsx
**Complexity:** moderate
**Acceptance Criteria:**
- Nav links are visible on md+ screens via Tailwind responsive classes (e.g., hidden md:flex)
- A hamburger menu button is visible on small screens (md:hidden)
- Mobile menu can be toggled open/closed
- Hamburger button has an aria-label and aria-expanded attribute
- The responsive nav is implemented as a client component (either inline or extracted)

### session-004-step-003: Update homepage with shared components
**Description:** Update packages/web/src/app/page.tsx to use the new layout structure. Show a hero section with the tagline, and a placeholder section for featured deals that uses LoadingSpinner, EmptyState, or sample GameCard components to demonstrate the design system.
**Files:** packages/web/src/app/page.tsx
**Complexity:** moderate
**Acceptance Criteria:**
- Homepage renders a hero section with the site title and tagline
- A 'Featured Deals' section is present with placeholder content (at minimum an EmptyState or sample GameCards with mock data)
- Page imports and uses at least one shared component (GameCard, EmptyState, or LoadingSpinner)
- Page is responsive and readable on mobile and desktop viewports
- Existing heading and description text are preserved or refined