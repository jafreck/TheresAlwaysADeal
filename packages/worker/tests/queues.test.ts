import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("bullmq", () => {
  const Queue = vi.fn().mockImplementation(function (name: string) { return { name }; });
  const QueueEvents = vi.fn().mockImplementation(function (name: string) { return { name }; });
  return { Queue, QueueEvents };
});

import { Queue, QueueEvents } from "bullmq";

describe("queues", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe("Queue instances", () => {
    it("should create scrapeQueue with name 'scrape'", async () => {
      const { scrapeQueue } = await import("../src/queues.js");
      expect(scrapeQueue).toBeDefined();
      // Queue constructor was called with "scrape" at module load time
      const scrapeCall = vi.mocked(Queue).mock.calls.find(([name]) => name === "scrape");
      expect(scrapeCall).toBeDefined();
    });

    it("should create ingestQueue with name 'ingest'", async () => {
      await import("../src/queues.js");
      const ingestCall = vi.mocked(Queue).mock.calls.find(([name]) => name === "ingest");
      expect(ingestCall).toBeDefined();
    });

    it("should create priceDropQueue with name 'price-drop'", async () => {
      await import("../src/queues.js");
      const priceDropCall = vi.mocked(Queue).mock.calls.find(([name]) => name === "price-drop");
      expect(priceDropCall).toBeDefined();
    });

    it("should create allTimeLowQueue with name 'all-time-low'", async () => {
      await import("../src/queues.js");
      const allTimeLowCall = vi.mocked(Queue).mock.calls.find(([name]) => name === "all-time-low");
      expect(allTimeLowCall).toBeDefined();
    });

    it("should create featuredScrapeQueue with name 'featured-scrape'", async () => {
      await import("../src/queues.js");
      const featuredCall = vi.mocked(Queue).mock.calls.find(([name]) => name === "featured-scrape");
      expect(featuredCall).toBeDefined();
    });

    it("should create steamSyncQueue with name 'steam-sync'", async () => {
      await import("../src/queues.js");
      const steamSyncCall = vi.mocked(Queue).mock.calls.find(([name]) => name === "steam-sync");
      expect(steamSyncCall).toBeDefined();
    });

    it("should create emailQueue with name 'email'", async () => {
      const { emailQueue } = await import("../src/queues.js");
      expect(emailQueue).toBeDefined();
      const emailCall = vi.mocked(Queue).mock.calls.find(([name]) => name === "email");
      expect(emailCall).toBeDefined();
    });
  });

  describe("exports", () => {
    it("should export scrapeQueue, ingestQueue, priceDropQueue", async () => {
      const { scrapeQueue, ingestQueue, priceDropQueue } = await import("../src/queues.js");
      expect(scrapeQueue).toBeDefined();
      expect(ingestQueue).toBeDefined();
      expect(priceDropQueue).toBeDefined();
    });

    it("should export scrapeQueueEvents, ingestQueueEvents, priceDropQueueEvents", async () => {
      const { scrapeQueueEvents, ingestQueueEvents, priceDropQueueEvents } = await import("../src/queues.js");
      expect(scrapeQueueEvents).toBeDefined();
      expect(ingestQueueEvents).toBeDefined();
      expect(priceDropQueueEvents).toBeDefined();
    });

    it("should export allTimeLowQueue and allTimeLowQueueEvents", async () => {
      const { allTimeLowQueue, allTimeLowQueueEvents } = await import("../src/queues.js");
      expect(allTimeLowQueue).toBeDefined();
      expect(allTimeLowQueueEvents).toBeDefined();
    });

    it("should export featuredScrapeQueue", async () => {
      const { featuredScrapeQueue } = await import("../src/queues.js");
      expect(featuredScrapeQueue).toBeDefined();
    });

    it("should export steamSyncQueue and steamSyncQueueEvents", async () => {
      const { steamSyncQueue, steamSyncQueueEvents } = await import("../src/queues.js");
      expect(steamSyncQueue).toBeDefined();
      expect(steamSyncQueueEvents).toBeDefined();
    });

    it("should export emailQueue and emailQueueEvents", async () => {
      const { emailQueue, emailQueueEvents } = await import("../src/queues.js");
      expect(emailQueue).toBeDefined();
      expect(emailQueueEvents).toBeDefined();
    });
  });
});
