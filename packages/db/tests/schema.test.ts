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
  storeListingStats,
  refreshTokens,
  passwordResetTokens,
  emailVerificationTokens,
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
      expect(columns).toContain("referralParam");
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
      expect(columns).toContain("description");
      expect(columns).toContain("isActive");
      expect(columns).toContain("isAllTimeLow");
      expect(columns).toContain("expiresAt");
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
      expect(columns).toContain("saleEndsAt");
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
      expect(columns).toContain("passwordHash");
      expect(columns).toContain("emailVerified");
      expect(columns).toContain("steamId");
      expect(columns).toContain("steamAccessToken");
      expect(columns).toContain("createdAt");
      expect(columns).toContain("updatedAt");
    });

    it("should have the correct table name", () => {
      expect(getTableName(users)).toBe("users");
    });

    it("should have passwordHash as nullable", () => {
      expect(users.passwordHash.notNull).toBe(false);
    });

    it("should have emailVerified as not null with default false", () => {
      expect(users.emailVerified.notNull).toBe(true);
      expect(users.emailVerified.hasDefault).toBe(true);
      expect(users.emailVerified.default).toBe(false);
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

  describe("storeListingStats", () => {
    it("should export the storeListingStats table", () => {
      expect(storeListingStats).toBeDefined();
    });

    it("should have the correct table name", () => {
      expect(getTableName(storeListingStats)).toBe("store_listing_stats");
    });

    it("should have the correct columns", () => {
      const columns = Object.keys(storeListingStats);
      expect(columns).toContain("id");
      expect(columns).toContain("storeListingId");
      expect(columns).toContain("allTimeLowPrice");
      expect(columns).toContain("allTimeLowDiscount");
      expect(columns).toContain("avg30DayPrice");
      expect(columns).toContain("avg90DayPrice");
      expect(columns).toContain("isAllTimeLow");
      expect(columns).toContain("allTimeLowLastSeenAt");
      expect(columns).toContain("dealScore");
      expect(columns).toContain("updatedAt");
    });
  });

  describe("refreshTokens", () => {
    it("should export the refreshTokens table", () => {
      expect(refreshTokens).toBeDefined();
    });

    it("should have the correct table name", () => {
      expect(getTableName(refreshTokens)).toBe("refresh_tokens");
    });

    it("should have the correct columns", () => {
      const columns = Object.keys(refreshTokens);
      expect(columns).toContain("id");
      expect(columns).toContain("userId");
      expect(columns).toContain("token");
      expect(columns).toContain("expiresAt");
      expect(columns).toContain("revokedAt");
      expect(columns).toContain("createdAt");
    });

    it("should have token as unique and not null", () => {
      expect(refreshTokens.token.isUnique).toBe(true);
      expect(refreshTokens.token.notNull).toBe(true);
    });

    it("should have userId as not null", () => {
      expect(refreshTokens.userId.notNull).toBe(true);
    });

    it("should have expiresAt as not null", () => {
      expect(refreshTokens.expiresAt.notNull).toBe(true);
    });

    it("should have revokedAt as nullable", () => {
      expect(refreshTokens.revokedAt.notNull).toBe(false);
    });
  });

  describe("passwordResetTokens", () => {
    it("should export the passwordResetTokens table", () => {
      expect(passwordResetTokens).toBeDefined();
    });

    it("should have the correct table name", () => {
      expect(getTableName(passwordResetTokens)).toBe("password_reset_tokens");
    });

    it("should have the correct columns", () => {
      const columns = Object.keys(passwordResetTokens);
      expect(columns).toContain("id");
      expect(columns).toContain("userId");
      expect(columns).toContain("token");
      expect(columns).toContain("expiresAt");
      expect(columns).toContain("usedAt");
      expect(columns).toContain("createdAt");
    });

    it("should have token as unique and not null", () => {
      expect(passwordResetTokens.token.isUnique).toBe(true);
      expect(passwordResetTokens.token.notNull).toBe(true);
    });

    it("should have usedAt as nullable", () => {
      expect(passwordResetTokens.usedAt.notNull).toBe(false);
    });

    it("should have userId as not null", () => {
      expect(passwordResetTokens.userId.notNull).toBe(true);
    });
  });

  describe("emailVerificationTokens", () => {
    it("should export the emailVerificationTokens table", () => {
      expect(emailVerificationTokens).toBeDefined();
    });

    it("should have the correct table name", () => {
      expect(getTableName(emailVerificationTokens)).toBe("email_verification_tokens");
    });

    it("should have the correct columns", () => {
      const columns = Object.keys(emailVerificationTokens);
      expect(columns).toContain("id");
      expect(columns).toContain("userId");
      expect(columns).toContain("token");
      expect(columns).toContain("expiresAt");
      expect(columns).toContain("usedAt");
      expect(columns).toContain("createdAt");
    });

    it("should have token as unique and not null", () => {
      expect(emailVerificationTokens.token.isUnique).toBe(true);
      expect(emailVerificationTokens.token.notNull).toBe(true);
    });

    it("should have usedAt as nullable", () => {
      expect(emailVerificationTokens.usedAt.notNull).toBe(false);
    });

    it("should have userId as not null", () => {
      expect(emailVerificationTokens.userId.notNull).toBe(true);
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
