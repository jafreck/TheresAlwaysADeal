import type { Context, Next } from "hono";
import { verifyAccessToken } from "../lib/jwt.js";

export async function authMiddleware(c: Context, next: Next) {
  const header = c.req.header("Authorization");
  if (!header) {
    return c.json({ error: "Authorization header is required" }, 401);
  }

  const parts = header.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return c.json({ error: "Malformed Authorization header" }, 401);
  }

  const token = parts[1]!;

  try {
    const payload = await verifyAccessToken(token);
    c.set("userId", payload.sub);
  } catch {
    return c.json({ error: "Invalid or expired token" }, 401);
  }

  await next();
}
