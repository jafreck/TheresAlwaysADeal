import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema.js";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

const client = postgres(process.env.DATABASE_URL);
const db = drizzle(client, { schema });

async function seed() {
  // Insert stores
  await db
    .insert(schema.stores)
    .values([
      { name: "Steam", slug: "steam", baseUrl: "https://store.steampowered.com" },
      { name: "Epic Games", slug: "epic-games", baseUrl: "https://store.epicgames.com" },
      { name: "GOG", slug: "gog", baseUrl: "https://www.gog.com" },
    ])
    .onConflictDoNothing()
    .returning();

  // Insert games
  await db
    .insert(schema.games)
    .values([
      { title: "The Witcher 3: Wild Hunt", slug: "the-witcher-3-wild-hunt", steamAppId: 292030 },
      { title: "Cyberpunk 2077", slug: "cyberpunk-2077", steamAppId: 1091500 },
      { title: "Hades", slug: "hades", steamAppId: 1145360 },
      { title: "Deep Rock Galactic", slug: "deep-rock-galactic", steamAppId: 548430 },
      { title: "Hollow Knight", slug: "hollow-knight", steamAppId: 367520 },
    ])
    .onConflictDoNothing()
    .returning();

  // Fetch inserted records to get IDs
  const insertedStores = await db.query.stores.findMany();
  const insertedGames = await db.query.games.findMany();

  const steam = insertedStores.find((s) => s.slug === "steam")!;
  const epic = insertedStores.find((s) => s.slug === "epic-games")!;
  const gog = insertedStores.find((s) => s.slug === "gog")!;

  // Build store listings: 5 Steam + 2 Epic + 2 GOG = 9 total
  const listings = [
    // Steam — all 5 games
    ...insertedGames.map((g) => ({
      gameId: g.id,
      storeId: steam.id,
      storeUrl: `https://store.steampowered.com/app/${g.steamAppId}`,
      storeGameId: String(g.steamAppId),
    })),
    // Epic — first 2 games
    ...insertedGames.slice(0, 2).map((g) => ({
      gameId: g.id,
      storeId: epic.id,
      storeUrl: `https://store.epicgames.com/p/${g.slug}`,
      storeGameId: g.slug,
    })),
    // GOG — first 2 games
    ...insertedGames.slice(0, 2).map((g) => ({
      gameId: g.id,
      storeId: gog.id,
      storeUrl: `https://www.gog.com/game/${g.slug}`,
      storeGameId: g.slug,
    })),
  ];

  await db
    .insert(schema.storeListings)
    .values(listings)
    .onConflictDoNothing()
    .returning();

  console.log("Seed completed successfully.");
}

seed()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(() => client.end());
