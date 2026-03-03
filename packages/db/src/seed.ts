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
      { name: "Steam", slug: "steam", baseUrl: "https://store.steampowered.com", referralParam: "partner=taad" },
      { name: "Epic Games", slug: "epic-games", baseUrl: "https://store.epicgames.com", referralParam: "epic_creator_id=taad" },
      { name: "GOG", slug: "gog", baseUrl: "https://www.gog.com", referralParam: "af=taad" },
      { name: "Humble Bundle", slug: "humble-bundle", baseUrl: "https://www.humblebundle.com", referralParam: "partner=taad" },
      { name: "Fanatical", slug: "fanatical", baseUrl: "https://www.fanatical.com", referralParam: "ref=taad" },
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

  // Insert genres
  await db
    .insert(schema.genres)
    .values([
      { name: "RPG", slug: "rpg" },
      { name: "Action", slug: "action" },
      { name: "Adventure", slug: "adventure" },
      { name: "Roguelike", slug: "roguelike" },
      { name: "Metroidvania", slug: "metroidvania" },
      { name: "Co-op", slug: "co-op" },
    ])
    .onConflictDoNothing()
    .returning();

  // Insert platforms
  await db
    .insert(schema.platforms)
    .values([
      { name: "PC", slug: "pc" },
      { name: "PlayStation", slug: "playstation" },
      { name: "Xbox", slug: "xbox" },
      { name: "Nintendo Switch", slug: "nintendo-switch" },
    ])
    .onConflictDoNothing()
    .returning();

  // Fetch inserted records to get IDs
  const insertedGenres = await db.query.genres.findMany();
  const insertedPlatforms = await db.query.platforms.findMany();

  const rpg = insertedGenres.find((g) => g.slug === "rpg")!;
  const action = insertedGenres.find((g) => g.slug === "action")!;
  const adventure = insertedGenres.find((g) => g.slug === "adventure")!;
  const roguelike = insertedGenres.find((g) => g.slug === "roguelike")!;
  const metroidvania = insertedGenres.find((g) => g.slug === "metroidvania")!;
  const coop = insertedGenres.find((g) => g.slug === "co-op")!;

  const pc = insertedPlatforms.find((p) => p.slug === "pc")!;
  const playstation = insertedPlatforms.find((p) => p.slug === "playstation")!;
  const xbox = insertedPlatforms.find((p) => p.slug === "xbox")!;
  const nintendoSwitch = insertedPlatforms.find((p) => p.slug === "nintendo-switch")!;

  const witcher = insertedGames.find((g) => g.slug === "the-witcher-3-wild-hunt")!;
  const cyberpunk = insertedGames.find((g) => g.slug === "cyberpunk-2077")!;
  const hades = insertedGames.find((g) => g.slug === "hades")!;
  const deepRock = insertedGames.find((g) => g.slug === "deep-rock-galactic")!;
  const hollowKnight = insertedGames.find((g) => g.slug === "hollow-knight")!;

  // Associate games with genres
  await db
    .insert(schema.gameGenres)
    .values([
      { gameId: witcher.id, genreId: rpg.id },
      { gameId: witcher.id, genreId: adventure.id },
      { gameId: cyberpunk.id, genreId: rpg.id },
      { gameId: cyberpunk.id, genreId: action.id },
      { gameId: hades.id, genreId: roguelike.id },
      { gameId: hades.id, genreId: action.id },
      { gameId: deepRock.id, genreId: action.id },
      { gameId: deepRock.id, genreId: coop.id },
      { gameId: hollowKnight.id, genreId: metroidvania.id },
      { gameId: hollowKnight.id, genreId: adventure.id },
    ])
    .onConflictDoNothing()
    .returning();

  // Associate games with platforms
  await db
    .insert(schema.gamePlatforms)
    .values([
      { gameId: witcher.id, platformId: pc.id },
      { gameId: witcher.id, platformId: playstation.id },
      { gameId: witcher.id, platformId: xbox.id },
      { gameId: witcher.id, platformId: nintendoSwitch.id },
      { gameId: cyberpunk.id, platformId: pc.id },
      { gameId: cyberpunk.id, platformId: playstation.id },
      { gameId: cyberpunk.id, platformId: xbox.id },
      { gameId: hades.id, platformId: pc.id },
      { gameId: hades.id, platformId: playstation.id },
      { gameId: hades.id, platformId: xbox.id },
      { gameId: hades.id, platformId: nintendoSwitch.id },
      { gameId: deepRock.id, platformId: pc.id },
      { gameId: deepRock.id, platformId: playstation.id },
      { gameId: deepRock.id, platformId: xbox.id },
      { gameId: hollowKnight.id, platformId: pc.id },
      { gameId: hollowKnight.id, platformId: playstation.id },
      { gameId: hollowKnight.id, platformId: xbox.id },
      { gameId: hollowKnight.id, platformId: nintendoSwitch.id },
    ])
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
