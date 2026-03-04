import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks (hoisted before imports) ──────────────────────────────────────────

vi.mock("@hono/node-server", () => ({ serve: vi.fn() }));
vi.mock("@hono/swagger-ui", () => ({
  swaggerUI: () => (c: any) => c.html("<html><body>Swagger UI</body></html>"),
}));

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
const mockDb = { select: vi.fn(), insert: vi.fn(), update: vi.fn(), delete: vi.fn() };
const stubTable = (cols: Record<string, string>) => cols;
vi.mock("@taad/db", () => ({
  db: mockDb,
  games: stubTable({ id: "id", title: "title", slug: "slug", description: "description", headerImageUrl: "headerImageUrl", steamAppId: "steamAppId", createdAt: "createdAt", updatedAt: "updatedAt" }),
  stores: stubTable({ id: "id", name: "name", slug: "slug", logoUrl: "logoUrl", baseUrl: "baseUrl" }),
  storeListings: stubTable({ id: "id", gameId: "gameId", storeId: "storeId", storeUrl: "storeUrl", isActive: "isActive", isAllTimeLow: "isAllTimeLow" }),
  priceHistory: stubTable({ id: "id", storeListingId: "storeListingId", price: "price", originalPrice: "originalPrice", currency: "currency", discount: "discount", saleEndsAt: "saleEndsAt", recordedAt: "recordedAt" }),
  storeListingStats: stubTable({ id: "id", storeListingId: "storeListingId", dealScore: "dealScore", isAllTimeLow: "isAllTimeLow", allTimeLowPrice: "allTimeLowPrice" }),
  genres: stubTable({ id: "id", name: "name", slug: "slug" }),
  gameGenres: stubTable({ gameId: "gameId", genreId: "genreId" }),
  platforms: stubTable({ id: "id", name: "name", slug: "slug" }),
  gamePlatforms: stubTable({ gameId: "gameId", platformId: "platformId" }),
  users: stubTable({ id: "id", email: "email", name: "name", passwordHash: "passwordHash", emailVerified: "emailVerified", steamId: "steamId" }),
  refreshTokens: stubTable({ id: "id", userId: "userId", token: "token", expiresAt: "expiresAt", revokedAt: "revokedAt", createdAt: "createdAt" }),
  searchAnalytics: stubTable({ id: "id", query: "query", resultCount: "resultCount", searchedAt: "searchedAt" }),
  wishlists: stubTable({ id: "id", userId: "userId", gameId: "gameId", source: "source" }),
}));

// Mock auth utilities used by auth routes
vi.mock("bcryptjs", () => ({
  default: { hash: vi.fn(), compare: vi.fn() },
  hash: vi.fn(),
  compare: vi.fn(),
}));

vi.mock("jsonwebtoken", () => ({
  default: { sign: vi.fn(), verify: vi.fn() },
  sign: vi.fn(),
  verify: vi.fn(),

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
process.env.JWT_SECRET = "test-jwt-secret";
process.env.JWT_REFRESH_SECRET = "test-jwt-refresh-secret";

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

describe("GET /api/v1/games", () => {
  beforeEach(() => {
    mockDbResult = [{ total: 0 }];
    mockDb.select.mockReturnValue(createBuilder());
    mockExec.mockResolvedValue([[null, 1], [null, -1]]);
  });

  it("returns 200 with envelope response", async () => {
    const res = await app.request("/api/v1/games");
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toHaveProperty("data");
    expect(body).toHaveProperty("meta");
  });

  it("returns 400 for invalid pagination", async () => {
    const res = await app.request("/api/v1/games?page=-1");
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body).toHaveProperty("error", "Invalid query parameters");
  });
});

describe("GET /api/v1/games/search", () => {
  beforeEach(() => {
    mockDbResult = [{ total: 0 }];
    mockDb.select.mockReturnValue(createBuilder());
    mockDb.insert.mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) });
    mockExec.mockResolvedValue([[null, 1], [null, -1]]);
  });

  it("returns 400 when q parameter is missing", async () => {
    const res = await app.request("/api/v1/games/search");
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body).toHaveProperty("error", "Invalid query parameters");
  });

  it("returns 200 with results when q is provided", async () => {
    const res = await app.request("/api/v1/games/search?q=test");
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toHaveProperty("data");
    expect(body).toHaveProperty("meta");
  });
});

describe("GET /api/v1/games/:slug", () => {
  beforeEach(() => {
    mockDbResult = [];
    mockDb.select.mockReturnValue(createBuilder());
    mockExec.mockResolvedValue([[null, 1], [null, -1]]);
  });

  it("returns 404 for unknown slug", async () => {
    const res = await app.request("/api/v1/games/unknown-game");
    expect(res.status).toBe(404);

    const body = await res.json();
    expect(body).toEqual({ error: "Not found" });
  });
});

describe("GET /api/v1/games/:slug/price-history", () => {
  beforeEach(() => {
    mockDbResult = [];
    mockDb.select.mockReturnValue(createBuilder());
    mockExec.mockResolvedValue([[null, 1], [null, -1]]);
  });

  it("returns 404 for unknown game slug", async () => {
    const res = await app.request("/api/v1/games/unknown-game/price-history");
    expect(res.status).toBe(404);

    const body = await res.json();
    expect(body).toEqual({ error: "Not found" });
  });
});

describe("GET /api/v1/deals", () => {
  beforeEach(() => {
    mockDbResult = [{ total: 0 }];
    mockDb.select.mockReturnValue(createBuilder());
    mockExec.mockResolvedValue([[null, 1], [null, -1]]);
  });

  it("returns 200 with envelope response", async () => {
    const res = await app.request("/api/v1/deals");
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toHaveProperty("data");
    expect(body).toHaveProperty("meta");
  });

  it("returns 400 for invalid pagination", async () => {
    const res = await app.request("/api/v1/deals?page=-1");
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body).toHaveProperty("error", "Invalid query parameters");
  });
});

describe("GET /api/v1/deals/free", () => {
  beforeEach(() => {
    mockDbResult = [{ total: 0 }];
    mockDb.select.mockReturnValue(createBuilder());
    mockExec.mockResolvedValue([[null, 1], [null, -1]]);
  });

  it("returns 200 with envelope response", async () => {
    const res = await app.request("/api/v1/deals/free");
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toHaveProperty("data");
    expect(body).toHaveProperty("meta");
  });

  it("returns 400 for invalid pagination", async () => {
    const res = await app.request("/api/v1/deals/free?page=-1");
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body).toHaveProperty("error", "Invalid query parameters");
  });
});

describe("GET /api/v1/deals/all-time-lows", () => {
  beforeEach(() => {
    mockDbResult = [{ total: 0 }];
    mockDb.select.mockReturnValue(createBuilder());
    mockExec.mockResolvedValue([[null, 1], [null, -1]]);
  });

  it("returns 200 with envelope response", async () => {
    const res = await app.request("/api/v1/deals/all-time-lows");
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toHaveProperty("data");
    expect(body).toHaveProperty("meta");
  });

  it("returns 400 for invalid pagination", async () => {
    const res = await app.request("/api/v1/deals/all-time-lows?page=-1");
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body).toHaveProperty("error", "Invalid query parameters");
  });
});

describe("POST /api/v1/auth/register", () => {
  beforeEach(() => {
    mockDb.select.mockReturnValue(createBuilder());
    mockExec.mockResolvedValue([[null, 1], [null, -1]]);
  });

  it("returns a non-404 response confirming auth routes are mounted", async () => {
    const res = await app.request("/api/v1/auth/register", { method: "POST" });
    expect(res.status).not.toBe(404);
  });
});

describe("GET /api/docs", () => {
  beforeEach(() => {
    mockExec.mockResolvedValue([[null, 1], [null, -1]]);
  });

  it("returns 200 with Swagger UI", async () => {
    const res = await app.request("/api/docs");
    expect(res.status).toBe(200);
  });
});

describe("GET /api/docs/openapi.json", () => {
  beforeEach(() => {
    mockExec.mockResolvedValue([[null, 1], [null, -1]]);
  });

  it("returns 200 with OpenAPI spec", async () => {
    const res = await app.request("/api/docs/openapi.json");
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.openapi).toBe("3.0.3");
    expect(body.info.title).toBe("TheresAlwaysADeal API");
    expect(body.paths).toBeDefined();
  });
});

describe("GET /api/v1/stores", () => {
  beforeEach(() => {
    mockDbResult = [];
    mockDb.select.mockReturnValue(createBuilder());
    mockExec.mockResolvedValue([[null, 1], [null, -1]]);
  });

  it("returns 200 with stores in envelope format", async () => {
    const storeRow = { id: "s1", name: "Steam", slug: "steam", logoUrl: "https://steam.com/logo.png", baseUrl: "https://store.steampowered.com" };
    mockDbResult = [storeRow];
    mockDb.select.mockReturnValue(createBuilder());

    const res = await app.request("/api/v1/stores");
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toHaveProperty("data");
    expect(body).toHaveProperty("meta");
    expect(body.data).toEqual([storeRow]);
  });

  it("returns 200 with empty data when no stores exist", async () => {
    mockDbResult = [];
    mockDb.select.mockReturnValue(createBuilder());

    const res = await app.request("/api/v1/stores");
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.data).toEqual([]);
    expect(body.meta.total).toBe(0);
  });
});

describe("GET /api/v1/auth/steam", () => {
  beforeEach(() => {
    mockDb.select.mockReturnValue(createBuilder());
    mockExec.mockResolvedValue([[null, 1], [null, -1]]);
  });

  it("returns a non-404 response confirming steam auth routes are mounted", async () => {
    const res = await app.request("/api/v1/auth/steam");
    expect(res.status).not.toBe(404);
  });
});

describe("GET /api/v1/auth/steam/callback", () => {
  beforeEach(() => {
    mockDb.select.mockReturnValue(createBuilder());
    mockExec.mockResolvedValue([[null, 1], [null, -1]]);
  });

  it("returns a non-404 response confirming steam callback route is mounted", async () => {
    const res = await app.request("/api/v1/auth/steam/callback");
    expect(res.status).not.toBe(404);
  });
});

describe("DELETE /api/v1/user/me/steam", () => {
  beforeEach(() => {
    mockDb.select.mockReturnValue(createBuilder());
    mockExec.mockResolvedValue([[null, 1], [null, -1]]);
  });

  it("returns a non-404 response confirming user steam route is mounted", async () => {
    const res = await app.request("/api/v1/user/me/steam", { method: "DELETE" });
    expect(res.status).not.toBe(404);
  });
});

describe("POST /api/v1/user/me/steam/sync", () => {
  beforeEach(() => {
    mockDb.select.mockReturnValue(createBuilder());
    mockExec.mockResolvedValue([[null, 1], [null, -1]]);
  });

  it("returns a non-404 response confirming user steam sync route is mounted", async () => {
    const res = await app.request("/api/v1/user/me/steam/sync", { method: "POST" });
    expect(res.status).not.toBe(404);
  });
});
