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

// ─── App under test ───────────────────────────────────────────────────────────

const { createGamesApp } = await import("../../src/routes/games.js");
const getRedis = () => null;
const app = createGamesApp(getRedis);

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("createGamesApp", () => {
  it("should return a Hono app", () => {
    expect(app).toBeDefined();
    expect(typeof app.request).toBe("function");
  });
});

describe("GET / (games list)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDbResult = [];
    mockDb.select.mockReturnValue(createBuilder());
  });

  it("should return 200 with envelope response for empty results", async () => {
    mockDbResult = [{ total: 0 }];
    mockDb.select
      .mockReturnValueOnce(createBuilder()) // count query
      .mockReturnValueOnce(createBuilder()); // data query
    // Second call resolves to empty rows
    mockDbResult = [];

    const res = await app.request("/");
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toHaveProperty("data");
    expect(body).toHaveProperty("meta");
  });

  it("should return 200 with games data", async () => {
    const gameRow = { id: "1", title: "Test Game", slug: "test-game" };
    const countResult = { total: 1 };
    let callCount = 0;
    mockDb.select.mockImplementation(() => {
      callCount++;
      const result = callCount === 1 ? [countResult] : [gameRow];
      const builder: any = {
        from: () => builder,
        where: () => builder,
        orderBy: () => builder,
        limit: () => builder,
        offset: () => Promise.resolve(result),
        then: (resolve: (v: any) => any, reject: (e: any) => any) =>
          Promise.resolve(result).then(resolve, reject),
      };
      return builder;
    });

    const res = await app.request("/");
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.data).toEqual([gameRow]);
    expect(body.meta.total).toBe(1);
    expect(body.meta.page).toBe(1);
    expect(body.meta.limit).toBe(20);
  });

  it("should accept store query parameter", async () => {
    mockDb.select.mockReturnValue(createBuilder());
    mockDbResult = [{ total: 0 }];

    const res = await app.request("/?store=steam");
    expect(res.status).toBe(200);
  });

  it("should accept genre query parameter", async () => {
    mockDb.select.mockReturnValue(createBuilder());
    mockDbResult = [{ total: 0 }];

    const res = await app.request("/?genre=rpg");
    expect(res.status).toBe(200);
  });

  it("should accept comma-separated genre query parameter", async () => {
    mockDb.select.mockReturnValue(createBuilder());
    mockDbResult = [{ total: 0 }];

    const res = await app.request("/?genre=rpg,action,adventure");
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toHaveProperty("data");
    expect(body).toHaveProperty("meta");
  });

  it("should handle genre parameter with whitespace around commas", async () => {
    mockDb.select.mockReturnValue(createBuilder());
    mockDbResult = [{ total: 0 }];

    const res = await app.request("/?genre=rpg%2C%20action");
    expect(res.status).toBe(200);
  });

  it("should accept sort query parameter", async () => {
    mockDb.select.mockReturnValue(createBuilder());
    mockDbResult = [{ total: 0 }];

    for (const sort of ["release_date"]) {
      const res = await app.request(`/?sort=${sort}`);
      expect(res.status).toBe(200);
    }
  });

  it("should reject removed sort values (price, discount, deal_score)", async () => {
    mockDb.select.mockReturnValue(createBuilder());
    mockDbResult = [{ total: 0 }];

    for (const sort of ["discount", "deal_score", "price"]) {
      const res = await app.request(`/?sort=${sort}`);
      expect(res.status).toBe(400);
    }
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

  it("should return 400 for invalid query parameters", async () => {
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

describe("GET /search", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDbResult = [];
    mockDb.select.mockReturnValue(createBuilder());
  });

  it("should return 200 with matching games", async () => {
    const gameRow = { id: "1", title: "The Witcher 3", slug: "the-witcher-3" };
    let callCount = 0;
    mockDb.select.mockImplementation(() => {
      callCount++;
      const result = callCount === 1 ? [{ total: 1 }] : [gameRow];
      const builder: any = {
        from: () => builder,
        where: () => builder,
        orderBy: () => builder,
        limit: () => builder,
        offset: () => Promise.resolve(result),
        then: (resolve: (v: any) => any, reject: (e: any) => any) =>
          Promise.resolve(result).then(resolve, reject),
      };
      return builder;
    });

    const res = await app.request("/search?q=witcher");
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.data).toEqual([gameRow]);
    expect(body.meta.total).toBe(1);
  });

  it("should return 400 when q parameter is missing", async () => {
    const res = await app.request("/search");
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body).toHaveProperty("error", "Invalid query parameters");
  });

  it("should return 400 when q parameter is empty", async () => {
    const res = await app.request("/search?q=");
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body).toHaveProperty("error", "Invalid query parameters");
  });

  it("should support pagination in search results", async () => {
    mockDb.select.mockReturnValue(createBuilder());
    mockDbResult = [{ total: 0 }];

    const res = await app.request("/search?q=game&page=2&limit=5");
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.meta.page).toBe(2);
    expect(body.meta.limit).toBe(5);
  });
});

describe("GET /:slug (game detail)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDbResult = [];
  });

  it("should return 200 with game detail including store listings and stats", async () => {
    const game = { id: "g1", title: "Test Game", slug: "test-game" };
    const listing = { id: "l1", storeId: "s1", storeName: "Steam", storeSlug: "steam", storeUrl: "https://steam.com/game", isActive: true, isAllTimeLow: false };
    const stat = { id: "st1", storeListingId: "l1", dealScore: "85", isAllTimeLow: false, allTimeLowPrice: "9.99" };

    let callCount = 0;
    mockDb.select.mockImplementation(() => {
      callCount++;
      let result: any[];
      if (callCount === 1) result = [game]; // game lookup
      else if (callCount === 2) result = [listing]; // listings query
      else result = [stat]; // stats query
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

    const res = await app.request("/test-game");
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.data).toMatchObject({
      id: "g1",
      title: "Test Game",
      slug: "test-game",
      storeListings: [listing],
      priceStats: [stat],
    });
  });

  it("should return 404 when slug does not match any game", async () => {
    mockDbResult = [];
    mockDb.select.mockReturnValue(createBuilder());

    const res = await app.request("/nonexistent-game");
    expect(res.status).toBe(404);

    const body = await res.json();
    expect(body).toEqual({ error: "Not found" });
  });
});

describe("GET /:slug/price-history", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDbResult = [];
  });

  it("should return 200 with price history records", async () => {
    const game = { id: "g1", title: "Test Game", slug: "test-game" };
    const priceRecord = {
      id: "ph1",
      storeListingId: "l1",
      price: "29.99",
      originalPrice: "59.99",
      currency: "USD",
      discount: 50,
      saleEndsAt: null,
      recordedAt: "2024-01-01T00:00:00Z",
    };

    let callCount = 0;
    mockDb.select.mockImplementation(() => {
      callCount++;
      const result = callCount === 1 ? [game] : [priceRecord];
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

    const res = await app.request("/test-game/price-history");
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.data).toEqual([priceRecord]);
  });

  it("should return 404 when the game slug does not exist", async () => {
    mockDbResult = [];
    mockDb.select.mockReturnValue(createBuilder());

    const res = await app.request("/nonexistent-game/price-history");
    expect(res.status).toBe(404);

    const body = await res.json();
    expect(body).toEqual({ error: "Not found" });
  });

  it("should accept optional store query parameter", async () => {
    const game = { id: "g1", title: "Test Game", slug: "test-game" };

    let callCount = 0;
    mockDb.select.mockImplementation(() => {
      callCount++;
      const result = callCount === 1 ? [game] : [];
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

    const res = await app.request("/test-game/price-history?store=steam");
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.data).toEqual([]);
  });
});
