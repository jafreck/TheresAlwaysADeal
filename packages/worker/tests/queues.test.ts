import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("bullmq", () => {
  const Queue = vi.fn().mockImplementation((name: string) => ({ name }));
  const QueueEvents = vi.fn().mockImplementation((name: string) => ({ name }));
  return { Queue, QueueEvents };
});

import { Queue, QueueEvents } from "bullmq";

describe("queues", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
  });

  describe("QueueEvents instances", () => {
    it("should create scrapeQueueEvents for 'scrape'", async () => {
      await import("../src/queues.js");
      const call = vi.mocked(QueueEvents).mock.calls.find(([name]) => name === "scrape");
      expect(call).toBeDefined();
    });

    it("should create ingestQueueEvents for 'ingest'", async () => {
      await import("../src/queues.js");
      const call = vi.mocked(QueueEvents).mock.calls.find(([name]) => name === "ingest");
      expect(call).toBeDefined();
    });

    it("should create priceDropQueueEvents for 'price-drop'", async () => {
      await import("../src/queues.js");
      const call = vi.mocked(QueueEvents).mock.calls.find(([name]) => name === "price-drop");
      expect(call).toBeDefined();
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
  });
});
