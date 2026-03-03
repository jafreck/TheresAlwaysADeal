import { Hono } from "hono";
import { db, stores } from "@taad/db";

const app = new Hono();

// GET / — list all supported stores
app.get("/", async (c) => {
  const rows = await db
    .select({
      id: stores.id,
      name: stores.name,
      slug: stores.slug,
      logoUrl: stores.logoUrl,
      baseUrl: stores.baseUrl,
    })
    .from(stores);

  return c.json({ data: rows });
});

export { app as storesApp };
