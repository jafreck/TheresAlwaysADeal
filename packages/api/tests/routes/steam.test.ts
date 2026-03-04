import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks (hoisted before imports) ──────────────────────────────────────────

const mockVerifyAccessToken = vi.fn();
vi.mock("../../src/lib/jwt.js", () => ({
  verifyAccessToken: (...args: unknown[]) => mockVerifyAccessToken(...args),
}));

let mockDbSelectResult: any[] = [];
let mockDbUpdateResult: any[] = [];

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
  update: vi.fn().mockReturnValue({
    set: vi.fn().mockReturnValue({
      where: vi.fn().mockImplementation(() => Promise.resolve(mockDbUpdateResult)),
    }),
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
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((col: string, val: unknown) => ({ col, val })),
}));

// ─── App under test ───────────────────────────────────────────────────────────

const { createSteamApp } = await import("../../src/routes/steam.js");

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeApp() {
  return createSteamApp();
}

function authHeader(token = "valid-token") {
  return { Authorization: `Bearer ${token}` };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("createSteamApp", () => {
  it("should return a Hono app", () => {
    const app = makeApp();
    expect(app).toBeDefined();
    expect(typeof app.request).toBe("function");
  });
});

describe("GET /", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockVerifyAccessToken.mockReturnValue({ sub: "user-1", email: "test@example.com" });
  });

  it("should return 401 without auth header", async () => {
    const app = makeApp();
    const res = await app.request("/");
    expect(res.status).toBe(401);
  });

  it("should redirect to Steam OpenID login with correct parameters", async () => {
    const app = makeApp();
    const res = await app.request("/", {
      headers: authHeader(),
      redirect: "manual",
    });

    expect(res.status).toBe(302);
    const location = res.headers.get("Location") ?? "";
    expect(location).toContain("https://steamcommunity.com/openid/login");
    expect(location).toContain("openid.ns=");
    expect(location).toContain("openid.mode=checkid_setup");
    expect(location).toContain("openid.return_to=");
    expect(location).toContain("openid.identity=");
    expect(location).toContain("openid.claimed_id=");
  });
});

describe("GET /callback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockVerifyAccessToken.mockReturnValue({ sub: "user-1", email: "test@example.com" });
    mockDb.update.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockImplementation(() => Promise.resolve([])),
      }),
    });
  });

  it("should return 401 without auth header", async () => {
    const app = makeApp();
    const res = await app.request("/callback");
    expect(res.status).toBe(401);
  });

  it("should return 400 when required OpenID params are missing", async () => {
    const app = makeApp();
    const res = await app.request("/callback", {
      headers: authHeader(),
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Missing required OpenID parameters");
  });

  it("should return 400 when Steam validation fails", async () => {
    // Mock fetch to return invalid response
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockResolvedValue({
      text: () => Promise.resolve("ns:http://specs.openid.net/auth/2.0\nis_valid:false\n"),
    });

    const app = makeApp();
    const params = new URLSearchParams({
      "openid.claimed_id": "https://steamcommunity.com/openid/id/76561198000000000",
      "openid.sig": "test-sig",
      "openid.assoc_handle": "test-handle",
    });
    const res = await app.request(`/callback?${params.toString()}`, {
      headers: authHeader(),
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Steam OpenID validation failed");

    globalThis.fetch = originalFetch;
  });

  it("should link Steam account on valid assertion", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockResolvedValue({
      text: () => Promise.resolve("ns:http://specs.openid.net/auth/2.0\nis_valid:true\n"),
    });

    const app = makeApp();
    const params = new URLSearchParams({
      "openid.claimed_id": "https://steamcommunity.com/openid/id/76561198000000000",
      "openid.sig": "test-sig",
      "openid.assoc_handle": "test-handle",
    });
    const res = await app.request(`/callback?${params.toString()}`, {
      headers: authHeader(),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toBe("Steam account linked");
    expect(body.steamId).toBe("76561198000000000");

    globalThis.fetch = originalFetch;
  });

  it("should return 400 for invalid claimed_id format", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockResolvedValue({
      text: () => Promise.resolve("ns:http://specs.openid.net/auth/2.0\nis_valid:true\n"),
    });

    const app = makeApp();
    const params = new URLSearchParams({
      "openid.claimed_id": "https://example.com/not-steam",
      "openid.sig": "test-sig",
      "openid.assoc_handle": "test-handle",
    });
    const res = await app.request(`/callback?${params.toString()}`, {
      headers: authHeader(),
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid Steam claimed_id");

    globalThis.fetch = originalFetch;
  });

  it("should send check_authentication mode in the verification POST to Steam", async () => {
    const originalFetch = globalThis.fetch;
    const fetchMock = vi.fn().mockResolvedValue({
      text: () => Promise.resolve("ns:http://specs.openid.net/auth/2.0\nis_valid:true\n"),
    });
    globalThis.fetch = fetchMock;

    const app = makeApp();
    const params = new URLSearchParams({
      "openid.claimed_id": "https://steamcommunity.com/openid/id/76561198000000000",
      "openid.sig": "test-sig",
      "openid.assoc_handle": "test-handle",
    });
    await app.request(`/callback?${params.toString()}`, {
      headers: authHeader(),
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, opts] = fetchMock.mock.calls[0];
    expect(url).toBe("https://steamcommunity.com/openid/login");
    expect(opts.method).toBe("POST");
    const body = new URLSearchParams(opts.body);
    expect(body.get("openid.mode")).toBe("check_authentication");

    globalThis.fetch = originalFetch;
  });
});

describe("GET / (custom env vars)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockVerifyAccessToken.mockReturnValue({ sub: "user-1", email: "test@example.com" });
  });

  it("should use STEAM_OPENID_REALM and STEAM_OPENID_RETURN_URL env vars when set", async () => {
    const origRealm = process.env.STEAM_OPENID_REALM;
    const origReturn = process.env.STEAM_OPENID_RETURN_URL;
    process.env.STEAM_OPENID_REALM = "https://myapp.example.com";
    process.env.STEAM_OPENID_RETURN_URL = "https://myapp.example.com/cb";

    const app = makeApp();
    const res = await app.request("/", {
      headers: authHeader(),
      redirect: "manual",
    });

    const location = res.headers.get("Location") ?? "";
    expect(location).toContain("openid.realm=https%3A%2F%2Fmyapp.example.com");
    expect(location).toContain("openid.return_to=https%3A%2F%2Fmyapp.example.com%2Fcb");

    // Restore env
    if (origRealm === undefined) delete process.env.STEAM_OPENID_REALM;
    else process.env.STEAM_OPENID_REALM = origRealm;
    if (origReturn === undefined) delete process.env.STEAM_OPENID_RETURN_URL;
    else process.env.STEAM_OPENID_RETURN_URL = origReturn;
  });
});
