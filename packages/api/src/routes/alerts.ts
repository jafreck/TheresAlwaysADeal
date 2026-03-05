import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { db, priceAlerts } from "@taad/db";
import { verifyUnsubscribeToken } from "../lib/jwt.js";
import { unsubscribeSchema } from "../lib/validation.js";

export const alertsApp = new Hono();

// GET /unsubscribe — no authentication required
alertsApp.get("/unsubscribe", async (c) => {
  const parsed = unsubscribeSchema.safeParse({ token: c.req.query("token") });
  if (!parsed.success) {
    return c.json({ error: "Token is required" }, 400);
  }

  let alertId: string;
  try {
    alertId = verifyUnsubscribeToken(parsed.data.token);
  } catch {
    return c.json({ error: "Invalid or expired token" }, 400);
  }

  await db
    .update(priceAlerts)
    .set({ isActive: false })
    .where(eq(priceAlerts.id, alertId));

  return c.json({ message: "Alert unsubscribed successfully" }, 200);
});
