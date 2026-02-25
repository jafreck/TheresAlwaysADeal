import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

const app = new Hono();

// Middleware
app.use("*", logger());
app.use(
  "*",
  cors({
    origin: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000",
    credentials: true,
  }),
);

// Health check
app.get("/health", (c) => c.json({ status: "ok", timestamp: new Date().toISOString() }));

// Routes (to be expanded in future issues)
// app.route("/deals", dealsRouter);
// app.route("/categories", categoriesRouter);

const port = Number(process.env.API_PORT ?? 3001);

console.log(`API server starting on port ${port}`);

serve({ fetch: app.fetch, port });
