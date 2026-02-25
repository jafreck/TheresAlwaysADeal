import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockEnd = vi.fn().mockResolvedValue(undefined);
const mockClient = { end: mockEnd };

vi.mock("postgres", () => ({
  default: vi.fn(() => mockClient),
}));

const mockReturning = vi.fn().mockResolvedValue([]);
const mockOnConflictDoNothing = vi
  .fn()
  .mockReturnValue({ returning: mockReturning });
const mockValues = vi
  .fn()
  .mockReturnValue({ onConflictDoNothing: mockOnConflictDoNothing });
const mockInsert = vi.fn().mockReturnValue({ values: mockValues });

const mockStores = [
  { id: "s1", slug: "steam", name: "Steam" },
  { id: "s2", slug: "epic-games", name: "Epic Games" },
  { id: "s3", slug: "gog", name: "GOG" },
];

const mockGames = [
  { id: "g1", slug: "the-witcher-3-wild-hunt", steamAppId: 292030 },
  { id: "g2", slug: "cyberpunk-2077", steamAppId: 1091500 },
  { id: "g3", slug: "hades", steamAppId: 1145360 },
  { id: "g4", slug: "deep-rock-galactic", steamAppId: 548430 },
  { id: "g5", slug: "hollow-knight", steamAppId: 367520 },
];

const mockStoresFindMany = vi.fn().mockResolvedValue(mockStores);
const mockGamesFindMany = vi.fn().mockResolvedValue(mockGames);

const mockDb = {
  insert: mockInsert,
  query: {
    stores: { findMany: mockStoresFindMany },
    games: { findMany: mockGamesFindMany },
  },
};

vi.mock("drizzle-orm/postgres-js", () => ({
  drizzle: vi.fn(() => mockDb),
}));

describe("seed", () => {
  const originalEnv = process.env.DATABASE_URL;

  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    // Restore mock implementations cleared by clearAllMocks
    mockReturning.mockResolvedValue([]);
    mockOnConflictDoNothing.mockReturnValue({ returning: mockReturning });
    mockValues.mockReturnValue({ onConflictDoNothing: mockOnConflictDoNothing });
    mockInsert.mockReturnValue({ values: mockValues });
    mockStoresFindMany.mockResolvedValue(mockStores);
    mockGamesFindMany.mockResolvedValue(mockGames);
    mockEnd.mockResolvedValue(undefined);

    if (originalEnv === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = originalEnv;
    }
  });

  describe("DATABASE_URL validation", () => {
    it("should throw when DATABASE_URL is not set", async () => {
      delete process.env.DATABASE_URL;
      await expect(import("../src/seed.js")).rejects.toThrow(
        "DATABASE_URL environment variable is required",
      );
    });

    it("should throw when DATABASE_URL is an empty string", async () => {
      process.env.DATABASE_URL = "";
      await expect(import("../src/seed.js")).rejects.toThrow(
        "DATABASE_URL environment variable is required",
      );
    });
  });

  describe("seed execution", () => {
    beforeEach(() => {
      process.env.DATABASE_URL = "postgres://user:pass@localhost:5432/testdb";
    });

    it("should call client.end() after seeding completes", async () => {
      await import("../src/seed.js");
      await vi.waitFor(() => expect(mockEnd).toHaveBeenCalledTimes(1), {
        timeout: 5000,
      });
    });

    it("should log success message on completion", async () => {
      const consoleSpy = vi
        .spyOn(console, "log")
        .mockImplementation(() => {});
      await import("../src/seed.js");
      await vi.waitFor(() => expect(mockEnd).toHaveBeenCalled(), {
        timeout: 5000,
      });
      expect(consoleSpy).toHaveBeenCalledWith("Seed completed successfully.");
      consoleSpy.mockRestore();
    });

    it("should insert stores", async () => {
      await import("../src/seed.js");
      await vi.waitFor(() => expect(mockEnd).toHaveBeenCalled(), {
        timeout: 5000,
      });
      // First insert call is for stores
      expect(mockInsert).toHaveBeenCalled();
      const storesValuesArg = mockValues.mock.calls[0][0] as Array<{
        name: string;
        slug: string;
      }>;
      expect(storesValuesArg).toHaveLength(5);
      expect(storesValuesArg.map((s) => s.slug)).toEqual(
        expect.arrayContaining(["steam", "epic-games", "gog", "humble-bundle", "fanatical"]),
      );
    });

    it("should insert games", async () => {
      await import("../src/seed.js");
      await vi.waitFor(() => expect(mockEnd).toHaveBeenCalled(), {
        timeout: 5000,
      });
      // Second insert call is for games
      const gamesValuesArg = mockValues.mock.calls[1][0] as Array<{
        slug: string;
      }>;
      expect(gamesValuesArg).toHaveLength(5);
      expect(gamesValuesArg.map((g) => g.slug)).toEqual(
        expect.arrayContaining([
          "the-witcher-3-wild-hunt",
          "cyberpunk-2077",
          "hades",
          "deep-rock-galactic",
          "hollow-knight",
        ]),
      );
    });

    it("should insert store listings linking games to stores", async () => {
      await import("../src/seed.js");
      await vi.waitFor(() => expect(mockEnd).toHaveBeenCalled(), {
        timeout: 5000,
      });
      // Third insert call is for store_listings
      const listingsValuesArg = mockValues.mock.calls[2][0] as Array<{
        gameId: string;
        storeId: string;
      }>;
      // 5 Steam + 2 Epic + 2 GOG = 9 listings
      expect(listingsValuesArg).toHaveLength(9);
    });

    it("should use onConflictDoNothing for idempotency", async () => {
      await import("../src/seed.js");
      await vi.waitFor(() => expect(mockEnd).toHaveBeenCalled(), {
        timeout: 5000,
      });
      // All 3 inserts use onConflictDoNothing
      expect(mockOnConflictDoNothing).toHaveBeenCalledTimes(3);
    });

    it("should query stores after inserting to get IDs", async () => {
      await import("../src/seed.js");
      await vi.waitFor(() => expect(mockEnd).toHaveBeenCalled(), {
        timeout: 5000,
      });
      expect(mockStoresFindMany).toHaveBeenCalledTimes(1);
    });

    it("should query games after inserting to get IDs", async () => {
      await import("../src/seed.js");
      await vi.waitFor(() => expect(mockEnd).toHaveBeenCalled(), {
        timeout: 5000,
      });
      expect(mockGamesFindMany).toHaveBeenCalledTimes(1);
    });

    it("should log error and exit with code 1 when seed fails", async () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const processExitSpy = vi
        .spyOn(process, "exit")
        .mockImplementation((() => {}) as never);

      // Make stores findMany fail
      mockStoresFindMany.mockRejectedValueOnce(new Error("DB connection error"));

      await import("../src/seed.js");
      await vi.waitFor(() => expect(consoleErrorSpy).toHaveBeenCalled(), {
        timeout: 5000,
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Seed failed:",
        expect.any(Error),
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);

      consoleErrorSpy.mockRestore();
      processExitSpy.mockRestore();
    });
  });
});
