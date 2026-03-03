import type { MiddlewareHandler } from "hono";
import { verifyAccessToken } from "../lib/jwt.js";

export const authMiddleware: MiddlewareHandler = async (c, next) => {
  const header = c.req.header("Authorization");
  if (!header) {
    return c.json({ error: "Authorization header required" }, 401);
  }

  const parts = header.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return c.json({ error: "Invalid authorization format" }, 401);
  }

  const token = parts[1]!;

  try {
    const payload = verifyAccessToken(token);
    c.set("user", payload);
  } catch {
    return c.json({ error: "Invalid or expired token" }, 401);
  }

  await next();
};
