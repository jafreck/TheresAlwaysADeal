import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { db, users } from "@taad/db";
import { authMiddleware } from "../middleware/auth.js";
import { steamCallbackSchema } from "../lib/validation.js";

const STEAM_OPENID_URL = "https://steamcommunity.com/openid/login";

type Env = { Variables: { user: { sub: string } } };

export function createSteamApp() {
  const app = new Hono<Env>();

  // Both endpoints require authentication
  app.use("*", authMiddleware);

  // GET /steam — redirect to Steam OpenID login
  app.get("/", (c) => {
    const realm = process.env.STEAM_OPENID_REALM ?? "http://localhost:3001";
    const returnTo =
      process.env.STEAM_OPENID_RETURN_URL ??
      `${realm}/api/v1/auth/steam/callback`;

    const params = new URLSearchParams({
      "openid.ns": "http://specs.openid.net/auth/2.0",
      "openid.mode": "checkid_setup",
      "openid.return_to": returnTo,
      "openid.realm": realm,
      "openid.identity":
        "http://specs.openid.net/auth/2.0/identifier_select",
      "openid.claimed_id":
        "http://specs.openid.net/auth/2.0/identifier_select",
    });

    return c.redirect(`${STEAM_OPENID_URL}?${params.toString()}`);
  });

  // GET /steam/callback — validate OpenID assertion and link Steam account
  app.get("/callback", async (c) => {
    const query = c.req.query();

    const parsed = steamCallbackSchema.safeParse(query);
    if (!parsed.success) {
      return c.json(
        { error: "Missing required OpenID parameters" },
        400,
      );
    }

    // Build verification request to Steam
    const verifyParams = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      verifyParams.set(key, value);
    }
    verifyParams.set("openid.mode", "check_authentication");

    const verifyRes = await fetch(STEAM_OPENID_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: verifyParams.toString(),
    });

    const verifyBody = await verifyRes.text();

    if (!verifyBody.includes("is_valid:true")) {
      return c.json({ error: "Steam OpenID validation failed" }, 400);
    }

    // Extract Steam ID from claimed_id
    const claimedId = query["openid.claimed_id"] ?? "";
    const steamIdMatch = claimedId.match(
      /^https:\/\/steamcommunity\.com\/openid\/id\/(\d+)$/,
    );

    if (!steamIdMatch || !steamIdMatch[1]) {
      return c.json({ error: "Invalid Steam claimed_id" }, 400);
    }

    const steamId = steamIdMatch[1];

    // Update user's steamId
    const user = c.get("user");
    await db
      .update(users)
      .set({ steamId })
      .where(eq(users.id, user.sub));

    return c.json({ message: "Steam account linked", steamId }, 200);
  });

  return app;
}
