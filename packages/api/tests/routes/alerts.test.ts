import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockVerifyUnsubscribeToken = vi.fn();
vi.mock("../../src/lib/jwt.js", () => ({
  verifyUnsubscribeToken: (...args: unknown[]) => mockVerifyUnsubscribeToken(...args),
}));

const mockUpdateWhere = vi.fn().mockImplementation(() => Promise.resolve([]));
const mockUpdateSet = vi.fn().mockReturnValue({ where: mockUpdateWhere });
const mockDbUpdate = vi.fn().mockReturnValue({ set: mockUpdateSet });

vi.mock("@taad/db", () => ({
  db: {
    update: (...args: unknown[]) => mockDbUpdate(...args),
  },
  priceAlerts: { id: "id_col", isActive: "isActive_col" },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((col: unknown, val: unknown) => ({ col, val })),
}));

import { alertsApp } from "../../src/routes/alerts.js";

// ─── Helper ───────────────────────────────────────────────────────────────────

async function request(method: string, path: string): Promise<{ status: number; body: unknown }> {
  const req = new Request(`http://localhost${path}`, { method });
  const res = await alertsApp.fetch(req);
  const body = await res.json();
  return { status: res.status, body };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("GET /unsubscribe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 400 when token query parameter is missing", async () => {
    const { status, body } = await request("GET", "/unsubscribe");
    expect(status).toBe(400);
    expect(body).toEqual({ error: "Token is required" });
  });

  it("should return 400 when token is empty", async () => {
    const { status, body } = await request("GET", "/unsubscribe?token=");
    expect(status).toBe(400);
    expect(body).toEqual({ error: "Token is required" });
  });

  it("should return 400 when token verification fails", async () => {
    mockVerifyUnsubscribeToken.mockImplementation(() => {
      throw new Error("Invalid or expired token");
    });

    const { status, body } = await request("GET", "/unsubscribe?token=bad-token");
    expect(status).toBe(400);
    expect(body).toEqual({ error: "Invalid or expired token" });
  });

  it("should deactivate alert and return 200 on valid token", async () => {
    mockVerifyUnsubscribeToken.mockReturnValue("alert-123");

    const { status, body } = await request("GET", "/unsubscribe?token=valid-token");
    expect(status).toBe(200);
    expect(body).toEqual({ message: "Alert unsubscribed successfully" });
  });

  it("should call verifyUnsubscribeToken with the token value", async () => {
    mockVerifyUnsubscribeToken.mockReturnValue("alert-456");

    await request("GET", "/unsubscribe?token=my-token-value");
    expect(mockVerifyUnsubscribeToken).toHaveBeenCalledWith("my-token-value");
  });

  it("should update priceAlerts isActive to false", async () => {
    mockVerifyUnsubscribeToken.mockReturnValue("alert-789");

    await request("GET", "/unsubscribe?token=valid-token");

    expect(mockDbUpdate).toHaveBeenCalled();
    expect(mockUpdateSet).toHaveBeenCalledWith({ isActive: false });
    expect(mockUpdateWhere).toHaveBeenCalled();
  });
});
