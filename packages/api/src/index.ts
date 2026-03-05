import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { swaggerUI } from "@hono/swagger-ui";
import { Redis, type Redis as RedisClient } from "ioredis";
import { rateLimiter } from "./middleware/rate-limit.js";
import { cacheMiddleware } from "./middleware/cache.js";
import { createGamesApp } from "./routes/games.js";
import { createDealsApp } from "./routes/deals.js";
import { storesApp } from "./routes/stores.js";
import { createAuthApp } from "./routes/auth.js";
import { createSteamApp } from "./routes/steam.js";
import { createUserApp } from "./routes/user.js";
import { alertsApp } from "./routes/alerts.js";
import { genresApp } from "./routes/genres.js";
import { openApiApp } from "./openapi.js";

const app = new Hono();

// Middleware
app.use("*", logger());
app.use(
  "*",
  cors({
    origin: process.env.FRONTEND_URL ?? "http://localhost:3000",
    credentials: true,
  }),
);

// Lazy Redis client — only created when REDIS_URL is present
let _redis: RedisClient | null = null;
function getRedis(): RedisClient | null {
  if (!process.env.REDIS_URL) return null;
  if (!_redis) _redis = new Redis(process.env.REDIS_URL);
  return _redis;
}

// Health check (outside versioned router)
app.get("/api/health", (c) => c.json({ status: "ok", timestamp: new Date().toISOString() }));

// Swagger UI
app.get("/api/docs", swaggerUI({ url: "/api/docs/openapi.json" }));

// OpenAPI spec
app.route("/api/docs", openApiApp);

// Versioned API router
const v1 = new Hono();

// Apply rate limiting to all v1 routes
v1.use("*", rateLimiter(getRedis));

// Mount games routes (caching applied per-route within createGamesApp)
v1.route("/games", createGamesApp(getRedis));

// Mount deals routes with 5 min cache
const dealsRouter = new Hono();
dealsRouter.use("*", cacheMiddleware(300, getRedis));
dealsRouter.route("/", createDealsApp(getRedis));
v1.route("/deals", dealsRouter);

// Mount stores routes
v1.route("/stores", storesApp);

// Mount auth routes
v1.route("/auth", createAuthApp(getRedis));

// Mount Steam auth routes under /auth/steam
v1.route("/auth/steam", createSteamApp());

// Mount user routes
v1.route("/user", createUserApp());

// Mount alerts routes (unsubscribe is public, no auth middleware)
v1.route("/alerts", alertsApp);

// Mount genres routes with 5-min cache
const genresRouter = new Hono();
genresRouter.use("*", cacheMiddleware(300, getRedis));
genresRouter.route("/", genresApp);
v1.route("/genres", genresRouter);

// Mount versioned router
app.route("/api/v1", v1);

export { app };

const port = Number(process.env.API_PORT ?? 3001);

console.log(`API server starting on port ${port}`);

serve({ fetch: app.fetch, port });
