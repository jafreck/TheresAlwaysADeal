import { describe, it, expect } from "vitest";

const { openApiApp } = await import("../src/openapi.js");

describe("openApiApp", () => {
  it("should return a Hono app with a request method", () => {
    expect(openApiApp).toBeDefined();
    expect(typeof openApiApp.request).toBe("function");
  });
});

describe("GET /openapi.json", () => {
  it("should return 200 with JSON content", async () => {
    const res = await openApiApp.request("/openapi.json");
    expect(res.status).toBe(200);

    const contentType = res.headers.get("content-type");
    expect(contentType).toContain("application/json");
  });

  it("should return a valid OpenAPI 3.0.3 spec", async () => {
    const res = await openApiApp.request("/openapi.json");
    const spec = await res.json();

    expect(spec.openapi).toBe("3.0.3");
  });

  it("should include API info with title and version", async () => {
    const res = await openApiApp.request("/openapi.json");
    const spec = await res.json();

    expect(spec.info).toBeDefined();
    expect(spec.info.title).toBe("TheresAlwaysADeal API");
    expect(spec.info.version).toBe("1.0.0");
    expect(spec.info).toHaveProperty("description");
  });

  it("should include server configuration", async () => {
    const res = await openApiApp.request("/openapi.json");
    const spec = await res.json();

    expect(spec.servers).toBeDefined();
    expect(spec.servers).toHaveLength(1);
    expect(spec.servers[0].url).toBe("/api/v1");
  });

  it("should document all game endpoints", async () => {
    const res = await openApiApp.request("/openapi.json");
    const spec = await res.json();

    expect(spec.paths["/games"]).toBeDefined();
    expect(spec.paths["/games"].get).toBeDefined();
    expect(spec.paths["/games/search"]).toBeDefined();
    expect(spec.paths["/games/search"].get).toBeDefined();
    expect(spec.paths["/games/{slug}"]).toBeDefined();
    expect(spec.paths["/games/{slug}"].get).toBeDefined();
    expect(spec.paths["/games/{slug}/price-history"]).toBeDefined();
    expect(spec.paths["/games/{slug}/price-history"].get).toBeDefined();
  });

  it("should document all deal endpoints", async () => {
    const res = await openApiApp.request("/openapi.json");
    const spec = await res.json();

    expect(spec.paths["/deals"]).toBeDefined();
    expect(spec.paths["/deals"].get).toBeDefined();
    expect(spec.paths["/deals/free"]).toBeDefined();
    expect(spec.paths["/deals/free"].get).toBeDefined();
    expect(spec.paths["/deals/all-time-lows"]).toBeDefined();
    expect(spec.paths["/deals/all-time-lows"].get).toBeDefined();
    expect(spec.paths["/deals/rankings"]).toBeDefined();
    expect(spec.paths["/deals/rankings"].get).toBeDefined();
    expect(spec.paths["/deals/{storeListingId}/stats"]).toBeDefined();
    expect(spec.paths["/deals/{storeListingId}/stats"].get).toBeDefined();
  });

  it("should document the stores endpoint", async () => {
    const res = await openApiApp.request("/openapi.json");
    const spec = await res.json();

    expect(spec.paths["/stores"]).toBeDefined();
    expect(spec.paths["/stores"].get).toBeDefined();
  });

  it("should include component schemas for EnvelopeResponse and Error", async () => {
    const res = await openApiApp.request("/openapi.json");
    const spec = await res.json();

    expect(spec.components).toBeDefined();
    expect(spec.components.schemas).toBeDefined();
    expect(spec.components.schemas.EnvelopeResponse).toBeDefined();
    expect(spec.components.schemas.Error).toBeDefined();
  });

  it("should define EnvelopeResponse with data and meta properties", async () => {
    const res = await openApiApp.request("/openapi.json");
    const spec = await res.json();

    const envelope = spec.components.schemas.EnvelopeResponse;
    expect(envelope.type).toBe("object");
    expect(envelope.properties.data).toBeDefined();
    expect(envelope.properties.meta).toBeDefined();
    expect(envelope.properties.meta.properties.total).toBeDefined();
    expect(envelope.properties.meta.properties.page).toBeDefined();
    expect(envelope.properties.meta.properties.limit).toBeDefined();
    expect(envelope.properties.meta.properties.hasNext).toBeDefined();
  });

  it("should define Error schema with error property", async () => {
    const res = await openApiApp.request("/openapi.json");
    const spec = await res.json();

    const errorSchema = spec.components.schemas.Error;
    expect(errorSchema.type).toBe("object");
    expect(errorSchema.properties.error).toBeDefined();
    expect(errorSchema.properties.error.type).toBe("string");
  });

  it("should document query parameters for deals endpoint", async () => {
    const res = await openApiApp.request("/openapi.json");
    const spec = await res.json();

    const dealsParams = spec.paths["/deals"].get.parameters;
    const paramNames = dealsParams.map((p: any) => p.name);

    expect(paramNames).toContain("page");
    expect(paramNames).toContain("limit");
    expect(paramNames).toContain("store");
    expect(paramNames).toContain("genre");
    expect(paramNames).toContain("platform");
    expect(paramNames).toContain("min_discount");
    expect(paramNames).toContain("max_price");
  });

  it("should document error responses (400, 429) for deals endpoint", async () => {
    const res = await openApiApp.request("/openapi.json");
    const spec = await res.json();

    const dealsResponses = spec.paths["/deals"].get.responses;
    expect(dealsResponses["400"]).toBeDefined();
    expect(dealsResponses["429"]).toBeDefined();
  });

  it("should document 404 response for game detail endpoint", async () => {
    const res = await openApiApp.request("/openapi.json");
    const spec = await res.json();

    const gameDetailResponses = spec.paths["/games/{slug}"].get.responses;
    expect(gameDetailResponses["404"]).toBeDefined();
  });

  it("should include tags for endpoint grouping", async () => {
    const res = await openApiApp.request("/openapi.json");
    const spec = await res.json();

    expect(spec.paths["/games"].get.tags).toContain("Games");
    expect(spec.paths["/deals"].get.tags).toContain("Deals");
    expect(spec.paths["/stores"].get.tags).toContain("Stores");
  });

  it("should document search endpoint with required q parameter", async () => {
    const res = await openApiApp.request("/openapi.json");
    const spec = await res.json();

    const searchParams = spec.paths["/games/search"].get.parameters;
    const qParam = searchParams.find((p: any) => p.name === "q");

    expect(qParam).toBeDefined();
    expect(qParam.required).toBe(true);
    expect(qParam.in).toBe("query");
  });

  it("should document search endpoint filter parameters", async () => {
    const res = await openApiApp.request("/openapi.json");
    const spec = await res.json();

    const searchParams = spec.paths["/games/search"].get.parameters;
    const paramNames = searchParams.map((p: any) => p.name);

    expect(paramNames).toContain("store");
    expect(paramNames).toContain("genre");
    expect(paramNames).toContain("min_discount");
    expect(paramNames).toContain("max_price");
  });

  it("should document the autocomplete endpoint", async () => {
    const res = await openApiApp.request("/openapi.json");
    const spec = await res.json();

    expect(spec.paths["/games/autocomplete"]).toBeDefined();
    expect(spec.paths["/games/autocomplete"].get).toBeDefined();
    expect(spec.paths["/games/autocomplete"].get.tags).toContain("Games");
  });

  it("should document autocomplete q parameter as required", async () => {
    const res = await openApiApp.request("/openapi.json");
    const spec = await res.json();

    const params = spec.paths["/games/autocomplete"].get.parameters;
    const qParam = params.find((p: any) => p.name === "q");

    expect(qParam).toBeDefined();
    expect(qParam.required).toBe(true);
    expect(qParam.schema.minLength).toBe(1);
  });

  it("should document autocomplete limit parameter with default 5 and max 10", async () => {
    const res = await openApiApp.request("/openapi.json");
    const spec = await res.json();

    const params = spec.paths["/games/autocomplete"].get.parameters;
    const limitParam = params.find((p: any) => p.name === "limit");

    expect(limitParam).toBeDefined();
    expect(limitParam.schema.default).toBe(5);
    expect(limitParam.schema.maximum).toBe(10);
  });

  it("should document autocomplete response schema with data array of title/slug objects", async () => {
    const res = await openApiApp.request("/openapi.json");
    const spec = await res.json();

    const responseSchema =
      spec.paths["/games/autocomplete"].get.responses["200"].content["application/json"].schema;

    expect(responseSchema.type).toBe("object");
    expect(responseSchema.properties.data.type).toBe("array");
    expect(responseSchema.properties.data.items.properties.title).toBeDefined();
    expect(responseSchema.properties.data.items.properties.slug).toBeDefined();
  });

  it("should document storeListingId as a required path parameter", async () => {
    const res = await openApiApp.request("/openapi.json");
    const spec = await res.json();

    const statsParams = spec.paths["/deals/{storeListingId}/stats"].get.parameters;
    const idParam = statsParams.find((p: any) => p.name === "storeListingId");

    expect(idParam).toBeDefined();
    expect(idParam.required).toBe(true);
    expect(idParam.in).toBe("path");
  });
});
