import { describe, it, expect } from "vitest";
import { getTableName } from "drizzle-orm";
import {
  games,
  stores,
  storeListings,
  priceHistory,
  users,
  wishlists,
  priceAlerts,
  alertNotifications,
} from "../src/schema.js";

describe("schema", () => {
  describe("games", () => {
    it("should export the games table", () => {
      expect(games).toBeDefined();
    });

    it("should have the correct columns", () => {
      const columns = Object.keys(games);
      expect(columns).toContain("id");
      expect(columns).toContain("title");
      expect(columns).toContain("slug");
      expect(columns).toContain("description");
      expect(columns).toContain("headerImageUrl");
      expect(columns).toContain("steamAppId");
      expect(columns).toContain("createdAt");
      expect(columns).toContain("updatedAt");
    });

    it("should have the correct table name", () => {
      expect(getTableName(games)).toBe("games");
    });
  });

  describe("stores", () => {
    it("should export the stores table", () => {
      expect(stores).toBeDefined();
    });

    it("should have the correct columns", () => {
      const columns = Object.keys(stores);
      expect(columns).toContain("id");
      expect(columns).toContain("name");
      expect(columns).toContain("slug");
      expect(columns).toContain("logoUrl");
      expect(columns).toContain("baseUrl");
      expect(columns).toContain("createdAt");
    });

    it("should have the correct table name", () => {
      expect(getTableName(stores)).toBe("stores");
    });
  });

  describe("storeListings", () => {
    it("should export the storeListings table", () => {
      expect(storeListings).toBeDefined();
    });

    it("should have the correct columns", () => {
      const columns = Object.keys(storeListings);
      expect(columns).toContain("id");
      expect(columns).toContain("gameId");
      expect(columns).toContain("storeId");
      expect(columns).toContain("storeUrl");
      expect(columns).toContain("storeGameId");
      expect(columns).toContain("isActive");
      expect(columns).toContain("createdAt");
      expect(columns).toContain("updatedAt");
    });

    it("should have the correct table name", () => {
      expect(getTableName(storeListings)).toBe("store_listings");
    });
  });

  describe("priceHistory", () => {
    it("should export the priceHistory table", () => {
      expect(priceHistory).toBeDefined();
    });

    it("should have the correct columns", () => {
      const columns = Object.keys(priceHistory);
      expect(columns).toContain("id");
      expect(columns).toContain("storeListingId");
      expect(columns).toContain("price");
      expect(columns).toContain("originalPrice");
      expect(columns).toContain("currency");
      expect(columns).toContain("discount");
      expect(columns).toContain("recordedAt");
    });

    it("should have the correct table name", () => {
      expect(getTableName(priceHistory)).toBe("price_history");
    });
  });

  describe("users", () => {
    it("should export the users table", () => {
      expect(users).toBeDefined();
    });

    it("should have the correct columns", () => {
      const columns = Object.keys(users);
      expect(columns).toContain("id");
      expect(columns).toContain("email");
      expect(columns).toContain("name");
      expect(columns).toContain("steamId");
      expect(columns).toContain("steamAccessToken");
      expect(columns).toContain("createdAt");
      expect(columns).toContain("updatedAt");
    });

    it("should have the correct table name", () => {
      expect(getTableName(users)).toBe("users");
    });
  });

  describe("wishlists", () => {
    it("should export the wishlists table", () => {
      expect(wishlists).toBeDefined();
    });

    it("should have the correct columns", () => {
      const columns = Object.keys(wishlists);
      expect(columns).toContain("id");
      expect(columns).toContain("userId");
      expect(columns).toContain("gameId");
      expect(columns).toContain("createdAt");
    });

    it("should have the correct table name", () => {
      expect(getTableName(wishlists)).toBe("wishlists");
    });
  });

  describe("priceAlerts", () => {
    it("should export the priceAlerts table", () => {
      expect(priceAlerts).toBeDefined();
    });

    it("should have the correct columns", () => {
      const columns = Object.keys(priceAlerts);
      expect(columns).toContain("id");
      expect(columns).toContain("userId");
      expect(columns).toContain("gameId");
      expect(columns).toContain("targetPrice");
      expect(columns).toContain("isActive");
      expect(columns).toContain("createdAt");
      expect(columns).toContain("updatedAt");
    });

    it("should have the correct table name", () => {
      expect(getTableName(priceAlerts)).toBe("price_alerts");
    });
  });

  describe("alertNotifications", () => {
    it("should export the alertNotifications table", () => {
      expect(alertNotifications).toBeDefined();
    });

    it("should have the correct columns", () => {
      const columns = Object.keys(alertNotifications);
      expect(columns).toContain("id");
      expect(columns).toContain("alertId");
      expect(columns).toContain("storeListingId");
      expect(columns).toContain("triggeredPrice");
      expect(columns).toContain("sentAt");
    });

    it("should have the correct table name", () => {
      expect(getTableName(alertNotifications)).toBe("alert_notifications");
    });
  });

  describe("old schema exports removed", () => {
    it("should not export retailers", async () => {
      const schema = await import("../src/schema.js");
      expect((schema as any).retailers).toBeUndefined();
    });

    it("should not export categories", async () => {
      const schema = await import("../src/schema.js");
      expect((schema as any).categories).toBeUndefined();
    });

    it("should not export deals", async () => {
      const schema = await import("../src/schema.js");
      expect((schema as any).deals).toBeUndefined();
    });

    it("should not export dealStatusEnum", async () => {
      const schema = await import("../src/schema.js");
      expect((schema as any).dealStatusEnum).toBeUndefined();
    });
  });
});
