import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks (hoisted before imports) ──────────────────────────────────────────

const mockVerifyAccessToken = vi.fn();
vi.mock("../../src/lib/jwt.js", () => ({
  verifyAccessToken: (...args: unknown[]) => mockVerifyAccessToken(...args),
}));

let mockDbSelectResult: any[] = [];
let mockDbInsertResult: any[] = [];
let mockDbUpdateResult: any[] = [];
let mockDbDeleteResult: any[] = [];

function createSelectBuilder() {
  const builder: any = {
    from: () => builder,
    where: () => builder,
    limit: () => Promise.resolve(mockDbSelectResult),
    then: (resolve: (v: any) => any, reject: (e: any) => any) =>
      Promise.resolve(mockDbSelectResult).then(resolve, reject),
  };
  return builder;
}

const mockDb = {
  select: vi.fn().mockReturnValue(createSelectBuilder()),
  insert: vi.fn().mockReturnValue({
    values: vi.fn().mockReturnValue({
      returning: vi.fn().mockImplementation(() => Promise.resolve(mockDbInsertResult)),
    }),
  }),
  update: vi.fn().mockReturnValue({
    set: vi.fn().mockReturnValue({
      where: vi.fn().mockImplementation(() => Promise.resolve(mockDbUpdateResult)),
    }),
  }),
  delete: vi.fn().mockReturnValue({
    where: vi.fn().mockImplementation(() => Promise.resolve(mockDbDeleteResult)),
  }),
};

const stubTable = (cols: Record<string, string>) => cols;

vi.mock("@taad/db", () => ({
  db: mockDb,
  users: stubTable({
    id: "id",
    email: "email",
    steamId: "steamId",
  }),
  wishlists: stubTable({
    id: "id",
    userId: "userId",
    gameId: "gameId",
    source: "source",
  }),
  games: stubTable({
    id: "id",
    steamAppId: "steamAppId",
  }),
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((col: string, val: unknown) => ({ col, val })),
  and: vi.fn((...args: unknown[]) => args),
}));

// ─── App under test ───────────────────────────────────────────────────────────

const { createUserApp } = await import("../../src/routes/user.js");

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeApp() {
  return createUserApp();
}

function authHeader(token = "valid-token") {
  return { Authorization: `Bearer ${token}` };
}

function jsonRequest(app: any, path: string, body?: any, opts: RequestInit = {}) {
  return app.request(path, {
    method: opts.method ?? "POST",
    headers: { "Content-Type": "application/json", ...authHeader(), ...opts.headers },
    body: body ? JSON.stringify(body) : undefined,
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("createUserApp", () => {
  it("should return a Hono app", () => {
    const app = makeApp();
    expect(app).toBeDefined();
    expect(typeof app.request).toBe("function");
  });
});

describe("DELETE /me/steam", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockVerifyAccessToken.mockReturnValue({ sub: "user-1", email: "test@example.com" });
    mockDb.delete.mockReturnValue({
      where: vi.fn().mockImplementation(() => Promise.resolve([])),
    });
    mockDb.update.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockImplementation(() => Promise.resolve([])),
      }),
    });
  });

  it("should return 401 without auth header", async () => {
    const app = makeApp();
    const res = await app.request("/me/steam", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirm: true }),
    });
    expect(res.status).toBe(401);
  });

  it("should return 400 when confirm is missing", async () => {
    const app = makeApp();
    const res = await app.request("/me/steam", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify({}),
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Confirmation required");
  });

  it("should return 400 when confirm is false", async () => {
    const app = makeApp();
    const res = await app.request("/me/steam", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify({ confirm: false }),
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Confirmation required");
  });

  it("should unlink Steam account when confirm is true", async () => {
    const app = makeApp();
    const res = await app.request("/me/steam", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify({ confirm: true }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toBe("Steam account unlinked");
    expect(mockDb.delete).toHaveBeenCalled();
    expect(mockDb.update).toHaveBeenCalled();
  });
});

describe("POST /me/steam/sync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockVerifyAccessToken.mockReturnValue({ sub: "user-1", email: "test@example.com" });
    mockDb.select.mockReturnValue(createSelectBuilder());
  });

  it("should return 401 without auth header", async () => {
    const app = makeApp();
    const res = await app.request("/me/steam/sync", { method: "POST" });
    expect(res.status).toBe(401);
  });

  it("should return 400 when no Steam account is linked", async () => {
    mockDbSelectResult = [{ steamId: null }];
    mockDb.select.mockReturnValue(createSelectBuilder());

    const app = makeApp();
    const res = await jsonRequest(app, "/me/steam/sync");

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("No Steam account linked");
  });

  it("should return 200 with private flag when wishlist fetch fails", async () => {
    mockDbSelectResult = [{ steamId: "76561198000000000" }];
    mockDb.select.mockReturnValue(createSelectBuilder());

    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });

    const app = makeApp();
    const res = await jsonRequest(app, "/me/steam/sync");

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.private).toBe(true);
    expect(body.synced).toBe(0);

    globalThis.fetch = originalFetch;
  });

  it("should return 200 with synced count on successful sync", async () => {
    // First call: get user's steamId; subsequent: game lookups and wishlist checks
    let selectCallCount = 0;
    mockDb.select.mockImplementation(() => {
      selectCallCount++;
      const result = selectCallCount === 1
        ? [{ steamId: "76561198000000000" }]  // user lookup
        : selectCallCount % 2 === 0
          ? [{ id: "game-1" }]  // game found
          : [];  // no existing wishlist entry
      const builder: any = {
        from: () => builder,
        where: () => builder,
        limit: () => Promise.resolve(result),
        then: (resolve: (v: any) => any, reject: (e: any) => any) =>
          Promise.resolve(result).then(resolve, reject),
      };
      return builder;
    });

    mockDb.insert.mockReturnValue({
      values: vi.fn().mockResolvedValue(undefined),
    });

    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ "440": { name: "Team Fortress 2" } }),
    });

    const app = makeApp();
    const res = await jsonRequest(app, "/me/steam/sync");

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toBe("Steam wishlist synced");
    expect(typeof body.synced).toBe("number");

    globalThis.fetch = originalFetch;
  });

  it("should return private flag when empty wishlist object is returned", async () => {
    mockDbSelectResult = [{ steamId: "76561198000000000" }];
    mockDb.select.mockReturnValue(createSelectBuilder());

    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });

    const app = makeApp();
    const res = await jsonRequest(app, "/me/steam/sync");

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.private).toBe(true);
    expect(body.synced).toBe(0);

    globalThis.fetch = originalFetch;
  });

  it("should return private flag when fetch throws an error", async () => {
    mockDbSelectResult = [{ steamId: "76561198000000000" }];
    mockDb.select.mockReturnValue(createSelectBuilder());

    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

    const app = makeApp();
    const res = await jsonRequest(app, "/me/steam/sync");

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.private).toBe(true);
    expect(body.synced).toBe(0);

    globalThis.fetch = originalFetch;
  });

  it("should return synced 0 when no games match Steam appids", async () => {
    // First select: user lookup returns steamId; subsequent: game lookups return empty
    let selectCallCount = 0;
    mockDb.select.mockImplementation(() => {
      selectCallCount++;
      const result = selectCallCount === 1
        ? [{ steamId: "76561198000000000" }]
        : [];  // no game matches
      const builder: any = {
        from: () => builder,
        where: () => builder,
        limit: () => Promise.resolve(result),
        then: (resolve: (v: any) => any, reject: (e: any) => any) =>
          Promise.resolve(result).then(resolve, reject),
      };
      return builder;
    });

    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ "99999": { name: "Unknown Game" } }),
    });

    const app = makeApp();
    const res = await jsonRequest(app, "/me/steam/sync");

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.synced).toBe(0);
    expect(body.private).toBe(false);

    globalThis.fetch = originalFetch;
  });
});
