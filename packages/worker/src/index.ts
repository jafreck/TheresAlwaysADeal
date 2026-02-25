import http from "node:http";
import { Worker, Queue } from "bullmq";
import { eq, and, desc } from "drizzle-orm";
import { db, games, stores, storeListings, priceHistory } from "@taad/db";
import { BaseScraper, type ScrapedGame } from "@taad/scraper";
import { scrapeQueue, ingestQueue, priceDropQueue } from "./queues.js";

const connection = { url: process.env.REDIS_URL! };
const SCRAPE_CRON = process.env.SCRAPE_CRON ?? "0 */6 * * *";
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
        }

        recordsFetched++;
      } catch {
        errorCount++;
      }
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
  process.exit(0);
});
