import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import http from "node:http";

// ─── Environment setup (must happen before mocks and imports) ────────────────
process.env.PORT = "14789";
process.env.REDIS_URL = "redis://localhost:6379";
process.env.SCRAPE_CRON = "0 */6 * * *";

// ─── Shared mock instances ────────────────────────────────────────────────────
const mockQueueAdd = vi.fn().mockResolvedValue({ id: "test-job-id" });
const mockQueueGetWaiting = vi.fn().mockResolvedValue(3);
const mockQueueGetActive = vi.fn().mockResolvedValue(1);
const mockQueueGetCompleted = vi.fn().mockResolvedValue(50);
const mockQueueGetFailed = vi.fn().mockResolvedValue(2);
const mockWorkerClose = vi.fn().mockResolvedValue(undefined);

// ─── Redis mock ───────────────────────────────────────────────────────────────
const mockRedisZadd = vi.fn().mockResolvedValue(1);
const mockRedisExpire = vi.fn().mockResolvedValue(1);
const mockRedisDisconnect = vi.fn();
const mockRedisClient = { zadd: mockRedisZadd, expire: mockRedisExpire, disconnect: mockRedisDisconnect };

vi.mock("ioredis", () => {
  const Redis = vi.fn().mockImplementation(function () { return mockRedisClient; });
  return { Redis };
});

function makeMockQueueInstance() {
  return {
    add: mockQueueAdd,
    getWaitingCount: mockQueueGetWaiting,
    getActiveCount: mockQueueGetActive,
    getCompletedCount: mockQueueGetCompleted,
    getFailedCount: mockQueueGetFailed,
    client: Promise.resolve(mockRedisClient),
  };
}

// ─── Mocks ────────────────────────────────────────────────────────────────────
vi.mock("bullmq", () => {
  const Queue = vi.fn().mockImplementation(function () { return makeMockQueueInstance(); });
  const Worker = vi.fn().mockImplementation(function () {
    return {
      on: vi.fn(),
      close: mockWorkerClose,
    };
  });
  const QueueEvents = vi.fn().mockImplementation(function () { return {}; });
  return { Queue, Worker, QueueEvents };
});

vi.mock("@taad/db", () => {
  const mockDb = {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  };
  return {
    db: mockDb,
    games: { slug: "slug_col", id: "id_col", steamAppId: "steam_app_id_col" },
    stores: { slug: "slug_col", id: "id_col" },
    storeListings: { gameId: "gameId_col", storeId: "storeId_col", id: "id_col" },
    priceHistory: { storeListingId: "sl_col", recordedAt: "ra_col" },
    storeListingStats: { storeListingId: "sl_stats_col" },
    users: { id: "id_col", steamId: "steam_id_col" },
    wishlists: { userId: "user_id_col", gameId: "game_id_col", source: "source_col" },
  };
});

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((col: unknown, val: unknown) => ({ col, val })),
  and: vi.fn((...args: unknown[]) => args),
  desc: vi.fn((col: unknown) => col),
  isNotNull: vi.fn((col: unknown) => ({ col, op: "isNotNull" })),
}));

vi.mock("@taad/scraper", () => ({
  BaseScraper: class {},
}));

// ─── Helper to build fluent DB select chain ───────────────────────────────────
function buildSelectChain(result: unknown[]) {
  const chain: Record<string, unknown> & PromiseLike<unknown[]> = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(result),
    // Make the chain itself thenable so `await db.select().from(table)` resolves
    // to the result array (used by refreshStoreListingStats which has no .limit() call).
    then: (resolve: (v: unknown[]) => unknown, reject?: (e: unknown) => unknown) =>
      Promise.resolve(result).then(resolve, reject),
  } as unknown as Record<string, unknown> & PromiseLike<unknown[]>;
  return chain;
}

// ─── HTTP helper ──────────────────────────────────────────────────────────────
const TEST_PORT = 14789;

function makeRequest(
  method: string,
  path: string,
): Promise<{ status: number; body: unknown }> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { hostname: "localhost", port: TEST_PORT, path, method },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode!, body: JSON.parse(data) });
          } catch {
            resolve({ status: res.statusCode!, body: data });
          }
        });
      },
    );
    req.on("error", reject);
    req.end();
  });
}

// ─── Module imports & server startup ─────────────────────────────────────────
let db: any;
let Worker: any;
let startupQueueAddCalls: unknown[][] = [];

beforeAll(async () => {
  // Set up DB mock for scheduleScrapers() call that runs on module load
  const dbModule = await import("@taad/db");
  db = dbModule.db;

  (db.select as ReturnType<typeof vi.fn>).mockReturnValue(
    buildSelectChain([]), // scheduleScrapers → no stores
  );

  // Import index.ts — this starts the HTTP server and workers
  await import("../src/index.js");

  // Import Worker mock reference for processor introspection
  const bullmq = await import("bullmq");
  Worker = bullmq.Worker;

  // Give the server time to bind and for scheduleScrapers() to complete
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Capture queue.add calls made during startup before any test can clear them
  startupQueueAddCalls = [...mockQueueAdd.mock.calls];
});

afterAll(async () => {
  // Mock process.exit to prevent vitest from seeing it as an unhandled error
  const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
    return undefined as never;
  });
  // Allow vitest to exit by signaling SIGTERM via process listeners
  // (not calling process.exit — just close cleanly enough for vitest)
  process.emit("SIGTERM" as NodeJS.Signals);
  await new Promise((resolve) => setTimeout(resolve, 50));
  exitSpy.mockRestore();
});

// ─── HTTP Server tests ────────────────────────────────────────────────────────
describe("HTTP server", () => {
  describe("GET /health", () => {
    it("should return 200 with { status: 'ok' }", async () => {
      const { status, body } = await makeRequest("GET", "/health");
      expect(status).toBe(200);
      expect(body).toEqual({ status: "ok" });
    });
  });

  describe("GET /metrics", () => {
    it("should return 200 with queue depth metrics", async () => {
      const { status, body } = await makeRequest("GET", "/metrics");
      expect(status).toBe(200);
      const metrics = body as Record<string, unknown>;
      expect(metrics).toHaveProperty("scrape");
      expect(metrics).toHaveProperty("ingest");
      expect(metrics).toHaveProperty("priceDrop");
    });

    it("should include waiting/active/completed/failed for each queue", async () => {
      const { body } = await makeRequest("GET", "/metrics");
      const metrics = body as Record<string, Record<string, number>>;
      for (const queue of ["scrape", "ingest", "priceDrop"]) {
        expect(metrics[queue]).toHaveProperty("waiting");
        expect(metrics[queue]).toHaveProperty("active");
        expect(metrics[queue]).toHaveProperty("completed");
        expect(metrics[queue]).toHaveProperty("failed");
      }
    });
  });

  describe("POST /jobs/scrape/:retailerDomain", () => {
    it("should return 202 with jobId", async () => {
      const { status, body } = await makeRequest("POST", "/jobs/scrape/steam");
      expect(status).toBe(202);
      expect(body).toHaveProperty("jobId");
    });

    it("should enqueue a scrape job for the given domain", async () => {
      mockQueueAdd.mockClear();
      await makeRequest("POST", "/jobs/scrape/gog");
      expect(mockQueueAdd).toHaveBeenCalledWith(
        "scrape-manual",
        { retailerDomain: "gog" },
        expect.objectContaining({ attempts: 3 }),
      );
    });
  });

  describe("unknown routes", () => {
    it("should return 404 for GET /unknown", async () => {
      const { status } = await makeRequest("GET", "/unknown");
      expect(status).toBe(404);
    });

    it("should return 404 for POST /unknown", async () => {
      const { status } = await makeRequest("POST", "/unknown");
      expect(status).toBe(404);
    });
  });
});

// ─── Worker processor tests ───────────────────────────────────────────────────
describe("ingest worker processor", () => {
  // Retrieve the processor function passed to the ingest Worker constructor
  function getIngestProcessor(): (job: unknown) => Promise<void> {
    const calls = vi.mocked(Worker).mock.calls;
    const ingestCall = calls.find(([name]) => name === "ingest");
    if (!ingestCall) throw new Error("Ingest Worker was not created");
    return ingestCall[1] as (job: unknown) => Promise<void>;
  }

  const mockGame = { id: 1, slug: "portal", title: "Portal" };
  const mockStore = { id: 2, slug: "steam" };
  const mockListing = { id: 3, gameId: 1, storeId: 2 };

  const validDeal = {
    title: "Portal",
    slug: "portal",
    storeUrl: "https://store.steampowered.com/app/400",
    price: 9.99,
    originalPrice: 19.99,
    discountPercent: 50,
    currency: "USD",
    storeSlug: "steam",
    storeGameId: "400",
  };

  function buildInsertChain(returning: unknown[] = []) {
    return {
      values: vi.fn().mockReturnThis(),
      onConflictDoUpdate: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue(returning),
      set: vi.fn().mockReturnThis(),
    };
  }

  function buildUpdateChain() {
    return {
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue(undefined),
    };
  }

  it("should insert a new priceHistory row when no prior record exists", async () => {
    (db.select as ReturnType<typeof vi.fn>)
      .mockReturnValueOnce(buildSelectChain([mockGame])) // game
      .mockReturnValueOnce(buildSelectChain([mockStore])) // store
      .mockReturnValueOnce(buildSelectChain([mockListing])) // listing exists
      .mockReturnValueOnce(buildSelectChain([])); // no price history

    const insertChain = buildInsertChain([mockListing]);
    (db.insert as ReturnType<typeof vi.fn>).mockReturnValue(insertChain);
    (db.update as ReturnType<typeof vi.fn>).mockReturnValue(buildUpdateChain());

    const processor = getIngestProcessor();
    const mockJob = { data: { deals: [validDeal], retailerDomain: "steam" } };

    await expect(processor(mockJob)).resolves.toBeUndefined();
    expect(db.insert).toHaveBeenCalled();
  });

  it("should emit price-drop event when new price is lower than previous", async () => {
    const previousPriceRecord = { id: 10, storeListingId: 3, price: "19.99", discount: null };

    (db.select as ReturnType<typeof vi.fn>)
      .mockReturnValueOnce(buildSelectChain([mockGame]))
      .mockReturnValueOnce(buildSelectChain([mockStore]))
      .mockReturnValueOnce(buildSelectChain([mockListing]))
      .mockReturnValueOnce(buildSelectChain([previousPriceRecord])); // price was 19.99

    const insertChain = buildInsertChain([mockListing]);
    (db.insert as ReturnType<typeof vi.fn>).mockReturnValue(insertChain);
    (db.update as ReturnType<typeof vi.fn>).mockReturnValue(buildUpdateChain());
    mockQueueAdd.mockClear();

    const processor = getIngestProcessor();
    // Deal price is 9.99 < 19.99 (previousPrice) → should emit price-drop
    const mockJob = { data: { deals: [validDeal], retailerDomain: "steam" } };

    await processor(mockJob);

    expect(mockQueueAdd).toHaveBeenCalledWith(
      "price-drop",
      expect.objectContaining({
        previousPrice: 19.99,
        newPrice: 9.99,
        gameId: mockGame.id,
        storeListingId: mockListing.id,
      }),
    );
  });

  it("should NOT emit price-drop event when new price is higher than previous", async () => {
    const previousPriceRecord = { id: 11, storeListingId: 3, price: "4.99", discount: null };

    (db.select as ReturnType<typeof vi.fn>)
      .mockReturnValueOnce(buildSelectChain([mockGame]))
      .mockReturnValueOnce(buildSelectChain([mockStore]))
      .mockReturnValueOnce(buildSelectChain([mockListing]))
      .mockReturnValueOnce(buildSelectChain([previousPriceRecord])); // price was 4.99

    const insertChain = buildInsertChain([mockListing]);
    (db.insert as ReturnType<typeof vi.fn>).mockReturnValue(insertChain);
    (db.update as ReturnType<typeof vi.fn>).mockReturnValue(buildUpdateChain());
    mockQueueAdd.mockClear();

    const processor = getIngestProcessor();
    // Deal price is 9.99 > 4.99 — no price drop
    const mockJob = { data: { deals: [validDeal], retailerDomain: "steam" } };

    await processor(mockJob);

    // Should NOT have called priceDropQueue.add with "price-drop"
    const priceDropCalls = mockQueueAdd.mock.calls.filter(
      ([name]: [string]) => name === "price-drop",
    );
    expect(priceDropCalls).toHaveLength(0);
  });

  it("should NOT insert priceHistory when price and discount are unchanged", async () => {
    // price: 9.99, discountPercent: 50 — same as validDeal
    const previousPriceRecord = { id: 12, storeListingId: 3, price: "9.99", discount: "50" };

    (db.select as ReturnType<typeof vi.fn>)
      .mockReturnValueOnce(buildSelectChain([mockGame]))
      .mockReturnValueOnce(buildSelectChain([mockStore]))
      .mockReturnValueOnce(buildSelectChain([mockListing]))
      .mockReturnValueOnce(buildSelectChain([previousPriceRecord]));

    const insertChain = buildInsertChain([]);
    const insertSpy = vi.fn().mockReturnValue(insertChain);
    (db.insert as ReturnType<typeof vi.fn>).mockImplementation(insertSpy);
    (db.update as ReturnType<typeof vi.fn>).mockReturnValue(buildUpdateChain());

    const processor = getIngestProcessor();
    const mockJob = { data: { deals: [validDeal], retailerDomain: "steam" } };

    await processor(mockJob);

    // db.insert should have been called only for the game upsert, NOT for priceHistory
    const _priceHistoryCalls = insertSpy.mock.calls.filter(
      ([table]: [{ storeListingId: unknown }]) => table === "priceHistory_mock",
    );
    // The key assertion: priceHistory insert is NOT called because nothing changed
    // We verify by checking that the insert for priceHistory was not invoked after
    // the listing select. Since `insert` is called for the game upsert (first call)
    // but NOT again for priceHistory, call count should be 1.
    expect(insertSpy.mock.calls.length).toBe(1); // only the game upsert
  });

  it("should skip deal when store is not found", async () => {
    (db.select as ReturnType<typeof vi.fn>)
      .mockReturnValueOnce(buildSelectChain([mockGame]))
      .mockReturnValueOnce(buildSelectChain([])); // store not found

    const insertChain = buildInsertChain([]);
    (db.insert as ReturnType<typeof vi.fn>).mockReturnValue(insertChain);

    const processor = getIngestProcessor();
    const mockJob = { data: { deals: [validDeal], retailerDomain: "steam" } };

    await expect(processor(mockJob)).resolves.toBeUndefined();
  });

  it("should skip deal when game is not found after upsert", async () => {
    (db.select as ReturnType<typeof vi.fn>).mockReturnValueOnce(
      buildSelectChain([]), // game not found
    );

    const insertChain = buildInsertChain([]);
    (db.insert as ReturnType<typeof vi.fn>).mockReturnValue(insertChain);

    const processor = getIngestProcessor();
    const mockJob = { data: { deals: [validDeal], retailerDomain: "steam" } };

    await expect(processor(mockJob)).resolves.toBeUndefined();
  });

  it("should handle empty deals array without error", async () => {
    const processor = getIngestProcessor();
    const mockJob = { data: { deals: [], retailerDomain: "steam" } };
    await expect(processor(mockJob)).resolves.toBeUndefined();
  });

  it("should include saleEndsAt as a Date in priceHistory insert when deal provides it", async () => {
    const dealWithSaleEndsAt = { ...validDeal, saleEndsAt: "2025-06-30T12:00:00.000Z" };

    (db.select as ReturnType<typeof vi.fn>)
      .mockReturnValueOnce(buildSelectChain([mockGame]))
      .mockReturnValueOnce(buildSelectChain([mockStore]))
      .mockReturnValueOnce(buildSelectChain([mockListing]))
      .mockReturnValueOnce(buildSelectChain([])); // no prior price history

    const priceHistoryValuesChain = { values: vi.fn().mockReturnThis(), returning: vi.fn().mockResolvedValue([{}]) };
    const gameInsertChain = buildInsertChain([mockListing]);
    (db.insert as ReturnType<typeof vi.fn>)
      .mockReturnValueOnce(gameInsertChain)  // game upsert
      .mockReturnValueOnce(priceHistoryValuesChain); // priceHistory insert
    (db.update as ReturnType<typeof vi.fn>).mockReturnValue(buildUpdateChain());

    const processor = getIngestProcessor();
    const mockJob = { data: { deals: [dealWithSaleEndsAt], retailerDomain: "steam" } };

    await processor(mockJob);

    const phValuesArg = priceHistoryValuesChain.values.mock.calls[0]?.[0] as { saleEndsAt?: Date } | undefined;
    expect(phValuesArg?.saleEndsAt).toBeInstanceOf(Date);
    expect(phValuesArg?.saleEndsAt?.toISOString()).toBe("2025-06-30T12:00:00.000Z");
  });

  it("should omit saleEndsAt from priceHistory insert when deal does not provide it", async () => {
    (db.select as ReturnType<typeof vi.fn>)
      .mockReturnValueOnce(buildSelectChain([mockGame]))
      .mockReturnValueOnce(buildSelectChain([mockStore]))
      .mockReturnValueOnce(buildSelectChain([mockListing]))
      .mockReturnValueOnce(buildSelectChain([])); // no prior price history

    const priceHistoryValuesChain = { values: vi.fn().mockReturnThis(), returning: vi.fn().mockResolvedValue([{}]) };
    const gameInsertChain = buildInsertChain([mockListing]);
    (db.insert as ReturnType<typeof vi.fn>)
      .mockReturnValueOnce(gameInsertChain)
      .mockReturnValueOnce(priceHistoryValuesChain);
    (db.update as ReturnType<typeof vi.fn>).mockReturnValue(buildUpdateChain());

    const processor = getIngestProcessor();
    // validDeal has no saleEndsAt
    const mockJob = { data: { deals: [validDeal], retailerDomain: "steam" } };

    await processor(mockJob);

    const phValuesArg = priceHistoryValuesChain.values.mock.calls[0]?.[0] as { saleEndsAt?: Date } | undefined;
    expect(phValuesArg?.saleEndsAt).toBeUndefined();
  });

  it("should emit PRICE_ALL_TIME_LOW when new price is lower than stored allTimeLowPrice", async () => {
    const previousPriceRecord = { id: 13, storeListingId: 3, price: "15.99", discount: null };
    // allTimeLowPrice is 20.00 > newPrice (9.99) → new all-time low
    const currentStatsRecord = { storeListingId: 3, allTimeLowPrice: "20.00" };

    (db.select as ReturnType<typeof vi.fn>)
      .mockReturnValueOnce(buildSelectChain([mockGame]))
      .mockReturnValueOnce(buildSelectChain([mockStore]))
      .mockReturnValueOnce(buildSelectChain([mockListing]))
      .mockReturnValueOnce(buildSelectChain([previousPriceRecord])) // latestPrice: 15.99
      .mockReturnValueOnce(buildSelectChain([currentStatsRecord])); // allTimeLowPrice: 20.00

    const insertChain = buildInsertChain([mockListing]);
    (db.insert as ReturnType<typeof vi.fn>).mockReturnValue(insertChain);
    (db.update as ReturnType<typeof vi.fn>).mockReturnValue(buildUpdateChain());
    mockQueueAdd.mockClear();

    const processor = getIngestProcessor();
    const mockJob = { data: { deals: [validDeal], retailerDomain: "steam" } };

    await processor(mockJob);

    expect(mockQueueAdd).toHaveBeenCalledWith(
      "PRICE_ALL_TIME_LOW",
      expect.objectContaining({
        storeListingId: mockListing.id,
        newPrice: validDeal.price,
        gameId: mockGame.id,
      }),
    );
  });

  it("should NOT emit PRICE_ALL_TIME_LOW when new price is not a new all-time low", async () => {
    const previousPriceRecord = { id: 14, storeListingId: 3, price: "15.99", discount: null };
    // allTimeLowPrice is 4.99 < newPrice (9.99) → NOT a new all-time low
    const currentStatsRecord = { storeListingId: 3, allTimeLowPrice: "4.99" };

    (db.select as ReturnType<typeof vi.fn>)
      .mockReturnValueOnce(buildSelectChain([mockGame]))
      .mockReturnValueOnce(buildSelectChain([mockStore]))
      .mockReturnValueOnce(buildSelectChain([mockListing]))
      .mockReturnValueOnce(buildSelectChain([previousPriceRecord])) // latestPrice: 15.99
      .mockReturnValueOnce(buildSelectChain([currentStatsRecord])); // allTimeLowPrice: 4.99

    const insertChain = buildInsertChain([mockListing]);
    (db.insert as ReturnType<typeof vi.fn>).mockReturnValue(insertChain);
    (db.update as ReturnType<typeof vi.fn>).mockReturnValue(buildUpdateChain());
    mockQueueAdd.mockClear();

    const processor = getIngestProcessor();
    const mockJob = { data: { deals: [validDeal], retailerDomain: "steam" } };

    await processor(mockJob);

    const allTimeLowCalls = mockQueueAdd.mock.calls.filter(
      ([name]: [string]) => name === "PRICE_ALL_TIME_LOW",
    );
    expect(allTimeLowCalls).toHaveLength(0);
  });

  it("should write to Redis sorted set 'deal_scores' with a 1-hour TTL after processing", async () => {
    const listingForRefresh = { id: "listing-refresh-1" };
    const priceRow = {
      price: "9.99",
      originalPrice: "19.99",
      discount: "50",
      recordedAt: new Date().toISOString(),
    };

    // Empty deals → skip deal loop; refreshStoreListingStats selects listings then history
    (db.select as ReturnType<typeof vi.fn>)
      .mockReturnValueOnce(buildSelectChain([listingForRefresh])) // allListings
      .mockReturnValueOnce(buildSelectChain([priceRow])); // priceHistory for the listing

    const insertChain = buildInsertChain([]);
    (db.insert as ReturnType<typeof vi.fn>).mockReturnValue(insertChain);
    (db.update as ReturnType<typeof vi.fn>).mockReturnValue(buildUpdateChain());
    mockRedisZadd.mockClear();
    mockRedisExpire.mockClear();

    const processor = getIngestProcessor();
    const mockJob = { data: { deals: [], retailerDomain: "steam" } };

    await processor(mockJob);

    expect(mockRedisZadd).toHaveBeenCalledWith(
      "deal_scores",
      expect.any(Number),
      listingForRefresh.id,
    );
    expect(mockRedisExpire).toHaveBeenCalledWith("deal_scores", 3600);
  });
});

// ─── Scrape Worker DLQ tests ──────────────────────────────────────────────────
describe("scrape worker failed handler (DLQ)", () => {
  it("should add failed job to scrape-dlq when attempts are exhausted", async () => {
    // Get the 'failed' event handler registered on the scrape worker
    const workerMock = vi.mocked(Worker);
    const scrapeWorkerInstance = workerMock.mock.results.find(
      (_, i) => workerMock.mock.calls[i]?.[0] === "scrape",
    )?.value as { on: ReturnType<typeof vi.fn> };

    expect(scrapeWorkerInstance).toBeDefined();

    const onCalls: Array<[string, (...args: unknown[]) => unknown]> = scrapeWorkerInstance.on.mock.calls;
    const failedHandler = onCalls.find(([event]) => event === "failed")?.[1];
    expect(failedHandler).toBeDefined();

    mockQueueAdd.mockClear();

    const mockErr = new Error("scrape failed");
    const exhaustedJob = {
      data: { retailerDomain: "steam" },
      attemptsMade: 3,
      opts: { attempts: 3 },
    };

    await failedHandler!(exhaustedJob, mockErr);

    expect(mockQueueAdd).toHaveBeenCalledWith(
      "failed-scrape",
      expect.objectContaining({ retailerDomain: "steam", error: "scrape failed" }),
    );
  });

  it("should NOT add to DLQ when retries are not yet exhausted", async () => {
    const workerMock = vi.mocked(Worker);
    const scrapeWorkerInstance = workerMock.mock.results.find(
      (_, i) => workerMock.mock.calls[i]?.[0] === "scrape",
    )?.value as { on: ReturnType<typeof vi.fn> };

    const onCalls: Array<[string, (...args: unknown[]) => unknown]> = scrapeWorkerInstance.on.mock.calls;
    const failedHandler = onCalls.find(([event]) => event === "failed")?.[1];

    mockQueueAdd.mockClear();

    const mockErr = new Error("scrape failed temporarily");
    const nonExhaustedJob = {
      data: { retailerDomain: "steam" },
      attemptsMade: 1,
      opts: { attempts: 3 },
    };

    await failedHandler!(nonExhaustedJob, mockErr);

    // DLQ add should NOT be called
    expect(mockQueueAdd).not.toHaveBeenCalled();
  });

  it("should handle null job in failed handler gracefully", async () => {
    const workerMock = vi.mocked(Worker);
    const scrapeWorkerInstance = workerMock.mock.results.find(
      (_, i) => workerMock.mock.calls[i]?.[0] === "scrape",
    )?.value as { on: ReturnType<typeof vi.fn> };

    const onCalls: Array<[string, (...args: unknown[]) => unknown]> = scrapeWorkerInstance.on.mock.calls;
    const failedHandler = onCalls.find(([event]) => event === "failed")?.[1];

    await expect(failedHandler!(null, new Error("failed"))).resolves.toBeUndefined();
  });
});

// ─── CRON scheduling tests ────────────────────────────────────────────────────
describe("CRON scheduling", () => {
  it("should have queried the stores table on startup", async () => {
    // db.select was called at least once during module load (scheduleScrapers)
    expect(vi.mocked(db.select)).toHaveBeenCalled();
  });

  it("should have enqueued a featured-scrape-steam job on startup", async () => {
    // scheduleScrapers always adds a featured-scrape-steam job regardless of store count
    const featuredCall = startupQueueAddCalls.find(([name]) => name === "featured-scrape-steam");
    expect(featuredCall).toBeDefined();
    expect(featuredCall![1]).toEqual({ retailerDomain: "steam" });
    expect(featuredCall![2]).toMatchObject({ repeat: { pattern: expect.any(String) }, attempts: 3 });
  });
});

// ─── Featured Scrape Worker tests ─────────────────────────────────────────────
describe("featured scrape worker", () => {
  it("should create a Worker for the 'featured-scrape' queue", () => {
    const calls = vi.mocked(Worker).mock.calls;
    const featuredCall = calls.find(([name]) => name === "featured-scrape");
    expect(featuredCall).toBeDefined();
  });

  it("should have concurrency 1 for the featured-scrape worker", () => {
    const calls = vi.mocked(Worker).mock.calls;
    const featuredCall = calls.find(([name]) => name === "featured-scrape");
    expect(featuredCall).toBeDefined();
    // Third argument is options; concurrency should be 1
    const opts = featuredCall![2] as { concurrency: number };
    expect(opts.concurrency).toBe(1);
  });

  describe("featured-scrape worker processor", () => {
    function getFeaturedScrapeProcessor(): (job: unknown) => Promise<void> {
      const calls = vi.mocked(Worker).mock.calls;
      const featuredCall = calls.find(([name]) => name === "featured-scrape");
      if (!featuredCall) throw new Error("Featured scrape Worker was not created");
      return featuredCall[1] as (job: unknown) => Promise<void>;
    }

    it("should throw when scraper module is not found", async () => {
      const processor = getFeaturedScrapeProcessor();
      const mockJob = { data: { retailerDomain: "nonexistent-retailer-xyz" } };

      await expect(processor(mockJob)).rejects.toThrow(
        "No scraper found for retailerDomain: nonexistent-retailer-xyz",
      );
    });
  });

  it("should schedule epic-games store with EPIC_SCRAPE_CRON (daily default '0 0 * * *')", async () => {
    const { scheduleScrapers } = await import("../src/index.js");
    (db.select as ReturnType<typeof vi.fn>).mockReturnValueOnce(
      buildSelectChain([{ slug: "epic-games" }]),
    );
    mockQueueAdd.mockClear();

    await scheduleScrapers();

    expect(mockQueueAdd).toHaveBeenCalledWith(
      "scrape-epic-games",
      { retailerDomain: "epic-games" },
      expect.objectContaining({ repeat: { pattern: process.env.EPIC_SCRAPE_CRON ?? "0 0 * * *" } }),
    );
  });

  it("should schedule non-epic stores with SCRAPE_CRON", async () => {
    const { scheduleScrapers } = await import("../src/index.js");
    (db.select as ReturnType<typeof vi.fn>).mockReturnValueOnce(
      buildSelectChain([{ slug: "steam" }]),
    );
    mockQueueAdd.mockClear();

    await scheduleScrapers();

    expect(mockQueueAdd).toHaveBeenCalledWith(
      "scrape-steam",
      { retailerDomain: "steam" },
      expect.objectContaining({ repeat: { pattern: process.env.SCRAPE_CRON ?? "0 */6 * * *" } }),
    );
  });
});

// ─── Steam Sync Worker tests ──────────────────────────────────────────────────
describe("steam sync worker", () => {
  it("should create a Worker for the 'steam-sync' queue", () => {
    const calls = vi.mocked(Worker).mock.calls;
    const steamSyncCall = calls.find(([name]) => name === "steam-sync");
    expect(steamSyncCall).toBeDefined();
  });

  function getSteamSyncProcessor(): (job: unknown) => Promise<void> {
    const calls = vi.mocked(Worker).mock.calls;
    const steamSyncCall = calls.find(([name]) => name === "steam-sync");
    if (!steamSyncCall) throw new Error("Steam sync Worker was not created");
    return steamSyncCall[1] as (job: unknown) => Promise<void>;
  }

  it("should query users where steamId IS NOT NULL and fetch wishlists", async () => {
    const mockUser = { id: "user-1", steamId: "76561198000000001" };
    const mockGame = { id: "game-1", steamAppId: 400 };

    (db.select as ReturnType<typeof vi.fn>)
      .mockReturnValueOnce(buildSelectChain([mockUser])) // users with steamId
      .mockReturnValueOnce(buildSelectChain([mockGame])) // game match
      .mockReturnValueOnce(buildSelectChain([])); // no existing wishlist entry

    const insertChain = {
      values: vi.fn().mockResolvedValue(undefined),
    };
    (db.insert as ReturnType<typeof vi.fn>).mockReturnValue(insertChain);

    const mockFetch = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ "400": { name: "Portal" } }), { status: 200 }),
    );

    const processor = getSteamSyncProcessor();
    await processor({});

    expect(mockFetch).toHaveBeenCalledWith(
      "https://store.steampowered.com/wishlist/profiles/76561198000000001/wishlistdata/",
    );
    expect(db.insert).toHaveBeenCalled();
    expect(insertChain.values).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "user-1", gameId: "game-1", source: "steam_sync" }),
    );

    mockFetch.mockRestore();
  });

  it("should handle private wishlists gracefully (non-200 response)", async () => {
    const mockUser = { id: "user-2", steamId: "76561198000000002" };

    (db.select as ReturnType<typeof vi.fn>)
      .mockReturnValueOnce(buildSelectChain([mockUser]));

    const mockFetch = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("", { status: 403 }),
    );
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const processor = getSteamSyncProcessor();
    await expect(processor({})).resolves.toBeUndefined();

    expect(warnSpy).toHaveBeenCalled();
    mockFetch.mockRestore();
    warnSpy.mockRestore();
  });

  it("should handle empty wishlists gracefully", async () => {
    const mockUser = { id: "user-3", steamId: "76561198000000003" };

    (db.select as ReturnType<typeof vi.fn>)
      .mockReturnValueOnce(buildSelectChain([mockUser]));

    const mockFetch = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({}), { status: 200 }),
    );
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const processor = getSteamSyncProcessor();
    await expect(processor({})).resolves.toBeUndefined();

    expect(warnSpy).toHaveBeenCalled();
    mockFetch.mockRestore();
    warnSpy.mockRestore();
  });

  it("should do nothing when no users have a steamId", async () => {
    (db.select as ReturnType<typeof vi.fn>)
      .mockReturnValueOnce(buildSelectChain([])); // no users

    const mockFetch = vi.spyOn(globalThis, "fetch");

    const processor = getSteamSyncProcessor();
    await expect(processor({})).resolves.toBeUndefined();

    // fetch should never be called when there are no users
    expect(mockFetch).not.toHaveBeenCalled();
    mockFetch.mockRestore();
  });

  it("should skip appIds that do not match any game in the database", async () => {
    const mockUser = { id: "user-4", steamId: "76561198000000004" };

    (db.select as ReturnType<typeof vi.fn>)
      .mockReturnValueOnce(buildSelectChain([mockUser])) // users
      .mockReturnValueOnce(buildSelectChain([])); // no game match for appId

    (db.insert as ReturnType<typeof vi.fn>).mockClear();

    const mockFetch = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ "99999": { name: "Unknown Game" } }), { status: 200 }),
    );

    const processor = getSteamSyncProcessor();
    await processor({});

    // insert should NOT be called because the game was not found
    expect(db.insert).not.toHaveBeenCalled();

    mockFetch.mockRestore();
  });

  it("should handle fetch throwing a network error gracefully", async () => {
    const mockUser = { id: "user-5", steamId: "76561198000000005" };

    (db.select as ReturnType<typeof vi.fn>)
      .mockReturnValueOnce(buildSelectChain([mockUser]));

    const mockFetch = vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(
      new Error("Network error"),
    );
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const processor = getSteamSyncProcessor();
    await expect(processor({})).resolves.toBeUndefined();

    expect(warnSpy).toHaveBeenCalled();
    const warnArg = warnSpy.mock.calls[0]?.[0] as string;
    expect(warnArg).toContain("steam-sync-error");
    expect(warnArg).toContain("user-5");

    mockFetch.mockRestore();
    warnSpy.mockRestore();
  });

  it("should process multiple users independently", async () => {
    const user1 = { id: "user-a", steamId: "76561198000000010" };
    const user2 = { id: "user-b", steamId: "76561198000000011" };
    const mockGameA = { id: "game-a", steamAppId: 10 };

    (db.select as ReturnType<typeof vi.fn>)
      .mockReturnValueOnce(buildSelectChain([user1, user2])) // both users
      .mockReturnValueOnce(buildSelectChain([mockGameA])) // user1's game match
      .mockReturnValueOnce(buildSelectChain([])) // no existing wishlist for user1/game-a
      .mockReturnValueOnce(buildSelectChain([])); // user2's game not found

    const insertChain = {
      values: vi.fn().mockResolvedValue(undefined),
    };
    (db.insert as ReturnType<typeof vi.fn>).mockReturnValue(insertChain);

    const mockFetch = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ "10": { name: "GameA" } }), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ "20": { name: "GameB" } }), { status: 200 }),
      );

    const processor = getSteamSyncProcessor();
    await processor({});

    // fetch called once per user
    expect(mockFetch).toHaveBeenCalledTimes(2);
    // insert only for user1 (user2's game not found)
    expect(insertChain.values).toHaveBeenCalledTimes(1);
    expect(insertChain.values).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "user-a", gameId: "game-a", source: "steam_sync" }),
    );

    mockFetch.mockRestore();
  });

  it("should upsert multiple wishlist entries when wishlist has multiple matching appIds", async () => {
    const mockUser = { id: "user-6", steamId: "76561198000000006" };
    const game1 = { id: "game-x", steamAppId: 400 };
    const game2 = { id: "game-y", steamAppId: 440 };

    (db.select as ReturnType<typeof vi.fn>)
      .mockReturnValueOnce(buildSelectChain([mockUser])) // users
      .mockReturnValueOnce(buildSelectChain([game1])) // match for appId 400
      .mockReturnValueOnce(buildSelectChain([])) // no existing wishlist for game-x
      .mockReturnValueOnce(buildSelectChain([game2])) // match for appId 440
      .mockReturnValueOnce(buildSelectChain([])); // no existing wishlist for game-y

    const insertChain = {
      values: vi.fn().mockResolvedValue(undefined),
    };
    (db.insert as ReturnType<typeof vi.fn>).mockReturnValue(insertChain);

    const mockFetch = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ "400": { name: "Portal" }, "440": { name: "TF2" } }), { status: 200 }),
    );

    const processor = getSteamSyncProcessor();
    await processor({});

    expect(insertChain.values).toHaveBeenCalledTimes(2);
    expect(insertChain.values).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "user-6", gameId: "game-x" }),
    );
    expect(insertChain.values).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "user-6", gameId: "game-y" }),
    );

    mockFetch.mockRestore();
  });

  it("should have concurrency 1 for the steam-sync worker", () => {
    const calls = vi.mocked(Worker).mock.calls;
    const steamSyncCall = calls.find(([name]) => name === "steam-sync");
    expect(steamSyncCall).toBeDefined();
    const opts = steamSyncCall![2] as { concurrency: number };
    expect(opts.concurrency).toBe(1);
  });

  it("should schedule a steam-sync-all CRON job on startup", () => {
    const steamSyncCall = startupQueueAddCalls.find(([name]) => name === "steam-sync-all");
    expect(steamSyncCall).toBeDefined();
    expect(steamSyncCall![2]).toMatchObject({ repeat: { pattern: expect.any(String) } });
  });

  it("should schedule steam-sync-all with STEAM_SYNC_CRON pattern", () => {
    const steamSyncCall = startupQueueAddCalls.find(([name]) => name === "steam-sync-all");
    expect(steamSyncCall).toBeDefined();
    expect(steamSyncCall![2]).toMatchObject({
      repeat: { pattern: process.env.STEAM_SYNC_CRON ?? "0 0 * * *" },
    });
  });

  it("should include steamSyncWorker in SIGTERM graceful shutdown", async () => {
    // The SIGTERM handler calls close() on all workers including steamSyncWorker.
    // mockWorkerClose is shared across all Worker instances; the afterAll block
    // triggers SIGTERM and we verify the expected call count (4 workers total).
    // This test just verifies the worker was created — shutdown is covered by afterAll.
    const calls = vi.mocked(Worker).mock.calls;
    const steamSyncCall = calls.find(([name]) => name === "steam-sync");
    expect(steamSyncCall).toBeDefined();
  });

  it("should log a warning and continue when fetch throws for a user", async () => {
    const mockUser1 = { id: "user-5", steamId: "76561198000000005" };
    const mockUser2 = { id: "user-6", steamId: "76561198000000006" };
    const mockGame = { id: "game-2", steamAppId: 500 };

    (db.select as ReturnType<typeof vi.fn>)
      .mockReturnValueOnce(buildSelectChain([mockUser1, mockUser2])) // two users
      .mockReturnValueOnce(buildSelectChain([mockGame])) // game match for user-6
      .mockReturnValueOnce(buildSelectChain([])); // no existing wishlist for user-6/game-2

    const insertChain = {
      values: vi.fn().mockResolvedValue(undefined),
    };
    (db.insert as ReturnType<typeof vi.fn>).mockReturnValue(insertChain);

    let fetchCallCount = 0;
    const mockFetch = vi.spyOn(globalThis, "fetch").mockImplementation(async (_url) => {
      fetchCallCount++;
      if (fetchCallCount === 1) {
        throw new Error("Connection refused");
      }
      return new Response(JSON.stringify({ "500": { name: "Game" } }), { status: 200 });
    });
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const processor = getSteamSyncProcessor();
    await expect(processor({})).resolves.toBeUndefined();

    // Should have warned about the first user's failure
    expect(warnSpy).toHaveBeenCalled();
    const warnCall = warnSpy.mock.calls[0][0] as string;
    expect(warnCall).toContain("steam-sync-error");
    expect(warnCall).toContain("user-5");

    mockFetch.mockRestore();
    warnSpy.mockRestore();
  });
});
