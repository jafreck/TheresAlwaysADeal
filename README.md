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

### 2a. Local infra (Postgres + Redis via Docker)

If you want to run TAAD fully local without Neon/Upstash:

```bash
make infra-up
```

This runs `docker compose up -d` and, if needed on macOS, starts Colima automatically.

If Docker is unavailable, use Homebrew services instead:

```bash
brew install postgresql@16 redis
brew services start postgresql@16
brew services start redis
createdb taad || true
```

Set these values in `.env`:

```dotenv
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/taad"
REDIS_URL="redis://localhost:6379"
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""
```

For Homebrew Postgres, you may need your macOS username instead of `postgres`:

```dotenv
DATABASE_URL="postgresql://<your-macos-username>@localhost:5432/taad"
```

Initialize DB schema + seed data:

```bash
pnpm --filter @taad/db db:push
pnpm --filter @taad/db db:seed
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

The worker enqueues immediate startup scrape jobs by default (`SCRAPE_ON_STARTUP=true`).

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
