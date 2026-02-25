import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks (hoisted before imports) ──────────────────────────────────────────

vi.mock("@hono/node-server", () => ({ serve: vi.fn() }));

// Mock db builder: thenable so `await builder` resolves, and has .offset() for chained pagination
let mockDbResult: any[] = [];
function createBuilder() {
  const builder: any = {
    from: () => builder,
    where: () => builder,
    orderBy: () => builder,
    limit: () => builder,
    offset: () => Promise.resolve(mockDbResult),
    then: (resolve: (v: any) => any, reject: (e: any) => any) =>
      Promise.resolve(mockDbResult).then(resolve, reject),
  };
  return builder;
}
const mockDb = { select: vi.fn() };
vi.mock("@taad/db", () => ({
  db: mockDb,
  storeListingStats: {
    storeListingId: "storeListingId",
    dealScore: "dealScore",
  },
}));

// Mock ioredis
const mockZrevrangebyscore = vi.fn();
vi.mock("ioredis", () => ({
  Redis: vi.fn().mockImplementation(() => ({ zrevrangebyscore: mockZrevrangebyscore })),
}));

// ─── App under test ───────────────────────────────────────────────────────────

// Set REDIS_URL so the lazy Redis client initialises using the mock constructor
process.env.REDIS_URL = "redis://localhost:6379";
process.env.DATABASE_URL = "postgres://test";

const { app } = await import("../src/index.js");

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("GET /deals/rankings", () => {
  beforeEach(() => {
    mockDb.select.mockReturnValue(createBuilder());
    mockZrevrangebyscore.mockReset();
  });

  it("returns 200 with deal score objects when Redis has data", async () => {
    mockZrevrangebyscore.mockResolvedValue(["listing-a", "95.5", "listing-b", "80.0"]);

    const res = await app.request("/deals/rankings");
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toEqual([
      { storeListingId: "listing-a", dealScore: 95.5 },
      { storeListingId: "listing-b", dealScore: 80.0 },
    ]);
  });

  it("falls back to DB when Redis returns empty results", async () => {
    mockZrevrangebyscore.mockResolvedValue([]);
    mockDbResult = [
      { storeListingId: "listing-c", dealScore: "72.00" },
      { storeListingId: "listing-d", dealScore: "55.00" },
    ];

    const res = await app.request("/deals/rankings");
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toEqual([
      { storeListingId: "listing-c", dealScore: 72 },
      { storeListingId: "listing-d", dealScore: 55 },
    ]);
  });

  it("passes limit and offset query parameters to Redis", async () => {
    mockZrevrangebyscore.mockResolvedValue(["listing-e", "60.0"]);

    const res = await app.request("/deals/rankings?limit=5&offset=10");
    expect(res.status).toBe(200);

    expect(mockZrevrangebyscore).toHaveBeenCalledWith(
      "deal_scores",
      "+inf",
      "-inf",
      "WITHSCORES",
      "LIMIT",
      10,
      5,
    );
  });
});

describe("GET /deals/:storeListingId/stats", () => {
  beforeEach(() => {
    mockDb.select.mockReturnValue(createBuilder());
    mockDbResult = [];
  });

  it("returns 200 with the stats object when the listing exists", async () => {
    const statsRow = {
      id: "stats-1",
      storeListingId: "listing-f",
      allTimeLowPrice: "9.99",
      dealScore: "88.00",
    };
    mockDbResult = [statsRow];

    const res = await app.request("/deals/listing-f/stats");
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toEqual(statsRow);
  });

  it("returns 404 when the listing is not found in storeListingStats", async () => {
    mockDbResult = [];

    const res = await app.request("/deals/nonexistent/stats");
    expect(res.status).toBe(404);

    const body = await res.json();
    expect(body).toEqual({ error: "Not found" });
  });
});
