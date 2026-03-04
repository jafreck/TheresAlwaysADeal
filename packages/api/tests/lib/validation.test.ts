import { describe, it, expect } from "vitest";
import {
  paginationSchema,
  storeFilterSchema,
  genreFilterSchema,
  sortSchema,
  commonQuerySchema,
  dealsQuerySchema,
  searchQuerySchema,
  autocompleteQuerySchema,
  priceHistoryQuerySchema,
} from "../../src/lib/validation.js";

describe("paginationSchema", () => {
  it("should use defaults when no values provided", () => {
    const result = paginationSchema.parse({});
    expect(result).toEqual({ page: 1, limit: 20 });
  });

  it("should coerce string values to numbers", () => {
    const result = paginationSchema.parse({ page: "3", limit: "50" });
    expect(result).toEqual({ page: 3, limit: 50 });
  });

  it("should reject page of 0", () => {
    expect(() => paginationSchema.parse({ page: 0 })).toThrow();
  });

  it("should reject negative page", () => {
    expect(() => paginationSchema.parse({ page: -1 })).toThrow();
  });

  it("should reject limit greater than 100", () => {
    expect(() => paginationSchema.parse({ limit: 101 })).toThrow();
  });

  it("should accept limit of exactly 100", () => {
    const result = paginationSchema.parse({ limit: 100 });
    expect(result.limit).toBe(100);
  });

  it("should reject non-integer page", () => {
    expect(() => paginationSchema.parse({ page: 1.5 })).toThrow();
  });
});

describe("storeFilterSchema", () => {
  it("should accept store as optional string", () => {
    const result = storeFilterSchema.parse({});
    expect(result.store).toBeUndefined();
  });

  it("should parse store value", () => {
    const result = storeFilterSchema.parse({ store: "steam" });
    expect(result.store).toBe("steam");
  });
});

describe("genreFilterSchema", () => {
  it("should accept genre as optional string", () => {
    const result = genreFilterSchema.parse({});
    expect(result.genre).toBeUndefined();
  });

  it("should parse genre value", () => {
    const result = genreFilterSchema.parse({ genre: "rpg" });
    expect(result.genre).toBe("rpg");
  });
});

describe("sortSchema", () => {
  it("should accept sort as optional", () => {
    const result = sortSchema.parse({});
    expect(result.sort).toBeUndefined();
  });

  it("should accept valid sort values", () => {
    for (const val of ["release_date"]) {
      const result = sortSchema.parse({ sort: val });
      expect(result.sort).toBe(val);
    }
  });

  it("should reject removed sort values", () => {
    for (const val of ["discount", "deal_score", "price"]) {
      expect(() => sortSchema.parse({ sort: val })).toThrow();
    }
  });

  it("should reject invalid sort values", () => {
    expect(() => sortSchema.parse({ sort: "invalid" })).toThrow();
  });
});

describe("commonQuerySchema", () => {
  it("should merge all schemas with defaults", () => {
    const result = commonQuerySchema.parse({});
    expect(result).toEqual({
      page: 1,
      limit: 20,
      store: undefined,
      genre: undefined,
      sort: undefined,
    });
  });

  it("should parse all fields together", () => {
    const result = commonQuerySchema.parse({
      page: "2",
      limit: "10",
      store: "steam",
      genre: "rpg",
      sort: "release_date",
    });
    expect(result).toEqual({
      page: 2,
      limit: 10,
      store: "steam",
      genre: "rpg",
      sort: "release_date",
    });
  });
});

describe("dealsQuerySchema", () => {
  it("should use defaults when no values provided", () => {
    const result = dealsQuerySchema.parse({});
    expect(result).toEqual({
      page: 1,
      limit: 20,
      store: undefined,
      genre: undefined,
      sort: undefined,
      min_discount: undefined,
      max_price: undefined,
      platform: undefined,
    });
  });

  it("should parse min_discount as a number", () => {
    const result = dealsQuerySchema.parse({ min_discount: "50" });
    expect(result.min_discount).toBe(50);
  });

  it("should parse max_price as a number", () => {
    const result = dealsQuerySchema.parse({ max_price: "9.99" });
    expect(result.max_price).toBe(9.99);
  });

  it("should accept platform as optional string", () => {
    const result = dealsQuerySchema.parse({ platform: "pc" });
    expect(result.platform).toBe("pc");
  });

  it("should parse all deals-specific fields together", () => {
    const result = dealsQuerySchema.parse({
      page: "2",
      limit: "10",
      store: "steam",
      genre: "rpg",
      platform: "pc",
      min_discount: "25",
      max_price: "15",
    });
    expect(result).toEqual({
      page: 2,
      limit: 10,
      store: "steam",
      genre: "rpg",
      sort: undefined,
      platform: "pc",
      min_discount: 25,
      max_price: 15,
    });
  });

  it("should inherit pagination validation (reject limit > 100)", () => {
    expect(() => dealsQuerySchema.parse({ limit: 101 })).toThrow();
  });
});

describe("searchQuerySchema", () => {
  it("should parse q with pagination defaults", () => {
    const result = searchQuerySchema.parse({ q: "witcher" });
    expect(result).toEqual({ q: "witcher", page: 1, limit: 20 });
  });

  it("should reject missing q parameter", () => {
    expect(() => searchQuerySchema.parse({})).toThrow();
  });

  it("should reject empty q parameter", () => {
    expect(() => searchQuerySchema.parse({ q: "" })).toThrow();
  });

  it("should accept pagination with q", () => {
    const result = searchQuerySchema.parse({ q: "test", page: "3", limit: "10" });
    expect(result).toEqual({ q: "test", page: 3, limit: 10 });
  });

  it("should inherit pagination validation (reject negative page)", () => {
    expect(() => searchQuerySchema.parse({ q: "test", page: -1 })).toThrow();
  });

  it("should parse optional store filter", () => {
    const result = searchQuerySchema.parse({ q: "witcher", store: "steam" });
    expect(result.store).toBe("steam");
  });

  it("should parse optional genre filter", () => {
    const result = searchQuerySchema.parse({ q: "witcher", genre: "rpg" });
    expect(result.genre).toBe("rpg");
  });

  it("should parse optional min_discount as a number", () => {
    const result = searchQuerySchema.parse({ q: "witcher", min_discount: "25" });
    expect(result.min_discount).toBe(25);
  });

  it("should parse optional max_price as a number", () => {
    const result = searchQuerySchema.parse({ q: "witcher", max_price: "9.99" });
    expect(result.max_price).toBe(9.99);
  });

  it("should leave filter fields undefined when omitted", () => {
    const result = searchQuerySchema.parse({ q: "witcher" });
    expect(result.store).toBeUndefined();
    expect(result.genre).toBeUndefined();
    expect(result.min_discount).toBeUndefined();
    expect(result.max_price).toBeUndefined();
  });

  it("should parse all filter fields together", () => {
    const result = searchQuerySchema.parse({
      q: "witcher",
      page: "2",
      limit: "10",
      store: "steam",
      genre: "rpg",
      min_discount: "25",
      max_price: "15.99",
    });
    expect(result).toEqual({
      q: "witcher",
      page: 2,
      limit: 10,
      store: "steam",
      genre: "rpg",
      min_discount: 25,
      max_price: 15.99,
    });
  });

  it("should inherit pagination validation (reject limit > 100)", () => {
    expect(() => searchQuerySchema.parse({ q: "test", limit: 101 })).toThrow();
  });
});

describe("autocompleteQuerySchema", () => {
  it("should parse q with default limit", () => {
    const result = autocompleteQuerySchema.parse({ q: "witc" });
    expect(result).toEqual({ q: "witc", limit: 5 });
  });

  it("should reject missing q parameter", () => {
    expect(() => autocompleteQuerySchema.parse({})).toThrow();
  });

  it("should reject empty q parameter", () => {
    expect(() => autocompleteQuerySchema.parse({ q: "" })).toThrow();
  });

  it("should accept custom limit", () => {
    const result = autocompleteQuerySchema.parse({ q: "test", limit: "3" });
    expect(result.limit).toBe(3);
  });

  it("should reject limit greater than 10", () => {
    expect(() => autocompleteQuerySchema.parse({ q: "test", limit: 11 })).toThrow();
  });

  it("should reject non-positive limit", () => {
    expect(() => autocompleteQuerySchema.parse({ q: "test", limit: 0 })).toThrow();
  });

  it("should reject non-integer limit", () => {
    expect(() => autocompleteQuerySchema.parse({ q: "test", limit: 2.5 })).toThrow();
  });

  it("should accept limit of exactly 10", () => {
    const result = autocompleteQuerySchema.parse({ q: "test", limit: 10 });
    expect(result.limit).toBe(10);
  });

  it("should accept limit of exactly 1", () => {
    const result = autocompleteQuerySchema.parse({ q: "test", limit: 1 });
    expect(result.limit).toBe(1);
  });

  it("should coerce string limit to number", () => {
    const result = autocompleteQuerySchema.parse({ q: "test", limit: "7" });
    expect(result.limit).toBe(7);
  });

  it("should reject negative limit", () => {
    expect(() => autocompleteQuerySchema.parse({ q: "test", limit: -1 })).toThrow();
  });
});

describe("priceHistoryQuerySchema", () => {
  it("should accept empty object", () => {
    const result = priceHistoryQuerySchema.parse({});
    expect(result).toEqual({ store: undefined });
  });

  it("should accept optional store parameter", () => {
    const result = priceHistoryQuerySchema.parse({ store: "steam" });
    expect(result.store).toBe("steam");
  });
});

// ─── Auth Schemas ─────────────────────────────────────────────────────────────

import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../../src/lib/validation.js";

describe("registerSchema", () => {
  it("should parse valid email and password", () => {
    const result = registerSchema.parse({ email: "user@example.com", password: "securepass" });
    expect(result).toEqual({ email: "user@example.com", password: "securepass" });
  });

  it("should reject invalid email", () => {
    expect(() => registerSchema.parse({ email: "not-an-email", password: "securepass" })).toThrow();
  });

  it("should reject password shorter than 8 characters", () => {
    expect(() => registerSchema.parse({ email: "user@example.com", password: "short" })).toThrow();
  });

  it("should accept password of exactly 8 characters", () => {
    const result = registerSchema.parse({ email: "user@example.com", password: "12345678" });
    expect(result.password).toBe("12345678");
  });

  it("should reject missing email", () => {
    expect(() => registerSchema.parse({ password: "securepass" })).toThrow();
  });

  it("should reject missing password", () => {
    expect(() => registerSchema.parse({ email: "user@example.com" })).toThrow();
  });
});

describe("loginSchema", () => {
  it("should parse valid email and password", () => {
    const result = loginSchema.parse({ email: "user@example.com", password: "x" });
    expect(result).toEqual({ email: "user@example.com", password: "x" });
  });

  it("should reject invalid email", () => {
    expect(() => loginSchema.parse({ email: "bad", password: "x" })).toThrow();
  });

  it("should reject empty password", () => {
    expect(() => loginSchema.parse({ email: "user@example.com", password: "" })).toThrow();
  });

  it("should accept password of 1 character", () => {
    const result = loginSchema.parse({ email: "user@example.com", password: "a" });
    expect(result.password).toBe("a");
  });
});

describe("forgotPasswordSchema", () => {
  it("should parse valid email", () => {
    const result = forgotPasswordSchema.parse({ email: "user@example.com" });
    expect(result).toEqual({ email: "user@example.com" });
  });

  it("should reject invalid email", () => {
    expect(() => forgotPasswordSchema.parse({ email: "not-email" })).toThrow();
  });

  it("should reject missing email", () => {
    expect(() => forgotPasswordSchema.parse({})).toThrow();
  });
});

describe("resetPasswordSchema", () => {
  it("should parse valid token and password", () => {
    const result = resetPasswordSchema.parse({ token: "abc-123", password: "newpasswd" });
    expect(result).toEqual({ token: "abc-123", password: "newpasswd" });
  });

  it("should reject empty token", () => {
    expect(() => resetPasswordSchema.parse({ token: "", password: "newpasswd" })).toThrow();
  });

  it("should reject password shorter than 8 characters", () => {
    expect(() => resetPasswordSchema.parse({ token: "abc", password: "short" })).toThrow();
  });

  it("should reject missing token", () => {
    expect(() => resetPasswordSchema.parse({ password: "newpasswd" })).toThrow();
  });

  it("should reject missing password", () => {
    expect(() => resetPasswordSchema.parse({ token: "abc-123" })).toThrow();
  });
});
