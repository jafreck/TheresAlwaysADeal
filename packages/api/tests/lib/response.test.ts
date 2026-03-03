import { describe, it, expect } from "vitest";
import { buildEnvelopeResponse } from "../../src/lib/response.js";

describe("buildEnvelopeResponse", () => {
  it("should return data and meta with correct fields", () => {
    const result = buildEnvelopeResponse(["a", "b"], 10, 1, 5);
    expect(result).toEqual({
      data: ["a", "b"],
      meta: { total: 10, page: 1, limit: 5, hasNext: true },
    });
  });

  it("should set hasNext to true when more pages remain", () => {
    const result = buildEnvelopeResponse([1, 2, 3], 100, 2, 10);
    expect(result.meta.hasNext).toBe(true);
  });

  it("should set hasNext to false when on the last page", () => {
    const result = buildEnvelopeResponse([1], 5, 1, 5);
    expect(result.meta.hasNext).toBe(false);
  });

  it("should set hasNext to false when page * limit exceeds total", () => {
    const result = buildEnvelopeResponse([], 3, 2, 5);
    expect(result.meta.hasNext).toBe(false);
  });

  it("should handle empty data array", () => {
    const result = buildEnvelopeResponse([], 0, 1, 20);
    expect(result).toEqual({
      data: [],
      meta: { total: 0, page: 1, limit: 20, hasNext: false },
    });
  });

  it("should preserve the exact data array passed in", () => {
    const items = [{ id: 1, name: "test" }];
    const result = buildEnvelopeResponse(items, 1, 1, 10);
    expect(result.data).toBe(items);
  });

  it("should handle boundary where page * limit equals total", () => {
    const result = buildEnvelopeResponse([1, 2], 4, 2, 2);
    expect(result.meta.hasNext).toBe(false);
  });
});
