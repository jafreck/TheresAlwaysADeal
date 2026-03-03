import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks (hoisted before imports) ──────────────────────────────────────────

vi.mock("@hono/node-server", () => ({ serve: vi.fn() }));
vi.mock("@hono/swagger-ui", () => ({ swaggerUI: () => vi.fn() }));

// Mock db builder: thenable so `await builder` resolves, and has .offset() for chained pagination
let mockDbResult: any[] = [];
function createBuilder() {
  const builder: any = {
    from: () => builder,
    where: () => builder,
    orderBy: () => builder,
    limit: () => builder,
    offset: () => Promise.resolve(mockDbResult),
    innerJoin: () => builder,
    then: (resolve: (v: any) => any, reject: (e: any) => any) =>
      Promise.resolve(mockDbResult).then(resolve, reject),
  };
  return builder;
}
const mockDb = { select: vi.fn() };
const stubTable = (cols: Record<string, string>) => cols;
vi.mock("@taad/db", () => ({
  db: mockDb,
  games: stubTable({ id: "id", title: "title", slug: "slug", description: "description", headerImageUrl: "headerImageUrl", createdAt: "createdAt", updatedAt: "updatedAt" }),
  stores: stubTable({ id: "id", name: "name", slug: "slug", logoUrl: "logoUrl", baseUrl: "baseUrl" }),
  storeListings: stubTable({ id: "id", gameId: "gameId", storeId: "storeId", storeUrl: "storeUrl", isActive: "isActive", isAllTimeLow: "isAllTimeLow" }),
  priceHistory: stubTable({ id: "id", storeListingId: "storeListingId", price: "price", originalPrice: "originalPrice", currency: "currency", discount: "discount", saleEndsAt: "saleEndsAt", recordedAt: "recordedAt" }),
  storeListingStats: stubTable({ id: "id", storeListingId: "storeListingId", dealScore: "dealScore", isAllTimeLow: "isAllTimeLow", allTimeLowPrice: "allTimeLowPrice" }),
  genres: stubTable({ id: "id", name: "name", slug: "slug" }),
  gameGenres: stubTable({ gameId: "gameId", genreId: "genreId" }),
  platforms: stubTable({ id: "id", name: "name", slug: "slug" }),
  gamePlatforms: stubTable({ gameId: "gameId", platformId: "platformId" }),
}));

// Mock ioredis
const mockZrevrangebyscore = vi.fn();
const mockIncr = vi.fn();
const mockPttl = vi.fn();
const mockPexpire = vi.fn();
const mockMulti = vi.fn();
const mockExec = vi.fn();
vi.mock("ioredis", () => ({
  Redis: vi.fn().mockImplementation(() => ({
    zrevrangebyscore: mockZrevrangebyscore,
    incr: mockIncr,
    pttl: mockPttl,
    pexpire: mockPexpire,
    multi: mockMulti.mockReturnValue({ incr: mockIncr.mockReturnThis(), pttl: mockPttl.mockReturnThis(), exec: mockExec }),
  })),
}));

// ─── App under test ───────────────────────────────────────────────────────────

// Set REDIS_URL so the lazy Redis client initialises using the mock constructor
process.env.REDIS_URL = "redis://localhost:6379";
process.env.DATABASE_URL = "postgres://test";

const { app } = await import("../src/index.js");

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("GET /api/health", () => {
  it("returns 200 with status ok and timestamp", async () => {
    const res = await app.request("/api/health");
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toHaveProperty("status", "ok");
    expect(body).toHaveProperty("timestamp");
  });
});

describe("GET /api/v1/deals/rankings", () => {
  beforeEach(() => {
    mockDb.select.mockReturnValue(createBuilder());
    mockZrevrangebyscore.mockReset();
    mockExec.mockResolvedValue([[null, 1], [null, -1]]);
  });

  it("returns 200 with deal score objects when Redis has data", async () => {
    mockZrevrangebyscore.mockResolvedValue(["listing-a", "95.5", "listing-b", "80.0"]);

    const res = await app.request("/api/v1/deals/rankings");
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

    const res = await app.request("/api/v1/deals/rankings");
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toEqual([
      { storeListingId: "listing-c", dealScore: 72 },
      { storeListingId: "listing-d", dealScore: 55 },
    ]);
  });

  it("passes limit and offset query parameters to Redis", async () => {
    mockZrevrangebyscore.mockResolvedValue(["listing-e", "60.0"]);

    const res = await app.request("/api/v1/deals/rankings?limit=5&offset=10");
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

describe("GET /api/v1/deals/:storeListingId/stats", () => {
  beforeEach(() => {
    mockDb.select.mockReturnValue(createBuilder());
    mockDbResult = [];
    mockExec.mockResolvedValue([[null, 1], [null, -1]]);
  });

  it("returns 200 with the stats object when the listing exists", async () => {
    const statsRow = {
      id: "stats-1",
      storeListingId: "listing-f",
      allTimeLowPrice: "9.99",
      dealScore: "88.00",
    };
    mockDbResult = [statsRow];

    const res = await app.request("/api/v1/deals/listing-f/stats");
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toEqual(statsRow);
  });

  it("returns 404 when the listing is not found in storeListingStats", async () => {
    mockDbResult = [];

    const res = await app.request("/api/v1/deals/nonexistent/stats");
    expect(res.status).toBe(404);

    const body = await res.json();
    expect(body).toEqual({ error: "Not found" });
  });
});
