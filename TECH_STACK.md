# Architecture Decision Record — Tech Stack

**Date:** 2026-02-24  
**Status:** Accepted  
**Deciders:** @jafreck  
**Issue:** [#1 — Tech Stack Selection & Project Scaffolding](https://github.com/jafreck/TheresAlwaysADeal/issues/1)

---

## Context

We are building a deal aggregation platform that:
- Scrapes multiple retailers on a schedule
- Stores, categorises, and serves deal data
- Renders a fast, modern storefront (SEO matters)
- Must minimise idle costs while being able to scale under traffic spikes

---

## Decisions

### Monorepo Tooling

| Decision | Choice | Alternatives Considered | Rationale |
|---|---|---|---|
| Monorepo orchestration | **Turborepo** | Nx, Lerna | Fastest incremental builds, zero-config caching, first-class pnpm support |
| Package manager | **pnpm** | npm, yarn | Symlink-based node_modules = faster installs, disk-efficient, native workspace support |
| Language | **TypeScript** (strict) | JavaScript | End-to-end type safety, better DX, catches bugs before runtime |
| Linting | **ESLint 9** (flat config) | Biome | Industry standard, rich plugin ecosystem |
| Formatting | **Prettier** + tailwindcss plugin | Biome | Ubiquitous, integrates with every editor |
| Testing | **Vitest** | Jest | ESM-native, faster, compatible with the entire stack |

---

### Frontend (`packages/web`)

| Decision | Choice | Alternatives Considered | Rationale |
|---|---|---|---|
| Framework | **Next.js 15** (App Router) | Remix, SvelteKit | SSR + ISR built-in for SEO; React 19; largest ecosystem; Vercel deploy is trivial |
| Styling | **Tailwind CSS v4** | CSS Modules, Emotion | Zero-runtime, JIT, excellent DX; v4 uses native CSS cascade layers (no PostCSS config needed) |
| Component primitives | **shadcn/ui** + **Radix UI** | Chakra UI, MUI | Composable, accessible, fully customisable — code is copied into the repo, no vendor lock-in |
| Animations | **Framer Motion** | React Spring, CSS only | Production-quality motion APIs, layout animations, gesture support |
| Data fetching / caching | **TanStack Query v5** | SWR, built-in `fetch` | Stale-while-revalidate, background refetch, optimistic updates, devtools |
| Icon set | **Lucide React** | Heroicons, Phosphor | Consistent, MIT-licensed, tree-shakeable |

---

### Backend API (`packages/api`)

| Decision | Choice | Alternatives Considered | Rationale |
|---|---|---|---|
| Runtime | **Node.js ≥ 20** | Bun, Deno | Widest hosting support; Node 20 is LTS; Bun-compatible code style used throughout |
| Framework | **Hono** | Express, Fastify, NestJS | ~25× faster than Express; edge-runtime compatible; tiny bundle; TypeScript-first; built-in middleware |
| Validation | **Zod** | Yup, Valibot | De-facto standard; integrates with tRPC, Drizzle, and React Hook Form |
| Type bridge (future) | **tRPC** (planned) | REST + OpenAPI | Compile-time type safety across the web ↔ API boundary with zero codegen |

---

### Database (`packages/db`)

| Decision | Choice | Alternatives Considered | Rationale |
|---|---|---|---|
| Database engine | **PostgreSQL** | MySQL, SQLite | Best relational feature set, JSONB for flexible deal metadata, full-text search, wide hosting support |
| Hosting | **Neon** (serverless Postgres) | Supabase, Railway Postgres | Scales to zero = **$0 idle cost**; branching for dev/prod/preview envs; connection pooling built-in |
| ORM | **Drizzle ORM** | Prisma, Kysely | Lightweight, no query abstraction overhead, generates plain SQL, type-safe, supports Neon's HTTP driver |
| Caching / Queue backend | **Redis via Upstash** | self-hosted Redis, Valkey | Serverless = per-request pricing, **$0 idle cost**; HTTP REST API available; free tier covers development |

---

### Scraper (`packages/scraper`)

| Decision | Choice | Alternatives Considered | Rationale |
|---|---|---|---|
| Static HTML retailers | **Cheerio** | node-html-parser | Familiar jQuery-like API, fast, zero browser overhead — preferred path |
| JS-rendered retailers | **Playwright** (Chromium) | Puppeteer, Selenium | Better API than Puppeteer; supports Firefox/WebKit; use sparingly to control cost |

---

### Worker / Queue (`packages/worker`)

| Decision | Choice | Alternatives Considered | Rationale |
|---|---|---|---|
| Job queue | **BullMQ** | Celery, Temporal, pg-boss | Battle-tested on Redis; CRON scheduling, retries, concurrency control, rate limiting — all built-in |
| Queue backend | **Upstash Redis** | self-hosted Redis | Same Upstash instance used for caching; serverless pricing |

---

### Hosting & Deployment

| Service | Platform | Est. Cost (cold start) | Notes |
|---|---|---|---|
| `web` (Next.js) | **Vercel** | $0 | Free hobby tier; auto-scales CDN globally |
| `api` + `worker` | **Railway** | ~$5/mo | Pay-for-use containers; easy env var management |
| Database | **Neon** | $0 | Free tier (0.5 GB storage, 190 compute-hours/mo) |
| Redis | **Upstash** | $0 | Free tier (10K requests/day, 256 MB) |
| **Total cold start** | | **~$0–5/mo** | Scales smoothly as traffic grows |

---

## Consequences

✅ Entire stack is TypeScript end-to-end — one language, one toolchain  
✅ Serverless-first data layer eliminates idle infrastructure costs  
✅ Turborepo caching keeps CI fast as the repo grows  
✅ Hono + Neon's HTTP driver allows the API to run at the edge in future  
⚠️ Neon free tier has compute-hour limits — monitor and upgrade when traffic justifies it  
⚠️ Playwright increases Docker image size — consider a separate scraper service or browser pool when scaling
