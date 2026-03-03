import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks (hoisted before imports) ──────────────────────────────────────────

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

// Stub cache middleware to be a pass-through
vi.mock("../../src/middleware/cache.js", () => ({
  cacheMiddleware: () => async (_c: any, next: () => Promise<void>) => { await next(); },
}));

// Mock ioredis
const mockZrevrangebyscore = vi.fn();
vi.mock("ioredis", () => ({
  Redis: vi.fn().mockImplementation(() => ({
    zrevrangebyscore: mockZrevrangebyscore,
  })),
}));

// ─── App under test ───────────────────────────────────────────────────────────

const { createDealsApp } = await import("../../src/routes/deals.js");
const getRedis = () => null;
const app = createDealsApp(getRedis);

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("createDealsApp", () => {
  it("should return a Hono app", () => {
    expect(app).toBeDefined();
    expect(typeof app.request).toBe("function");
  });
});

describe("GET / (deals list)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDbResult = [];
    mockDb.select.mockReturnValue(createBuilder());
  });

  it("should return 200 with envelope response for empty results", async () => {
    let callCount = 0;
    mockDb.select.mockImplementation(() => {
      callCount++;
      // First select = baseQuery, second select = countQuery
      const isCountQuery = callCount === 2;
      const result = isCountQuery ? [{ total: 0 }] : [];
      const builder: any = {
        from: () => builder,
        where: () => builder,
        orderBy: () => builder,
        limit: () => builder,
        offset: () => Promise.resolve(result),
        innerJoin: () => builder,
        then: (resolve: (v: any) => any, reject: (e: any) => any) =>
          Promise.resolve(result).then(resolve, reject),
      };
      return builder;
    });

    const res = await app.request("/");
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toHaveProperty("data");
    expect(body).toHaveProperty("meta");
  });

  it("should return 200 with deals data", async () => {
    const deal = { gameId: "1", gameTitle: "Test", gameSlug: "test", storeListingId: "sl1", dealScore: "90" };
    const countResult = { total: 1 };
    let callCount = 0;
    mockDb.select.mockImplementation(() => {
      callCount++;
      // First select() creates baseQuery, second creates countQuery
      // countQuery is awaited first (thenable), baseQuery is chained with .offset()
      const isCountQuery = callCount === 2;
      const result = isCountQuery ? [countResult] : [deal];
      const builder: any = {
        from: () => builder,
        where: () => builder,
        orderBy: () => builder,
        limit: () => builder,
        offset: () => Promise.resolve(result),
        innerJoin: () => builder,
        then: (resolve: (v: any) => any, reject: (e: any) => any) =>
          Promise.resolve(result).then(resolve, reject),
      };
      return builder;
    });

    const res = await app.request("/");
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.data).toEqual([deal]);
    expect(body.meta.total).toBe(1);
    expect(body.meta.page).toBe(1);
  });

  it("should accept store filter query parameter", async () => {
    mockDb.select.mockReturnValue(createBuilder());
    mockDbResult = [{ total: 0 }];

    const res = await app.request("/?store=steam");
    expect(res.status).toBe(200);
  });

  it("should accept genre filter query parameter", async () => {
    mockDb.select.mockReturnValue(createBuilder());
    mockDbResult = [{ total: 0 }];

    const res = await app.request("/?genre=rpg");
    expect(res.status).toBe(200);
  });

  it("should accept platform filter query parameter", async () => {
    mockDb.select.mockReturnValue(createBuilder());
    mockDbResult = [{ total: 0 }];

    const res = await app.request("/?platform=pc");
    expect(res.status).toBe(200);
  });

  it("should accept min_discount query parameter", async () => {
    mockDb.select.mockReturnValue(createBuilder());
    mockDbResult = [{ total: 0 }];

    const res = await app.request("/?min_discount=50");
    expect(res.status).toBe(200);
  });

  it("should accept max_price query parameter", async () => {
    mockDb.select.mockReturnValue(createBuilder());
    mockDbResult = [{ total: 0 }];

    const res = await app.request("/?max_price=10");
    expect(res.status).toBe(200);
  });

  it("should accept page and limit pagination params", async () => {
    mockDb.select.mockReturnValue(createBuilder());
    mockDbResult = [{ total: 0 }];

    const res = await app.request("/?page=2&limit=10");
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.meta.page).toBe(2);
    expect(body.meta.limit).toBe(10);
  });

  it("should return 400 for invalid pagination", async () => {
    const res = await app.request("/?page=-1");
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body).toHaveProperty("error", "Invalid query parameters");
    expect(body).toHaveProperty("details");
  });

  it("should return 400 for limit exceeding max", async () => {
    const res = await app.request("/?limit=101");
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body).toHaveProperty("error", "Invalid query parameters");
  });
});

describe("GET /free", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDbResult = [];
    mockDb.select.mockReturnValue(createBuilder());
  });

  it("should return 200 with envelope response", async () => {
    mockDbResult = [{ total: 0 }];
    mockDb.select.mockReturnValue(createBuilder());

    const res = await app.request("/free");
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toHaveProperty("data");
    expect(body).toHaveProperty("meta");
  });

  it("should return 200 with free game data", async () => {
    const freeGame = { gameId: "1", gameTitle: "Free Game", gameSlug: "free-game", price: "0" };
    const countResult = { total: 1 };
    let callCount = 0;
    mockDb.select.mockImplementation(() => {
      callCount++;
      const result = callCount === 1 ? [countResult] : [freeGame];
      const builder: any = {
        from: () => builder,
        where: () => builder,
        orderBy: () => builder,
        limit: () => builder,
        offset: () => Promise.resolve(result),
        innerJoin: () => builder,
        then: (resolve: (v: any) => any, reject: (e: any) => any) =>
          Promise.resolve(result).then(resolve, reject),
      };
      return builder;
    });

    const res = await app.request("/free");
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.data).toEqual([freeGame]);
    expect(body.meta.total).toBe(1);
  });

  it("should accept pagination params", async () => {
    mockDbResult = [{ total: 0 }];
    mockDb.select.mockReturnValue(createBuilder());

    const res = await app.request("/free?page=3&limit=5");
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.meta.page).toBe(3);
    expect(body.meta.limit).toBe(5);
  });

  it("should return 400 for invalid pagination", async () => {
    const res = await app.request("/free?page=-1");
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body).toHaveProperty("error", "Invalid query parameters");
  });
});

describe("GET /all-time-lows", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDbResult = [];
    mockDb.select.mockReturnValue(createBuilder());
  });

  it("should return 200 with envelope response", async () => {
    mockDbResult = [{ total: 0 }];
    mockDb.select.mockReturnValue(createBuilder());

    const res = await app.request("/all-time-lows");
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toHaveProperty("data");
    expect(body).toHaveProperty("meta");
  });

  it("should return 200 with all-time low data", async () => {
    const atlGame = { gameId: "1", gameTitle: "ATL Game", gameSlug: "atl-game", allTimeLowPrice: "4.99", dealScore: "95" };
    const countResult = { total: 1 };
    let callCount = 0;
    mockDb.select.mockImplementation(() => {
      callCount++;
      const result = callCount === 1 ? [countResult] : [atlGame];
      const builder: any = {
        from: () => builder,
        where: () => builder,
        orderBy: () => builder,
        limit: () => builder,
        offset: () => Promise.resolve(result),
        innerJoin: () => builder,
        then: (resolve: (v: any) => any, reject: (e: any) => any) =>
          Promise.resolve(result).then(resolve, reject),
      };
      return builder;
    });

    const res = await app.request("/all-time-lows");
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.data).toEqual([atlGame]);
    expect(body.meta.total).toBe(1);
  });

  it("should accept pagination params", async () => {
    mockDbResult = [{ total: 0 }];
    mockDb.select.mockReturnValue(createBuilder());

    const res = await app.request("/all-time-lows?page=2&limit=10");
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.meta.page).toBe(2);
    expect(body.meta.limit).toBe(10);
  });

  it("should return 400 for invalid pagination", async () => {
    const res = await app.request("/all-time-lows?page=-1");
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body).toHaveProperty("error", "Invalid query parameters");
  });
});

describe("GET /rankings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDbResult = [];
    mockDb.select.mockReturnValue(createBuilder());
    mockZrevrangebyscore.mockReset();
  });

  it("should fall back to DB when Redis is null", async () => {
    const statsRow = { storeListingId: "sl1", dealScore: "88.00" };
    mockDbResult = [statsRow];

    const res = await app.request("/rankings");
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toEqual([{ storeListingId: "sl1", dealScore: 88 }]);
  });

  it("should return empty array when DB has no data", async () => {
    mockDbResult = [];

    const res = await app.request("/rankings");
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toEqual([]);
  });

  it("should respect limit and offset query params", async () => {
    mockDbResult = [];

    const res = await app.request("/rankings?limit=5&offset=10");
    expect(res.status).toBe(200);
    expect(mockDb.select).toHaveBeenCalled();
  });
});

describe("GET /:storeListingId/stats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDbResult = [];
    mockDb.select.mockReturnValue(createBuilder());
  });

  it("should return 200 with stats for existing listing", async () => {
    const stats = { id: "st1", storeListingId: "sl1", dealScore: "90", isAllTimeLow: true, allTimeLowPrice: "5.99" };
    mockDbResult = [stats];
    mockDb.select.mockReturnValue(createBuilder());

    const res = await app.request("/sl1/stats");
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toEqual(stats);
  });

  it("should return 404 when listing does not exist", async () => {
    mockDbResult = [];
    mockDb.select.mockReturnValue(createBuilder());

    const res = await app.request("/nonexistent/stats");
    expect(res.status).toBe(404);

    const body = await res.json();
    expect(body).toEqual({ error: "Not found" });
  });
});
