import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ────────────────────────────────────────────────────────────────────

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
const stubTable = (cols: Record<string, string>) => cols;

vi.mock("@taad/db", () => ({
  db: mockDb,
  genres: stubTable({ id: "id", name: "name", slug: "slug" }),
}));

// ─── App under test ───────────────────────────────────────────────────────────

const { genresApp } = await import("../../src/routes/genres.js");

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("genresApp", () => {
  it("should be a Hono app", () => {
    expect(genresApp).toBeDefined();
    expect(typeof genresApp.request).toBe("function");
  });
});

describe("GET / (genres list)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDbResult = [];
    mockDb.select.mockReturnValue(createBuilder());
  });

  it("should return 200 with data wrapper for empty genre list", async () => {
    mockDbResult = [];
    mockDb.select.mockReturnValue(createBuilder());

    const res = await genresApp.request("/");
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toHaveProperty("data");
    expect(body.data).toEqual([]);
  });

  it("should return 200 with genres data", async () => {
    const genreRows = [
      { id: "g1", name: "Action", slug: "action" },
      { id: "g2", name: "RPG", slug: "rpg" },
    ];
    mockDbResult = genreRows;
    mockDb.select.mockReturnValue(createBuilder());

    const res = await genresApp.request("/");
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.data).toEqual(genreRows);
  });

  it("should return correct fields for each genre", async () => {
    const genre = { id: "g1", name: "Strategy", slug: "strategy" };
    mockDbResult = [genre];
    mockDb.select.mockReturnValue(createBuilder());

    const res = await genresApp.request("/");
    expect(res.status).toBe(200);

    const body = await res.json();
    const returned = body.data[0];
    expect(returned).toHaveProperty("id");
    expect(returned).toHaveProperty("name");
    expect(returned).toHaveProperty("slug");
  });

  it("should handle a single genre", async () => {
    mockDbResult = [{ id: "g1", name: "Puzzle", slug: "puzzle" }];
    mockDb.select.mockReturnValue(createBuilder());

    const res = await genresApp.request("/");
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].name).toBe("Puzzle");
  });

  it("should handle many genres", async () => {
    mockDbResult = Array.from({ length: 20 }, (_, i) => ({
      id: `g${i}`,
      name: `Genre ${i}`,
      slug: `genre-${i}`,
    }));
    mockDb.select.mockReturnValue(createBuilder());

    const res = await genresApp.request("/");
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.data).toHaveLength(20);
  });

  it("should call db.select", async () => {
    mockDb.select.mockReturnValue(createBuilder());

    await genresApp.request("/");
    expect(mockDb.select).toHaveBeenCalled();
  });
});
