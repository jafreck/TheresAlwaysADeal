# Infrastructure

This document describes the production and staging architecture for **There's Always a Deal**, including platform choices, environment variables, cost estimates, and operational runbooks.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                          Users (browser)                        │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTPS
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│              Vercel (Next.js Web — packages/web)                │
│  prod:    https://theres-always-a-deal.vercel.app               │
│  staging: https://theres-always-a-deal-git-staging.vercel.app   │
└──────────────────────────────┬──────────────────────────────────┘
                               │ REST (NEXT_PUBLIC_API_URL)
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│              Railway (Hono API — packages/api)                  │
│  prod:    https://api-prod.up.railway.app                       │
│  staging: https://api-staging.up.railway.app                    │
│  health:  GET /health → { status, timestamp, version }          │
└────────────────┬──────────────────────────┬─────────────────────┘
                 │ SQL (DATABASE_URL)        │ Redis (REDIS_URL)
                 ▼                          ▼
┌───────────────────────┐      ┌────────────────────────────────┐
│  Neon (Postgres)      │      │  Upstash (Redis)               │
│  prod + staging DBs   │      │  BullMQ queues: scrape, ingest │
└───────────────────────┘      └────────────────────┬───────────┘
                                                    │ BullMQ jobs
                                                    ▼
                               ┌────────────────────────────────┐
                               │  Railway (Worker — packages/   │
                               │  worker, includes scraper)     │
                               │  prod:    worker-prod service  │
                               │  staging: worker-staging svc   │
                               └────────────────────────────────┘
```

---

## Services Table

| Service | Platform | URL Pattern | Resources |
|---------|----------|-------------|-----------|
| Web (Next.js) | Vercel | `theres-always-a-deal[-git-<branch>].vercel.app` | Serverless functions, Edge CDN |
| API (Hono) | Railway | `api-<env>.up.railway.app` | 512 MB RAM, 0.5 vCPU |
| Worker + Scraper | Railway | internal (no public URL) | 512 MB RAM, 0.5 vCPU |
| Database | Neon | `ep-xxx.<region>.aws.neon.tech` | Serverless Postgres, branching |
| Queue / Cache | Upstash | `xxx.upstash.io` | Serverless Redis |

### Environments

| Environment | Branch | Purpose |
|-------------|--------|---------|
| **production** | `main` | Live traffic |
| **staging** | `staging` | Pre-release validation; mirrors prod config |

Staging uses separate Neon database branches and a separate Upstash database to avoid polluting production data.

---

## Scraper Topology Decision

**Decision: bundle scraper inside the worker service.**

The scraper (`packages/scraper`) is imported directly by `packages/worker` as a workspace package (`@taad/scraper`). There is no separate Railway service for the scraper.

**Rationale:**
- The scraper is triggered exclusively by BullMQ jobs enqueued by the worker; it has no independent trigger or public interface.
- Running a single Railway service (worker + scraper) eliminates inter-service network latency and simplifies deployment.
- A separate scraper service would require its own Railway deployment, adding cost and operational overhead without benefit at current scale.
- If scraper resource usage grows significantly, extracting it to its own service is straightforward because the scraper is already a standalone workspace package.

---

## Environment Variables

### Web (`packages/web`) — Vercel

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | Base URL of the Hono API (e.g. `https://api-prod.up.railway.app`) |
| `NEXTAUTH_SECRET` | If auth added | Random secret for NextAuth session signing |
| `NEXTAUTH_URL` | If auth added | Canonical URL of the web app |
| `SENTRY_DSN` | Yes (prod) | Sentry project DSN for error tracking |

### API (`packages/api`) — Railway

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Neon Postgres connection string (`postgresql://...?sslmode=require`) |
| `API_PORT` | No | Port to bind (default `3001`) |
| `API_SECRET` | Yes (prod) | Shared secret for internal auth |
| `NEXT_PUBLIC_API_URL` | Yes | Used in CORS `origin` allowlist |
| `SENTRY_DSN` | Yes (prod) | Sentry DSN for error tracking |
| `LOGTAIL_SOURCE_TOKEN` | Yes (prod) | Logtail (Better Stack) structured log ingestion token |

### Worker (`packages/worker`) — Railway

| Variable | Required | Description |
|----------|----------|-------------|
| `REDIS_URL` | Yes | Upstash Redis connection string (`rediss://...`) |
| `DATABASE_URL` | Yes | Neon Postgres connection string (for ingest upserts) |
| `SCRAPER_CONCURRENCY` | No | Max concurrent browser contexts (default `3`) |
| `SCRAPER_PROXIES` | No | Comma-separated proxy URLs for scraper rotation |
| `SENTRY_DSN` | Yes (prod) | Sentry DSN for error tracking |
| `LOGTAIL_SOURCE_TOKEN` | Yes (prod) | Logtail structured log ingestion token |

---

## Observability

### Logging — Logtail (Better Stack)

**Choice: Logtail** (Better Stack)

**Rationale:**
- Structured JSON log ingestion with a generous free tier (1 GB/month retained 3 days).
- Native Node.js SDK and simple `LOGTAIL_SOURCE_TOKEN` configuration — no sidecar agent needed.
- Live tail, search, and dashboards available out of the box; integrates with Railway log drains.

Configure via `LOGTAIL_SOURCE_TOKEN` in all backend services (api, worker).

### Error Monitoring — Sentry (free tier)

**Choice: Sentry free tier**

**Rationale:**
- Industry-standard error tracking with source maps, breadcrumbs, and release tracking.
- Free tier (5 K errors/month) is sufficient for early-stage traffic.
- SDKs available for Next.js, Node.js, and browser — covers all three surfaces (web, api, worker) from a single project DSN.
- Zero infrastructure to operate; errors are captured and alerted via the Sentry SaaS dashboard.

Configure via `SENTRY_DSN` in all services.

---

## Estimated Monthly Cost

Costs below assume moderate traffic (<50 K daily visitors, <1 M queue jobs/month).

| Service | Plan | Est. Cost/Month |
|---------|------|-----------------|
| Vercel (Web) | Hobby (free) | $0 |
| Railway (API) | Starter — ~$5 usage credit | ~$5 |
| Railway (Worker) | Starter — ~$5 usage credit | ~$5 |
| Neon (Postgres) | Free tier (0.5 GB) | $0 |
| Upstash (Redis) | Free tier (10 K commands/day) | $0 |
| Sentry | Free tier | $0 |
| Logtail | Free tier | $0 |
| **Total** | | **~$10/month** |

> Costs increase if Railway usage exceeds the $5 credit, Neon storage exceeds 0.5 GB, or Upstash commands exceed the free quota. Review the Railway usage dashboard monthly.

---

## Deployment Runbook

### Production Deployment

1. **Merge to `main`.**
   - Vercel automatically builds and deploys `packages/web`.
   - Railway automatically builds and deploys `packages/api` and `packages/worker` (via Railway GitHub integration connected to `main`).

2. **Verify health check** (API):
   ```bash
   curl https://api-prod.up.railway.app/health
   # Expected: {"status":"ok","timestamp":"...","version":"..."}
   ```

3. **Run DB migrations** (if schema changed):
   ```bash
   DATABASE_URL="<prod-url>" pnpm --filter @taad/db run db:migrate
   ```

4. **Smoke-test the web app** by visiting the production URL and confirming deals load.

5. **Check Sentry** for any new error spikes after deploy.

### Staging Deployment

1. **Push or merge to `staging` branch.**
   - Vercel deploys a preview environment automatically.
   - Railway deploys staging services if a `staging` environment is configured in the Railway project.

2. **Run DB migrations against the staging Neon branch:**
   ```bash
   DATABASE_URL="<staging-url>" pnpm --filter @taad/db run db:migrate
   ```

3. **Verify health check** (staging API):
   ```bash
   curl https://api-staging.up.railway.app/health
   ```

4. **Perform manual QA** on the Vercel preview URL before merging to `main`.

---

## Rollback Procedure

### Web (Vercel)

1. Open the Vercel dashboard → **Deployments**.
2. Find the last known-good deployment.
3. Click **⋯ → Promote to Production**.
4. Verify the production URL is serving the previous build.

### API / Worker (Railway)

1. Open the Railway dashboard → select the affected service → **Deployments**.
2. Find the last known-good deployment.
3. Click **Rollback** (Railway reuses the previously built image).
4. Verify the health check returns `"status":"ok"`.

### Database (Neon)

Neon supports point-in-time restore for production branches:

1. Open the Neon console → **Branches** → select `main`.
2. Click **Restore** and choose a timestamp before the bad migration.
3. Update `DATABASE_URL` in Railway env vars to the restored branch endpoint if the branch URL changed.
4. Restart API and Worker services in Railway.

> **Prevention:** always run migrations on staging first and test thoroughly before applying to production.
