import http from "node:http";
import { Worker, Queue } from "bullmq";
import { Redis } from "ioredis";
import { eq, and, desc, isNotNull, gte } from "drizzle-orm";
import { db, games, stores, storeListings, priceHistory, storeListingStats, users, wishlists, priceAlerts } from "@taad/db";
import { type BaseScraper, type ScrapedGame, buildReferralUrl } from "@taad/scraper";
import { sendPriceAlert, type PriceAlertData } from "@taad/email";
import { scrapeQueue, ingestQueue, priceDropQueue, allTimeLowQueue, featuredScrapeQueue, steamSyncQueue, emailQueue } from "./queues.js";

const connection = { url: process.env.REDIS_URL! };
const SCRAPE_CRON = process.env.SCRAPE_CRON ?? "0 */6 * * *";
const FEATURED_SCRAPE_CRON = process.env.FEATURED_SCRAPE_CRON ?? "0 * * * *";
const EPIC_SCRAPE_CRON = process.env.EPIC_SCRAPE_CRON ?? "0 0 * * *";
const STEAM_SYNC_CRON = process.env.STEAM_SYNC_CRON ?? "0 0 * * *";
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

// ─── Steam Wishlist Sync Worker ───────────────────────────────────────────────
const steamSyncWorker = new Worker(
  "steam-sync",
  async () => {
    const steamUsers = await db
      .select({ id: users.id, steamId: users.steamId })
      .from(users)
      .where(isNotNull(users.steamId));

    for (const user of steamUsers) {
      try {
        const res = await fetch(
          `https://store.steampowered.com/wishlist/profiles/${user.steamId}/wishlistdata/`,
        );

        if (!res.ok) {
          console.warn(
            JSON.stringify({ event: "steam-sync-private", userId: user.id, status: res.status }),
          );
          continue;
        }

        const data = await res.json();

        if (!data || typeof data !== "object" || Object.keys(data).length === 0) {
          console.warn(
            JSON.stringify({ event: "steam-sync-empty", userId: user.id }),
          );
          continue;
        }

        const appIds = Object.keys(data).map(Number).filter((id) => !isNaN(id) && id > 0);
        for (const appId of appIds) {
          const [game] = await db
            .select()
            .from(games)
            .where(eq(games.steamAppId, appId))
            .limit(1);

          if (!game) continue;

          // Check if wishlist entry already exists (no unique constraint on wishlists table)
          const [existing] = await db
            .select({ id: wishlists.id })
            .from(wishlists)
            .where(
              and(
                eq(wishlists.userId, user.id),
                eq(wishlists.gameId, game.id),
                eq(wishlists.source, "steam_sync"),
              ),
            )
            .limit(1);

          if (!existing) {
            await db
              .insert(wishlists)
              .values({ userId: user.id, gameId: game.id, source: "steam_sync" });
          }
        }
      } catch (err) {
        console.warn(
          JSON.stringify({ event: "steam-sync-error", userId: user.id, error: String(err) }),
        );
      }
    }
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

// ─── Notification processor (shared logic) ────────────────────────────────────
async function processNotification(job: { data: { storeListingId: string; newPrice: number; gameId: string; previousPrice?: number } }) {
  const { storeListingId, newPrice, gameId } = job.data;

  // Find active alerts for this game where targetPrice >= the triggered price
  const matchingAlerts = await db
    .select({
      alertId: priceAlerts.id,
      userId: priceAlerts.userId,
      email: users.email,
    })
    .from(priceAlerts)
    .innerJoin(users, eq(users.id, priceAlerts.userId))
    .where(
      and(
        eq(priceAlerts.gameId, gameId),
        eq(priceAlerts.isActive, true),
        gte(priceAlerts.targetPrice, String(newPrice)),
      ),
    );

  if (matchingAlerts.length === 0) return;

  // Get game title for the email
  const [game] = await db.select().from(games).where(eq(games.id, gameId)).limit(1);
  if (!game) return;

  // Get store listing details
  const [listing] = await db
    .select({ id: storeListings.id, storeUrl: storeListings.storeUrl, storeId: storeListings.storeId })
    .from(storeListings)
    .where(eq(storeListings.id, storeListingId))
    .limit(1);
  if (!listing) return;

  const [store] = await db.select().from(stores).where(eq(stores.id, listing.storeId)).limit(1);

  for (const alert of matchingAlerts) {
    await emailQueue.add("send-price-alert", {
      userId: alert.userId,
      alertId: alert.alertId,
      email: alert.email,
      gameTitle: game.title,
      gameId,
      storeListingId,
      storeUrl: listing.storeUrl,
      storeSlug: store?.slug ?? "",
      newPrice,
      previousPrice: job.data.previousPrice,
    });
  }
}

// ─── Price-Drop Notification Worker ───────────────────────────────────────────
const priceDropWorker = new Worker(
  "price-drop",
  async (job) => {
    await processNotification(job);
  },
  { connection },
);

// ─── All-Time-Low Notification Worker ─────────────────────────────────────────
const allTimeLowWorker = new Worker(
  "all-time-low",
  async (job) => {
    await processNotification(job);
  },
  { connection },
);

// ─── Email Worker ─────────────────────────────────────────────────────────────
const emailWorker = new Worker(
  "email",
  async (job) => {
    const { userId, alertId, email, gameTitle, storeListingId, storeUrl, storeSlug, newPrice } = job.data as {
      userId: string;
      alertId: string;
      email: string;
      gameTitle: string;
      gameId: string;
      storeListingId: string;
      storeUrl: string;
      storeSlug: string;
      newPrice: number;
      previousPrice?: number;
    };

    const referralUrl = buildReferralUrl(storeUrl, storeSlug);

    const priceData: PriceAlertData = {
      gameTitle,
      imageUrl: "",
      prices: [
        {
          storeName: storeSlug,
          price: `$${newPrice.toFixed(2)}`,
          referralUrl,
        },
      ],
      unsubscribeUrl: `${process.env.APP_URL ?? "http://localhost:3000"}/api/v1/alerts/${alertId}/unsubscribe`,
    };

    try {
      await sendPriceAlert(userId, alertId, priceData, email, storeListingId, String(newPrice));
    } catch (error) {
      console.error(`[email-worker] Failed to send price alert for alert ${alertId}:`, error);
    }
  },
  { connection },
);

// ─── CRON: schedule scrape jobs per store ─────────────────────────────────────
export async function scheduleScrapers() {
  const allStores = await db.select().from(stores);
  for (const store of allStores) {
    const pattern = store.slug === "epic-games" ? EPIC_SCRAPE_CRON : SCRAPE_CRON;
    await scrapeQueue.add(
      `scrape-${store.slug}`,
      { retailerDomain: store.slug },
      { repeat: { pattern }, attempts: 3 },
    );
  }
  // Schedule hourly featured-deal scrape for Steam
  await featuredScrapeQueue.add(
    "featured-scrape-steam",
    { retailerDomain: "steam" },
    { repeat: { pattern: FEATURED_SCRAPE_CRON }, attempts: 3 },
  );
  // Schedule daily Steam wishlist sync for all linked users
  await steamSyncQueue.add(
    "steam-sync-all",
    {},
    { repeat: { pattern: STEAM_SYNC_CRON } },
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
  await steamSyncWorker.close();
  await priceDropWorker.close();
  await allTimeLowWorker.close();
  await emailWorker.close();
  process.exit(0);
});
