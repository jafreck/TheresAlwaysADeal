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
  stores: stubTable({ id: "id", name: "name", slug: "slug", logoUrl: "logoUrl", baseUrl: "baseUrl" }),
}));

// ─── App under test ───────────────────────────────────────────────────────────

const { storesApp } = await import("../../src/routes/stores.js");

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("storesApp", () => {
  it("should be a Hono app", () => {
    expect(storesApp).toBeDefined();
    expect(typeof storesApp.request).toBe("function");
  });
});

describe("GET / (stores list)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDbResult = [];
    mockDb.select.mockReturnValue(createBuilder());
  });

  it("should return 200 with envelope response for empty store list", async () => {
    mockDbResult = [];
    mockDb.select.mockReturnValue(createBuilder());

    const res = await storesApp.request("/");
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toHaveProperty("data");
    expect(body).toHaveProperty("meta");
    expect(body.data).toEqual([]);
    expect(body.meta.total).toBe(0);
    expect(body.meta.page).toBe(1);
  });

  it("should return 200 with stores data in envelope format", async () => {
    const storeRows = [
      { id: "s1", name: "Steam", slug: "steam", logoUrl: "https://steam.com/logo.png", baseUrl: "https://store.steampowered.com" },
      { id: "s2", name: "GOG", slug: "gog", logoUrl: "https://gog.com/logo.png", baseUrl: "https://www.gog.com" },
    ];
    mockDbResult = storeRows;
    mockDb.select.mockReturnValue(createBuilder());

    const res = await storesApp.request("/");
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.data).toEqual(storeRows);
    expect(body.meta.total).toBe(2);
    expect(body.meta.page).toBe(1);
    expect(body.meta.limit).toBe(2);
    expect(body.meta.hasNext).toBe(false);
  });

  it("should return correct meta when a single store exists", async () => {
    const storeRows = [
      { id: "s1", name: "Steam", slug: "steam", logoUrl: "https://steam.com/logo.png", baseUrl: "https://store.steampowered.com" },
    ];
    mockDbResult = storeRows;
    mockDb.select.mockReturnValue(createBuilder());

    const res = await storesApp.request("/");
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.data).toHaveLength(1);
    expect(body.meta.total).toBe(1);
    expect(body.meta.limit).toBe(1);
    expect(body.meta.hasNext).toBe(false);
  });

  it("should include all expected store fields", async () => {
    const store = { id: "s1", name: "Steam", slug: "steam", logoUrl: "https://steam.com/logo.png", baseUrl: "https://store.steampowered.com" };
    mockDbResult = [store];
    mockDb.select.mockReturnValue(createBuilder());

    const res = await storesApp.request("/");
    expect(res.status).toBe(200);

    const body = await res.json();
    const returned = body.data[0];
    expect(returned).toHaveProperty("id");
    expect(returned).toHaveProperty("name");
    expect(returned).toHaveProperty("slug");
    expect(returned).toHaveProperty("logoUrl");
    expect(returned).toHaveProperty("baseUrl");
  });
});
