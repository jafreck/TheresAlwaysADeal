import { Queue, QueueEvents } from "bullmq";

const connection = {
  url: process.env.REDIS_URL!,
};

// ─── Queue definitions ────────────────────────────────────────────────────────

/** Triggered per-retailer on a CRON schedule to kick off scraping. */
export const scrapeQueue = new Queue("scrape", { connection });

/** Receives raw scraped deals and upserts them into Postgres. */
export const ingestQueue = new Queue("ingest", { connection });

export const scrapeQueueEvents = new QueueEvents("scrape", { connection });
export const ingestQueueEvents = new QueueEvents("ingest", { connection });
