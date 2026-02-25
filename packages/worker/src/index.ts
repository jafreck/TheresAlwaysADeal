import http from "node:http";
import { Worker, Queue } from "bullmq";
import { Redis } from "ioredis";
import { eq, and, desc } from "drizzle-orm";
import { db, games, stores, storeListings, priceHistory, storeListingStats } from "@taad/db";
import { BaseScraper, type ScrapedGame } from "@taad/scraper";
import { scrapeQueue, ingestQueue, priceDropQueue, allTimeLowQueue, featuredScrapeQueue } from "./queues.js";

const connection = { url: process.env.REDIS_URL! };
const SCRAPE_CRON = process.env.SCRAPE_CRON ?? "0 */6 * * *";
const FEATURED_SCRAPE_CRON = process.env.FEATURED_SCRAPE_CRON ?? "0 * * * *";
const PORT = Number(process.env.PORT ?? 4000);

// Dead-letter queue for scrape jobs that exhaust all retries
const scrapeDlq = new Queue("scrape-dlq", { connection });

// ─── Scraper Registry ─────────────────────────────────────────────────────────
async function loadScraper(retailerDomain: string): Promise<BaseScraper> {
  try {
    const mod = await import(`./scrapers/${retailerDomain}.js`);
    const ScraperClass: new (cfg: { retailerDomain: string }) => BaseScraper =
      mod.default ?? Object.values(mod)[0];
    return new ScraperClass({ retailerDomain });
  } catch {
    throw new Error(`No scraper found for retailerDomain: ${retailerDomain}`);
  }
}

// ─── Scrape Worker ────────────────────────────────────────────────────────────
const scrapeWorker = new Worker(
  "scrape",
  async (job) => {
    const { retailerDomain } = job.data as { retailerDomain: string };
    const startTime = new Date().toISOString();
    let recordsFetched = 0;
    let errorCount = 0;

    const scraper = await loadScraper(retailerDomain);
    const rawItems = await scraper.fetchGames();
    const normalized: ScrapedGame[] = [];

    for (const raw of rawItems) {
      try {
        normalized.push(scraper.normalizeGame(raw));
      } catch {
        errorCount++;
      }
    }

    recordsFetched = normalized.length;

    await ingestQueue.add("ingest-deals", { deals: normalized, retailerDomain });

    const endTime = new Date().toISOString();
    console.log(JSON.stringify({ storeName: retailerDomain, startTime, endTime, recordsFetched, errorCount }));
  },
  { connection, concurrency: Number(process.env.SCRAPER_CONCURRENCY ?? 3) },
);

// Move exhausted scrape jobs to the DLQ
scrapeWorker.on("failed", async (job, err) => {
  if (!job) return;
  if (job.attemptsMade >= (job.opts.attempts ?? 1)) {
    await scrapeDlq.add("failed-scrape", { ...job.data, error: err.message });
  }
});

// ─── Featured Scrape Worker ───────────────────────────────────────────────────
// Reuses the same scrapeWorker processor logic by forwarding to the scrape queue.
const featuredScrapeWorker = new Worker(
  "featured-scrape",
  async (job) => {
    const { retailerDomain } = job.data as { retailerDomain: string };
    const startTime = new Date().toISOString();
    let recordsFetched = 0;
    let errorCount = 0;

    const scraper = await loadScraper(retailerDomain);
    const rawItems = await scraper.fetchGames();
    const normalized: ScrapedGame[] = [];

    for (const raw of rawItems) {
      try {
        normalized.push(scraper.normalizeGame(raw));
      } catch {
        errorCount++;
      }
    }

    recordsFetched = normalized.length;

    await ingestQueue.add("ingest-deals", { deals: normalized, retailerDomain });

    const endTime = new Date().toISOString();
    console.log(JSON.stringify({ storeName: retailerDomain, startTime, endTime, recordsFetched, errorCount }));
  },
  { connection, concurrency: 1 },
);

// ─── Stats Refresh ────────────────────────────────────────────────────────────
async function refreshStoreListingStats(redis: Redis) {
  const allListings = await db.select({ id: storeListings.id }).from(storeListings);

  const scoreEntries: Array<{ storeListingId: string; dealScore: number }> = [];

  for (const listing of allListings) {
    const history = await db
      .select()
      .from(priceHistory)
      .where(eq(priceHistory.storeListingId, listing.id));

    if (history.length === 0) continue;

    // All-time low computation
    let allTimeLowPrice = Infinity;
    let allTimeLowDiscount: number | null = null;
    let allTimeLowLastSeenAt: Date | null = null;
    for (const row of history) {
      const p = Number(row.price);
      if (p < allTimeLowPrice) {
        allTimeLowPrice = p;
        allTimeLowDiscount = row.discount != null ? Number(row.discount) : null;
        allTimeLowLastSeenAt = new Date(row.recordedAt);
      }
    }

    // 30-day and 90-day averages
    const now = Date.now();
    const ms30 = 30 * 24 * 60 * 60 * 1000;
    const ms90 = 90 * 24 * 60 * 60 * 1000;
    const h30 = history.filter((h) => new Date(h.recordedAt).getTime() >= now - ms30);
    const h90 = history.filter((h) => new Date(h.recordedAt).getTime() >= now - ms90);
    const avg30 = h30.length > 0 ? h30.reduce((s, h) => s + Number(h.price), 0) / h30.length : null;
    const avg90 = h90.length > 0 ? h90.reduce((s, h) => s + Number(h.price), 0) / h90.length : null;

    // Deal score using the most-recent record
    const latest = [...history].sort(
      (a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime(),
    )[0];
    const discountPercent = latest.discount != null ? Number(latest.discount) : 0;
    const originalPriceDollars =
      latest.originalPrice != null ? Number(latest.originalPrice) : Number(latest.price);
    const rawDealScore = discountPercent * Math.log(originalPriceDollars + 1);

    const latestPrice = Number(latest.price);
    const isAtAllTimeLow = latestPrice <= allTimeLowPrice;

    scoreEntries.push({ storeListingId: listing.id, dealScore: rawDealScore });

    await db
      .insert(storeListingStats)
      .values({
        storeListingId: listing.id,
        allTimeLowPrice: String(allTimeLowPrice),
        allTimeLowDiscount: allTimeLowDiscount != null ? String(allTimeLowDiscount) : undefined,
        avg30DayPrice: avg30 != null ? String(avg30) : undefined,
        avg90DayPrice: avg90 != null ? String(avg90) : undefined,
        isAllTimeLow: isAtAllTimeLow,
        allTimeLowLastSeenAt: allTimeLowLastSeenAt ?? undefined,
      })
      .onConflictDoUpdate({
        target: storeListingStats.storeListingId,
        set: {
          allTimeLowPrice: String(allTimeLowPrice),
          allTimeLowDiscount: allTimeLowDiscount != null ? String(allTimeLowDiscount) : undefined,
          avg30DayPrice: avg30 != null ? String(avg30) : undefined,
          avg90DayPrice: avg90 != null ? String(avg90) : undefined,
          isAllTimeLow: isAtAllTimeLow,
          allTimeLowLastSeenAt: allTimeLowLastSeenAt ?? undefined,
          updatedAt: new Date(),
        },
      });
  }

  // Normalize deal scores to 0–100 and write to Redis sorted set
  const maxRaw = Math.max(...scoreEntries.map((e) => e.dealScore), 0);
  const zaddArgs: (number | string)[] = [];

  for (const { storeListingId, dealScore } of scoreEntries) {
    const normalizedScore = maxRaw > 0 ? (dealScore / maxRaw) * 100 : 0;

    await db
      .update(storeListingStats)
      .set({ dealScore: String(normalizedScore), updatedAt: new Date() })
      .where(eq(storeListingStats.storeListingId, storeListingId));

    zaddArgs.push(normalizedScore, storeListingId);
  }

  if (zaddArgs.length > 0) {
    await redis.zadd("deal_scores", ...zaddArgs);
    await redis.expire("deal_scores", 3600);
  }
}

// ─── Ingest Worker ────────────────────────────────────────────────────────────
const ingestWorker = new Worker(
  "ingest",
  async (job) => {
    const { deals, retailerDomain } = job.data as { deals: ScrapedGame[]; retailerDomain: string };
    const startTime = new Date().toISOString();
    let recordsFetched = 0;
    let errorCount = 0;

    for (const deal of deals) {
      try {
        // Upsert game
        await db
          .insert(games)
          .values({ title: deal.title, slug: deal.slug })
          .onConflictDoUpdate({ target: games.slug, set: { title: deal.title, updatedAt: new Date() } });

        const [dbGame] = await db.select().from(games).where(eq(games.slug, deal.slug)).limit(1);
        if (!dbGame) continue;

        // Resolve store by slug
        const [store] = await db.select().from(stores).where(eq(stores.slug, deal.storeSlug)).limit(1);
        if (!store) continue;

        // Upsert store listing
        let [listing] = await db
          .select()
          .from(storeListings)
          .where(and(eq(storeListings.gameId, dbGame.id), eq(storeListings.storeId, store.id)))
          .limit(1);

        if (!listing) {
          [listing] = await db
            .insert(storeListings)
            .values({ gameId: dbGame.id, storeId: store.id, storeUrl: deal.storeUrl, storeGameId: deal.storeGameId })
            .returning();
        } else {
          await db
            .update(storeListings)
            .set({ storeUrl: deal.storeUrl, storeGameId: deal.storeGameId, updatedAt: new Date() })
            .where(eq(storeListings.id, listing.id));
        }

        if (!listing) continue;

        // Query most recent price history record for this listing
        const [latestPrice] = await db
          .select()
          .from(priceHistory)
          .where(eq(priceHistory.storeListingId, listing.id))
          .orderBy(desc(priceHistory.recordedAt))
          .limit(1);

        const newPrice = deal.price;
        const newDiscount = deal.discountPercent ?? null;

        // Only insert a new row if price or discount has changed (or no prior record exists)
        const priceChanged =
          !latestPrice ||
          Number(latestPrice.price) !== newPrice ||
          (latestPrice.discount !== null ? Number(latestPrice.discount) : null) !== newDiscount;

        if (priceChanged) {
          await db.insert(priceHistory).values({
            storeListingId: listing.id,
            price: String(newPrice),
            originalPrice: deal.originalPrice != null ? String(deal.originalPrice) : undefined,
            currency: deal.currency,
            discount: newDiscount != null ? String(newDiscount) : undefined,
            saleEndsAt: deal.saleEndsAt != null ? new Date(deal.saleEndsAt) : undefined,
          });

          // Emit price-drop event when the new price is lower than the previous
          if (latestPrice && newPrice < Number(latestPrice.price)) {
            await priceDropQueue.add("price-drop", {
              storeListingId: listing.id,
              previousPrice: Number(latestPrice.price),
              newPrice,
              gameId: dbGame.id,
            });
          }

          // All-time-low detection
          const [currentStats] = await db
            .select()
            .from(storeListingStats)
            .where(eq(storeListingStats.storeListingId, listing.id))
            .limit(1);

          const isNewAllTimeLow =
            !currentStats?.allTimeLowPrice || newPrice < Number(currentStats.allTimeLowPrice);

          if (isNewAllTimeLow) {
            await db
              .update(storeListings)
              .set({ isAllTimeLow: true, updatedAt: new Date() })
              .where(eq(storeListings.id, listing.id));

            await allTimeLowQueue.add("PRICE_ALL_TIME_LOW", {
              storeListingId: listing.id,
              newPrice,
              gameId: dbGame.id,
            });
          } else {
            await db
              .update(storeListings)
              .set({ isAllTimeLow: false, updatedAt: new Date() })
              .where(eq(storeListings.id, listing.id));
          }
        }

        recordsFetched++;
      } catch {
        errorCount++;
      }
    }

    // Refresh stats and update Redis deal-score cache after all deals are processed
    const redis = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL) : null;
    if (redis) {
      await refreshStoreListingStats(redis);
      redis.disconnect();
    }

    const endTime = new Date().toISOString();
    console.log(JSON.stringify({ storeName: retailerDomain, startTime, endTime, recordsFetched, errorCount }));
  },
  { connection },
);

// ─── CRON: schedule scrape jobs per store ─────────────────────────────────────
async function scheduleScrapers() {
  const allStores = await db.select().from(stores);
  for (const store of allStores) {
    await scrapeQueue.add(
      `scrape-${store.slug}`,
      { retailerDomain: store.slug },
      { repeat: { pattern: SCRAPE_CRON }, attempts: 3 },
    );
  }
  // Schedule hourly featured-deal scrape for Steam
  await featuredScrapeQueue.add(
    "featured-scrape-steam",
    { retailerDomain: "steam" },
    { repeat: { pattern: FEATURED_SCRAPE_CRON }, attempts: 3 },
  );
  console.log(JSON.stringify({ event: "cron-scheduled", storeCount: allStores.length, pattern: SCRAPE_CRON }));
}

scheduleScrapers().catch((err) => {
  console.error(JSON.stringify({ event: "cron-schedule-error", error: String(err) }));
});

// ─── HTTP Server (health, metrics, admin) ─────────────────────────────────────
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);
  const method = req.method ?? "GET";

  if (method === "GET" && url.pathname === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
    return;
  }

  if (method === "GET" && url.pathname === "/metrics") {
    const toMetrics = async (q: Queue) => ({
      waiting: await q.getWaitingCount(),
      active: await q.getActiveCount(),
      completed: await q.getCompletedCount(),
      failed: await q.getFailedCount(),
    });

    const [scrape, ingest, priceDrop] = await Promise.all([
      toMetrics(scrapeQueue),
      toMetrics(ingestQueue),
      toMetrics(priceDropQueue),
    ]);

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ scrape, ingest, priceDrop }));
    return;
  }

  const scrapeMatch = url.pathname.match(/^\/jobs\/scrape\/([^/]+)$/);
  if (method === "POST" && scrapeMatch) {
    const retailerDomain = scrapeMatch[1];
    const job = await scrapeQueue.add("scrape-manual", { retailerDomain }, { attempts: 3 });
    res.writeHead(202, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ jobId: job.id }));
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
});

server.listen(PORT, () => {
  console.log(JSON.stringify({ event: "http-server-started", port: PORT }));
});

console.log(JSON.stringify({ event: "worker-started" }));

// ─── Graceful Shutdown ────────────────────────────────────────────────────────
process.on("SIGTERM", async () => {
  server.close();
  await scrapeWorker.close();
  await ingestWorker.close();
  await featuredScrapeWorker.close();
  process.exit(0);
});
