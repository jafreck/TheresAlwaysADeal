import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { buildReferralUrl } from "../src/referral.js";

describe("buildReferralUrl", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    // Restore env vars after each test
    for (const key of ["STEAM_AFFILIATE_TAG", "GOG_AFFILIATE_ID", "EPIC_CREATOR_TAG", "HUMBLE_PARTNER_ID", "FANATICAL_REF"]) {
      if (originalEnv[key] !== undefined) {
        process.env[key] = originalEnv[key];
      } else {
        delete process.env[key];
      }
    }
  });

  describe("Steam", () => {
    it("appends partner param when STEAM_AFFILIATE_TAG is set", () => {
      process.env.STEAM_AFFILIATE_TAG = "mytag";
      const result = buildReferralUrl("https://store.steampowered.com/app/220", "steam");
      expect(result).toBe("https://store.steampowered.com/app/220?partner=mytag");
    });

    it("returns URL unchanged when STEAM_AFFILIATE_TAG is not set", () => {
      delete process.env.STEAM_AFFILIATE_TAG;
      const url = "https://store.steampowered.com/app/220";
      expect(buildReferralUrl(url, "steam")).toBe(url);
    });
  });

  describe("GOG", () => {
    it("appends affiliate_id param when GOG_AFFILIATE_ID is set", () => {
      process.env.GOG_AFFILIATE_ID = "gog123";
      const result = buildReferralUrl("https://www.gog.com/game/witcher", "gog");
      expect(result).toBe("https://www.gog.com/game/witcher?affiliate_id=gog123");
    });

    it("returns URL unchanged when GOG_AFFILIATE_ID is not set", () => {
      delete process.env.GOG_AFFILIATE_ID;
      const url = "https://www.gog.com/game/witcher";
      expect(buildReferralUrl(url, "gog")).toBe(url);
    });
  });

  describe("Epic Games", () => {
    it("appends epic_creator_id param when EPIC_CREATOR_TAG is set", () => {
      process.env.EPIC_CREATOR_TAG = "epiccreator";
      const result = buildReferralUrl("https://store.epicgames.com/en-US/p/fortnite", "epic");
      expect(result).toBe("https://store.epicgames.com/en-US/p/fortnite?epic_creator_id=epiccreator");
    });

    it("returns URL unchanged when EPIC_CREATOR_TAG is not set", () => {
      delete process.env.EPIC_CREATOR_TAG;
      const url = "https://store.epicgames.com/en-US/p/fortnite";
      expect(buildReferralUrl(url, "epic")).toBe(url);
    });
  });

  describe("Epic Games (epic-games slug)", () => {
    it("appends epic_creator_id param when EPIC_CREATOR_TAG is set", () => {
      process.env.EPIC_CREATOR_TAG = "epiccreator";
      const result = buildReferralUrl("https://store.epicgames.com/en-US/p/fortnite", "epic-games");
      expect(result).toBe("https://store.epicgames.com/en-US/p/fortnite?epic_creator_id=epiccreator");
    });

    it("returns URL unchanged when EPIC_CREATOR_TAG is not set", () => {
      delete process.env.EPIC_CREATOR_TAG;
      const url = "https://store.epicgames.com/en-US/p/fortnite";
      expect(buildReferralUrl(url, "epic-games")).toBe(url);
    });
  });

  describe("Humble Bundle", () => {
    it("appends partner param when HUMBLE_PARTNER_ID is set", () => {
      process.env.HUMBLE_PARTNER_ID = "humblepartner";
      const result = buildReferralUrl("https://www.humblebundle.com/store/game", "humble");
      expect(result).toBe("https://www.humblebundle.com/store/game?partner=humblepartner");
    });

    it("returns URL unchanged when HUMBLE_PARTNER_ID is not set", () => {
      delete process.env.HUMBLE_PARTNER_ID;
      const url = "https://www.humblebundle.com/store/game";
      expect(buildReferralUrl(url, "humble")).toBe(url);
    });

    it("appends partner param when using 'humble-bundle' slug", () => {
      process.env.HUMBLE_PARTNER_ID = "humblepartner";
      const result = buildReferralUrl("https://www.humblebundle.com/store/game", "humble-bundle");
      expect(result).toBe("https://www.humblebundle.com/store/game?partner=humblepartner");
    });

    it("returns URL unchanged when HUMBLE_PARTNER_ID is not set and slug is 'humble-bundle'", () => {
      delete process.env.HUMBLE_PARTNER_ID;
      const url = "https://www.humblebundle.com/store/game";
      expect(buildReferralUrl(url, "humble-bundle")).toBe(url);
    });
  });

  describe("Fanatical", () => {
    it("appends ref param when FANATICAL_REF is set", () => {
      process.env.FANATICAL_REF = "myref";
      const result = buildReferralUrl("https://www.fanatical.com/en/game/some-game", "fanatical");
      expect(result).toBe("https://www.fanatical.com/en/game/some-game?ref=myref");
    });

    it("returns URL unchanged when FANATICAL_REF is not set", () => {
      delete process.env.FANATICAL_REF;
      const url = "https://www.fanatical.com/en/game/some-game";
      expect(buildReferralUrl(url, "fanatical")).toBe(url);
    });
  });

  describe("Unknown store", () => {
    it("returns URL unchanged for unknown store slug", () => {
      const url = "https://example.com/game";
      expect(buildReferralUrl(url, "unknown-store")).toBe(url);
    });
  });
});
