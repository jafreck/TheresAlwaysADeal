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

function makeMockQueueInstance() {
  return {
    add: mockQueueAdd,
    getWaitingCount: mockQueueGetWaiting,
    getActiveCount: mockQueueGetActive,
    getCompletedCount: mockQueueGetCompleted,
    getFailedCount: mockQueueGetFailed,
  };
}

// ─── Mocks ────────────────────────────────────────────────────────────────────
vi.mock("bullmq", () => {
  const Queue = vi.fn().mockImplementation(() => makeMockQueueInstance());
  const Worker = vi.fn().mockImplementation(() => ({
    on: vi.fn(),
    close: mockWorkerClose,
  }));
  const QueueEvents = vi.fn().mockReturnValue({});
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
    games: { slug: "slug_col", id: "id_col" },
    stores: { slug: "slug_col", id: "id_col" },
    storeListings: { gameId: "gameId_col", storeId: "storeId_col", id: "id_col" },
    priceHistory: { storeListingId: "sl_col", recordedAt: "ra_col" },
  };
});

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((col: unknown, val: unknown) => ({ col, val })),
  and: vi.fn((...args: unknown[]) => args),
  desc: vi.fn((col: unknown) => col),
}));

vi.mock("@taad/scraper", () => ({
  BaseScraper: class {},
}));

// ─── Helper to build fluent DB select chain ───────────────────────────────────
function buildSelectChain(result: unknown[]) {
  return {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(result),
  };
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
let db: Awaited<typeof import("@taad/db")>["db"];
let Worker: Awaited<typeof import("bullmq")>["Worker"];

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

  // Give the server time to bind
  await new Promise((resolve) => setTimeout(resolve, 100));
});

afterAll(async () => {
  // Allow vitest to exit by signaling SIGTERM via process listeners
  // (not calling process.exit — just close cleanly enough for vitest)
  process.emit("SIGTERM" as NodeJS.Signals);
  await new Promise((resolve) => setTimeout(resolve, 50));
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
    const priceHistoryCalls = insertSpy.mock.calls.filter(
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
});
