# There's Always a Deal

> Automated deal aggregation across the web — always fresh, always curated.

## Architecture

This is a **Turborepo monorepo** with four packages and a shared database layer:

```
TheresAlwaysADeal/
├── packages/
│   ├── web/        # Next.js 15 storefront (Tailwind + shadcn/ui)
│   ├── api/        # Hono REST API
│   ├── db/         # Drizzle ORM schema + Neon client
│   ├── scraper/    # Cheerio / Playwright scrapers
│   └── worker/     # BullMQ job workers + CRON scheduler
├── TECH_STACK.md   # Architecture Decision Record
├── turbo.json
├── pnpm-workspace.yaml
└── .env.example
```

See [TECH_STACK.md](./TECH_STACK.md) for all technology decisions and rationale.

---

## Prerequisites

| Tool | Version |
|---|---|
| Node.js | ≥ 20 |
| pnpm | ≥ 9 |

Install pnpm if needed:
```bash
corepack enable pnpm
```

---

## Getting Started

### 1. Clone & install dependencies

```bash
git clone https://github.com/jafreck/TheresAlwaysADeal.git
cd TheresAlwaysADeal
pnpm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
# Edit .env with your Neon DATABASE_URL, Upstash REDIS_URL, etc.
```

### 3. Run database migrations

```bash
pnpm --filter @taad/db db:push
```

---

## Running Services Locally

Each service can be started individually or all at once via Turborepo.

### All services (recommended)

```bash
pnpm dev
```

### Individual services

| Service | Command | Default Port |
|---|---|---|
| Web (Next.js) | `pnpm --filter @taad/web dev` | 3000 |
| API (Hono) | `pnpm --filter @taad/api dev` | 3001 |
| Worker (BullMQ) | `pnpm --filter @taad/worker dev` | — |
| Scraper (manual run) | `pnpm --filter @taad/scraper dev` | — |

---

## Common Commands

```bash
# Build all packages
pnpm build

# Type check all packages
pnpm type-check

# Lint all packages
pnpm lint

# Format all files
pnpm format

# Run all tests
pnpm test

# Database
pnpm --filter @taad/db db:generate   # Generate migration files
pnpm --filter @taad/db db:migrate    # Apply migrations
pnpm --filter @taad/db db:studio     # Open Drizzle Studio (DB GUI)
```

---

## Environment Variables

See [.env.example](./.env.example) for all required variables with descriptions.

---

## Contributing

1. Branch from `main`
2. Reference the issue number in your branch name (e.g. `feat/2-deal-ingestion`)
3. Ensure `pnpm lint && pnpm type-check && pnpm test` all pass before opening a PR
