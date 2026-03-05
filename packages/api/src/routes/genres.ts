import { Hono } from "hono";
import { db, genres } from "@taad/db";

const app = new Hono();

// GET / — list all genres
app.get("/", async (c) => {
  const rows = await db
    .select({
      id: genres.id,
      name: genres.name,
      slug: genres.slug,
    })
    .from(genres);

  return c.json({ data: rows });
});

export { app as genresApp };
