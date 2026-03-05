# Operational Runbook

This runbook covers day-to-day operational procedures for **There's Always a Deal**.

---

## Scrape Job Management

Scrape jobs are managed via BullMQ queues backed by Upstash Redis. The worker service (`packages/worker`) processes all queued jobs.

### Trigger a manual scrape

```bash
# Connect to the worker Railway service shell
railway run --service worker -- node -e "
  const { Queue } = require('bullmq');
  const q = new Queue('scrape', { connection: { url: process.env.REDIS_URL } });
  q.add('manual-scrape', { storeId: '<STORE_ID>' });
"
```

### Check queue status

```bash
# View pending and completed job counts
railway run --service worker -- node -e "
  const { Queue } = require('bullmq');
  const q = new Queue('scrape', { connection: { url: process.env.REDIS_URL } });
  q.getJobCounts().then(console.log);
"
```

### Clear failed jobs

```bash
railway run --service worker -- node -e "
  const { Queue } = require('bullmq');
  const q = new Queue('scrape', { connection: { url: process.env.REDIS_URL } });
  q.clean(0, 1000, 'failed').then(() => console.log('Cleared failed jobs'));
"
```

---

## Redis Cache Flush

The API uses Upstash Redis for response caching.

### Flush all cached responses

```bash
# Via Railway service shell
railway run --service api -- node -e "
  const { Redis } = require('@upstash/redis');
  const redis = new Redis({ url: process.env.REDIS_URL });
  redis.flushdb().then(() => console.log('Cache flushed'));
"
```

### Flush a specific cache key pattern

```bash
railway run --service api -- node -e "
  const { Redis } = require('@upstash/redis');
  const redis = new Redis({ url: process.env.REDIS_URL });
  // Example: flush all game-related cache keys
  redis.keys('games:*').then(keys => Promise.all(keys.map(k => redis.del(k)))).then(() => console.log('Done'));
"
```

> **Note:** Flushing cache causes a temporary increase in database load as requests repopulate the cache.

---

## Database Migration Steps

Database migrations use Drizzle ORM and target Neon Postgres.

### Run migrations on staging

```bash
DATABASE_URL="<staging-neon-url>" pnpm --filter @taad/db run db:migrate
```

### Run migrations on production

```bash
DATABASE_URL="<production-neon-url>" pnpm --filter @taad/db run db:migrate
```

### Generate a new migration

```bash
pnpm --filter @taad/db run db:generate
```

### Verify migration status

```bash
DATABASE_URL="<target-url>" pnpm --filter @taad/db run db:studio
```

> **Best practice:** Always run migrations on staging first and verify before applying to production.

---

## Deployment Process

### Production

1. Merge PR to `main` branch.
2. GitHub Actions runs the deploy workflow:
   - `audit` → dependency vulnerability scan
   - `build-and-push` → builds Docker images and pushes to GHCR
   - `migrate` → runs database migrations
   - `deploy` → deploys to Railway
3. Vercel auto-deploys `packages/web` from `main`.
4. Verify API health:
   ```bash
   curl https://api-prod.up.railway.app/health
   ```
5. Smoke-test the web app at the production URL.
6. Check Sentry for new errors.

### Staging

1. Push or merge to `staging` branch.
2. Same CI pipeline runs against staging environment.
3. Verify staging API health:
   ```bash
   curl https://api-staging.up.railway.app/health
   ```
4. Perform manual QA on the Vercel preview URL.

### Rollback

- **Web (Vercel):** Open Vercel dashboard → Deployments → Promote previous deployment to production.
- **API/Worker (Railway):** Open Railway dashboard → select service → Deployments → click Rollback.
- **Database (Neon):** Use Neon console point-in-time restore. Update `DATABASE_URL` if branch endpoint changes.

---

## Incident Response

### 1. Detection

- **Sentry alerts** for error spikes (configured via `SENTRY_DSN`).
- **Logtail dashboards** for log anomalies (configured via `LOGTAIL_SOURCE_TOKEN`).
- **Slack notifications** from GitHub Actions on deployment failures.
- **Railway metrics** for CPU/memory spikes.

### 2. Triage

1. Check Sentry for the error stack trace and affected users.
2. Check Logtail logs for the relevant service (api, worker).
3. Check Railway metrics for resource exhaustion.
4. Determine severity:
   - **P1 (Critical):** Site is down or data is corrupted → immediate rollback.
   - **P2 (High):** Feature broken, scraping stopped → fix within hours.
   - **P3 (Medium):** Degraded performance → fix within a day.

### 3. Mitigation

- **If caused by a bad deploy:** Rollback immediately (see Rollback section above).
- **If caused by database issue:** Check Neon dashboard for connection limits or storage. Restart API/worker if connections are exhausted.
- **If caused by Redis/queue issue:** Check Upstash dashboard for rate limits. Flush cache if stale data is the problem.
- **If caused by a scraper failure:** Check worker logs in Logtail. Clear failed jobs and re-enqueue.

### 4. Resolution

1. Apply a fix and deploy through the normal process.
2. Verify the fix resolves the issue in Sentry.
3. Document the incident: what happened, root cause, fix applied, and any follow-up actions.
