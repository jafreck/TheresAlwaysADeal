import { describe, it, expect } from "vitest";
import { gameSchema } from "../src/schemas.js";

describe("gameSchema", () => {
  const validGame = {
    title: "Half-Life 2",
    slug: "half-life-2",
    storeUrl: "https://store.steampowered.com/app/220",
    price: 9.99,
    originalPrice: 19.99,
    discountPercent: 50,
    currency: "USD",
    storeSlug: "steam",
    storeGameId: "220",
  };

  it("should parse a valid game object", () => {
    const result = gameSchema.safeParse(validGame);
    expect(result.success).toBe(true);
  });

  it("should require title", () => {
    const result = gameSchema.safeParse({ ...validGame, title: "" });
    expect(result.success).toBe(false);
  });

  it("should require slug", () => {
    const result = gameSchema.safeParse({ ...validGame, slug: "" });
    expect(result.success).toBe(false);
  });

  it("should require a valid storeUrl", () => {
    const result = gameSchema.safeParse({ ...validGame, storeUrl: "not-a-url" });
    expect(result.success).toBe(false);
  });

  it("should reject negative price", () => {
    const result = gameSchema.safeParse({ ...validGame, price: -1 });
    expect(result.success).toBe(false);
  });

  it("should accept price of zero", () => {
    const result = gameSchema.safeParse({ ...validGame, price: 0 });
    expect(result.success).toBe(true);
  });

  it("should reject discountPercent above 100", () => {
    const result = gameSchema.safeParse({ ...validGame, discountPercent: 101 });
    expect(result.success).toBe(false);
  });

  it("should reject discountPercent below 0", () => {
    const result = gameSchema.safeParse({ ...validGame, discountPercent: -1 });
    expect(result.success).toBe(false);
  });

  it("should default currency to USD when omitted", () => {
    const { currency: _c, ...withoutCurrency } = validGame;
    const result = gameSchema.safeParse(withoutCurrency);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.currency).toBe("USD");
    }
  });

  it("should allow optional fields to be omitted", () => {
    const minimal = {
      title: "Minimal Game",
      slug: "minimal-game",
      storeUrl: "https://example.com/game",
      price: 5.0,
      storeSlug: "example-store",
    };
    const result = gameSchema.safeParse(minimal);
    expect(result.success).toBe(true);
  });

  it("should accept an optional saleEndsAt as an ISO datetime string", () => {
    const result = gameSchema.safeParse({
      ...validGame,
      saleEndsAt: "2025-12-31T23:59:59.000Z",
    });
    expect(result.success).toBe(true);
  });

  it("should parse successfully when saleEndsAt is omitted", () => {
    const { ...withoutSaleEndsAt } = validGame;
    const result = gameSchema.safeParse(withoutSaleEndsAt);
    expect(result.success).toBe(true);
  });

  it("should require storeSlug", () => {
    const result = gameSchema.safeParse({ ...validGame, storeSlug: "" });
    expect(result.success).toBe(false);
  });

  it("should allow choiceIncluded to be omitted", () => {
    const result = gameSchema.safeParse(validGame);
    expect(result.success).toBe(true);
  });

  it("should accept choiceIncluded as true", () => {
    const result = gameSchema.safeParse({ ...validGame, choiceIncluded: true });
    expect(result.success).toBe(true);
  });

  it("should accept choiceIncluded as false", () => {
    const result = gameSchema.safeParse({ ...validGame, choiceIncluded: false });
    expect(result.success).toBe(true);
  });
});
