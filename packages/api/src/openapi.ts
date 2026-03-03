import { Hono } from "hono";

const spec = {
  openapi: "3.0.3",
  info: {
    title: "TheresAlwaysADeal API",
    description: "Game deals aggregation API",
    version: "1.0.0",
  },
  servers: [{ url: "/api/v1" }],
  paths: {
    "/games": {
      get: {
        summary: "List games",
        tags: ["Games"],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20, maximum: 100 } },
          { name: "store", in: "query", schema: { type: "string" }, description: "Comma-separated store slugs" },
          { name: "genre", in: "query", schema: { type: "string" }, description: "Comma-separated genre slugs" },
          { name: "sort", in: "query", schema: { type: "string", enum: ["release_date"] } },
        ],
        responses: {
          "200": { description: "Paginated list of games", content: { "application/json": { schema: { $ref: "#/components/schemas/EnvelopeResponse" } } } },
          "400": { description: "Invalid query parameters", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "429": { description: "Rate limit exceeded", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/games/search": {
      get: {
        summary: "Search games by title",
        tags: ["Games"],
        parameters: [
          { name: "q", in: "query", required: true, schema: { type: "string", minLength: 1 }, description: "Search query" },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20, maximum: 100 } },
          { name: "store", in: "query", schema: { type: "string" }, description: "Comma-separated store slugs" },
          { name: "genre", in: "query", schema: { type: "string" }, description: "Comma-separated genre slugs" },
          { name: "min_discount", in: "query", schema: { type: "number" }, description: "Minimum discount percentage" },
          { name: "max_price", in: "query", schema: { type: "number" }, description: "Maximum price" },
        ],
        responses: {
          "200": { description: "Search results", content: { "application/json": { schema: { $ref: "#/components/schemas/EnvelopeResponse" } } } },
          "400": { description: "Invalid query parameters", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "429": { description: "Rate limit exceeded", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/games/autocomplete": {
      get: {
        summary: "Autocomplete game titles",
        tags: ["Games"],
        parameters: [
          { name: "q", in: "query", required: true, schema: { type: "string", minLength: 1 }, description: "Search query for autocomplete" },
          { name: "limit", in: "query", schema: { type: "integer", default: 5, maximum: 10 }, description: "Number of suggestions (default 5, max 10)" },
        ],
        responses: {
          "200": {
            description: "Autocomplete suggestions",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          title: { type: "string" },
                          slug: { type: "string" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          "400": { description: "Invalid query parameters", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "429": { description: "Rate limit exceeded", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/games/{slug}": {
      get: {
        summary: "Get game details",
        tags: ["Games"],
        parameters: [
          { name: "slug", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "Game details with store listings and price stats", content: { "application/json": { schema: { type: "object" } } } },
          "404": { description: "Game not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "429": { description: "Rate limit exceeded", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/games/{slug}/price-history": {
      get: {
        summary: "Get price history for a game",
        tags: ["Games"],
        parameters: [
          { name: "slug", in: "path", required: true, schema: { type: "string" } },
          { name: "store", in: "query", schema: { type: "string" }, description: "Filter by store slug" },
        ],
        responses: {
          "200": { description: "Price history entries", content: { "application/json": { schema: { type: "object" } } } },
          "404": { description: "Game not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "429": { description: "Rate limit exceeded", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/deals": {
      get: {
        summary: "List deals sorted by deal score",
        tags: ["Deals"],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20, maximum: 100 } },
          { name: "store", in: "query", schema: { type: "string" }, description: "Comma-separated store slugs" },
          { name: "genre", in: "query", schema: { type: "string" }, description: "Comma-separated genre slugs" },
          { name: "platform", in: "query", schema: { type: "string" }, description: "Comma-separated platform slugs" },
          { name: "min_discount", in: "query", schema: { type: "number" }, description: "Minimum discount percentage" },
          { name: "max_price", in: "query", schema: { type: "number" }, description: "Maximum price" },
        ],
        responses: {
          "200": { description: "Paginated list of deals", content: { "application/json": { schema: { $ref: "#/components/schemas/EnvelopeResponse" } } } },
          "400": { description: "Invalid query parameters", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "429": { description: "Rate limit exceeded", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/deals/free": {
      get: {
        summary: "List currently free games",
        tags: ["Deals"],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20, maximum: 100 } },
        ],
        responses: {
          "200": { description: "Paginated list of free games", content: { "application/json": { schema: { $ref: "#/components/schemas/EnvelopeResponse" } } } },
          "400": { description: "Invalid query parameters", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "429": { description: "Rate limit exceeded", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/deals/all-time-lows": {
      get: {
        summary: "List games at their all-time lowest price",
        tags: ["Deals"],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20, maximum: 100 } },
        ],
        responses: {
          "200": { description: "Paginated list of all-time low deals", content: { "application/json": { schema: { $ref: "#/components/schemas/EnvelopeResponse" } } } },
          "400": { description: "Invalid query parameters", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "429": { description: "Rate limit exceeded", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/deals/rankings": {
      get: {
        summary: "Get deal score rankings",
        tags: ["Deals"],
        parameters: [
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
          { name: "offset", in: "query", schema: { type: "integer", default: 0 } },
        ],
        responses: {
          "200": { description: "List of deal score rankings", content: { "application/json": { schema: { type: "array", items: { type: "object" } } } } },
          "429": { description: "Rate limit exceeded", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/deals/{storeListingId}/stats": {
      get: {
        summary: "Get stats for a store listing",
        tags: ["Deals"],
        parameters: [
          { name: "storeListingId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        responses: {
          "200": { description: "Store listing stats", content: { "application/json": { schema: { type: "object" } } } },
          "404": { description: "Store listing not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "429": { description: "Rate limit exceeded", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/stores": {
      get: {
        summary: "List all supported stores",
        tags: ["Stores"],
        responses: {
          "200": { description: "List of stores", content: { "application/json": { schema: { $ref: "#/components/schemas/EnvelopeResponse" } } } },
          "429": { description: "Rate limit exceeded", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
  },
  components: {
    schemas: {
      EnvelopeResponse: {
        type: "object",
        properties: {
          data: { type: "array", items: { type: "object" } },
          meta: {
            type: "object",
            properties: {
              total: { type: "integer" },
              page: { type: "integer" },
              limit: { type: "integer" },
              hasNext: { type: "boolean" },
            },
          },
        },
      },
      Error: {
        type: "object",
        properties: {
          error: { type: "string" },
        },
      },
    },
  },
};

const openApiApp = new Hono();

openApiApp.get("/openapi.json", (c) => c.json(spec));

export { openApiApp };
