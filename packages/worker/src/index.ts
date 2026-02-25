import { Worker } from "bullmq";
import { scrapeQueue } from "./queues.js";

const connection = { url: process.env.REDIS_URL! };

// ─── Scrape Worker ────────────────────────────────────────────────────────────
const scrapeWorker = new Worker(
  "scrape",
  async (job) => {
    console.log(`[scrape] Processing job ${job.id} for retailer: ${job.data.retailerDomain}`);
    // TODO: Dynamically import and run the matching scraper
    // const scraper = await loadScraper(job.data.retailerDomain);
    // const deals = await scraper.scrape();
    // await ingestQueue.add("ingest-deals", { deals, retailerDomain: job.data.retailerDomain });
  },
  { connection, concurrency: Number(process.env.SCRAPER_CONCURRENCY ?? 3) },
);

// ─── Ingest Worker ────────────────────────────────────────────────────────────
const ingestWorker = new Worker(
  "ingest",
  async (job) => {
    console.log(`[ingest] Processing ${job.data.deals?.length ?? 0} deals`);
    // TODO: Upsert deals into Postgres via @taad/db
  },
  { connection },
);

// ─── CRON: schedule scrape jobs ───────────────────────────────────────────────
// TODO: Read retailer list from DB and enqueue scrape jobs on a schedule
// await scrapeQueue.add("scrape-amazon", { retailerDomain: "amazon.com" }, {
//   repeat: { pattern: "0 */2 * * *" }, // every 2 hours
// });

console.log("Worker started — listening for jobs");

process.on("SIGTERM", async () => {
  await scrapeWorker.close();
  await ingestWorker.close();
  process.exit(0);
});
