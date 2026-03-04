import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import { db, users, wishlists, games } from "@taad/db";
import { authMiddleware } from "../middleware/auth.js";
import { steamUnlinkSchema } from "../lib/validation.js";

type Env = { Variables: { user: { sub: string } } };

export function createUserApp() {
  const app = new Hono<Env>();

  // All endpoints require authentication
  app.use("*", authMiddleware);

  // DELETE /me/steam — unlink Steam account
  app.delete("/me/steam", async (c) => {
    const body = await c.req.json();
    const parsed = steamUnlinkSchema.safeParse(body);
    if (!parsed.success) {
      return c.json(
        { error: "Confirmation required: send { \"confirm\": true }" },
        400,
      );
    }

    const user = c.get("user");

    // Remove steam_sync wishlist rows
    await db
      .delete(wishlists)
      .where(
        and(eq(wishlists.userId, user.sub), eq(wishlists.source, "steam_sync")),
      );

    // Clear steamId
    await db
      .update(users)
      .set({ steamId: null })
      .where(eq(users.id, user.sub));

    return c.json({ message: "Steam account unlinked" }, 200);
  });

  // POST /me/steam/sync — manual Steam wishlist sync
  app.post("/me/steam/sync", async (c) => {
    const authUser = c.get("user");

    // Get user's steamId
    const [user] = await db
      .select({ steamId: users.steamId })
      .from(users)
      .where(eq(users.id, authUser.sub))
      .limit(1);

    if (!user?.steamId) {
      return c.json({ error: "No Steam account linked" }, 400);
    }

    // Fetch Steam wishlist
    const wishlistUrl = `https://store.steampowered.com/wishlist/profiles/${user.steamId}/wishlistdata/`;
    let wishlistData: Record<string, unknown>;

    try {
      const res = await fetch(wishlistUrl);
      if (!res.ok) {
        return c.json(
          {
            message: "Steam wishlist may be private or empty",
            synced: 0,
            private: true,
          },
          200,
        );
      }
      wishlistData = await res.json() as Record<string, unknown>;
    } catch {
      return c.json(
        {
          message: "Steam wishlist may be private or empty",
          synced: 0,
          private: true,
        },
        200,
      );
    }

    // Handle empty/private wishlist
    if (
      !wishlistData ||
      typeof wishlistData !== "object" ||
      Object.keys(wishlistData).length === 0
    ) {
      return c.json(
        {
          message: "Steam wishlist appears empty or private",
          synced: 0,
          private: true,
        },
        200,
      );
    }

    // Extract appids from wishlist (keys are the appIds in the Steam API)
    const appIds = Object.keys(wishlistData)
      .map(Number)
      .filter((id) => !isNaN(id) && id > 0);

    if (appIds.length === 0) {
      return c.json(
        { message: "No matching games found in Steam wishlist", synced: 0, private: false },
        200,
      );
    }

    // Match appids to games in our database
    let synced = 0;
    for (const appId of appIds) {
      const [game] = await db
        .select({ id: games.id })
        .from(games)
        .where(eq(games.steamAppId, appId))
        .limit(1);

      if (game) {
        // Check if wishlist entry already exists
        const [existing] = await db
          .select({ id: wishlists.id })
          .from(wishlists)
          .where(
            and(
              eq(wishlists.userId, authUser.sub),
              eq(wishlists.gameId, game.id),
              eq(wishlists.source, "steam_sync"),
            ),
          )
          .limit(1);

        if (!existing) {
          await db.insert(wishlists).values({
            userId: authUser.sub,
            gameId: game.id,
            source: "steam_sync",
          });
          synced++;
        }
      }
    }

    return c.json(
      { message: "Steam wishlist synced", synced, private: false },
      200,
    );
  });

  return app;
}
