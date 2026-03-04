import { Hono } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import type { Redis as RedisClient } from "ioredis";
import { db, users } from "@taad/db";
import { hashPassword, verifyPassword } from "../lib/password.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../lib/jwt.js";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
} from "../lib/email.js";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../lib/validation.js";

const REFRESH_TOKEN_TTL = 30 * 24 * 60 * 60; // 30 days in seconds
const BRUTE_FORCE_WINDOW = 15 * 60; // 15 minutes in seconds
const BRUTE_FORCE_MAX_ATTEMPTS = 10;

// In-memory brute-force fallback
const bruteForceMemory = new Map<
  string,
  { count: number; resetAt: number }
>();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function setRefreshCookie(c: any, token: string) {
  setCookie(c, "refresh_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
    path: "/",
    maxAge: REFRESH_TOKEN_TTL,
  });
}

async function incrementBruteForce(
  redis: RedisClient | null,
  bruteKey: string,
  ip: string,
) {
  if (redis) {
    try {
      const attempts = await redis.incr(bruteKey);
      if (attempts === 1) {
        await redis.expire(bruteKey, BRUTE_FORCE_WINDOW);
      }
      return;
    } catch {
      // Fall through to in-memory
    }
  }
  const now = Date.now();
  const entry = bruteForceMemory.get(ip);
  if (entry && now < entry.resetAt) {
    entry.count++;
  } else {
    bruteForceMemory.set(ip, {
      count: 1,
      resetAt: now + BRUTE_FORCE_WINDOW * 1000,
    });
  }
}

export function createAuthApp(getRedis: () => RedisClient | null) {
  const app = new Hono();

  // POST /register
  app.post("/register", async (c) => {
    const body = await c.req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return c.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        400,
      );
    }
    const { email, password, name } = parsed.data;

    // Check for existing user
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (existing) {
      return c.json({ error: "Email already registered" }, 400);
    }

    const passwordHash = await hashPassword(password);
    const emailVerificationToken = crypto.randomUUID();

    const [user] = await db
      .insert(users)
      .values({ email, passwordHash, emailVerificationToken, name })
      .returning({ id: users.id, email: users.email });

    if (!user) {
      return c.json({ error: "Failed to create user" }, 400);
    }

    await sendVerificationEmail(email, emailVerificationToken);

    const accessToken = signAccessToken({ sub: user.id, email: user.email });
    const refreshToken = signRefreshToken({ sub: user.id });

    // Store refresh token in Redis
    const redis = getRedis();
    if (redis) {
      await redis.set(
        `refresh:${refreshToken}`,
        user.id,
        "EX",
        REFRESH_TOKEN_TTL,
      );
    }

    setRefreshCookie(c, refreshToken);

    return c.json({ accessToken }, 201);
  });

  // POST /login
  app.post("/login", async (c) => {
    const body = await c.req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return c.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        400,
      );
    }
    const { email, password } = parsed.data;

    // Brute-force protection
    const ip =
      c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
      c.req.header("x-real-ip") ??
      "unknown";
    const bruteKey = `brute:${ip}`;
    const redis = getRedis();

    // Check current attempt count (without incrementing)
    if (redis) {
      try {
        const current = await redis.get(bruteKey);
        if (current && Number(current) >= BRUTE_FORCE_MAX_ATTEMPTS) {
          return c.json({ error: "Too many login attempts" }, 429);
        }
      } catch {
        const now = Date.now();
        const entry = bruteForceMemory.get(ip);
        if (entry && now < entry.resetAt && entry.count >= BRUTE_FORCE_MAX_ATTEMPTS) {
          return c.json({ error: "Too many login attempts" }, 429);
        }
      }
    } else {
      const now = Date.now();
      const entry = bruteForceMemory.get(ip);
      if (entry && now < entry.resetAt && entry.count >= BRUTE_FORCE_MAX_ATTEMPTS) {
        return c.json({ error: "Too many login attempts" }, 429);
      }
    }

    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        passwordHash: users.passwordHash,
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user || !user.passwordHash) {
      await incrementBruteForce(redis, bruteKey, ip);
      return c.json({ error: "Invalid email or password" }, 401);
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      await incrementBruteForce(redis, bruteKey, ip);
      return c.json({ error: "Invalid email or password" }, 401);
    }

    const accessToken = signAccessToken({ sub: user.id, email: user.email });
    const refreshToken = signRefreshToken({ sub: user.id });

    if (redis) {
      await redis.set(
        `refresh:${refreshToken}`,
        user.id,
        "EX",
        REFRESH_TOKEN_TTL,
      );
    }

    setRefreshCookie(c, refreshToken);

    return c.json({ accessToken }, 200);
  });

  // POST /refresh
  app.post("/refresh", async (c) => {
    const token = getCookie(c, "refresh_token");
    if (!token) {
      return c.json({ error: "Refresh token required" }, 401);
    }

    let payload: Record<string, unknown>;
    try {
      payload = verifyRefreshToken(token);
    } catch {
      return c.json({ error: "Invalid or expired refresh token" }, 401);
    }

    // Check Redis for revocation
    const redis = getRedis();
    if (redis) {
      const stored = await redis.get(`refresh:${token}`);
      if (!stored) {
        return c.json({ error: "Refresh token revoked" }, 401);
      }
    }

    const userId = payload.sub as string;
    const [user] = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return c.json({ error: "User not found" }, 401);
    }

    const accessToken = signAccessToken({ sub: user.id, email: user.email });

    return c.json({ accessToken }, 200);
  });

  // POST /logout
  app.post("/logout", async (c) => {
    const token = getCookie(c, "refresh_token");
    if (token) {
      const redis = getRedis();
      if (redis) {
        await redis.del(`refresh:${token}`);
      }
    }

    deleteCookie(c, "refresh_token", { path: "/" });

    return c.json({ message: "Logged out" }, 200);
  });

  // POST /forgot-password
  app.post("/forgot-password", async (c) => {
    const body = await c.req.json();
    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return c.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        400,
      );
    }
    const { email } = parsed.data;

    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    // Always return success to prevent email enumeration
    if (!user) {
      return c.json({ message: "If the email exists, a reset link has been sent" }, 200);
    }

    const resetToken = crypto.randomUUID();
    const resetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 min

    await db
      .update(users)
      .set({
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires,
      })
      .where(eq(users.id, user.id));

    await sendPasswordResetEmail(email, resetToken);

    return c.json({ message: "If the email exists, a reset link has been sent" }, 200);
  });

  // POST /reset-password
  app.post("/reset-password", async (c) => {
    const body = await c.req.json();
    const parsed = resetPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return c.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        400,
      );
    }
    const { token, password } = parsed.data;

    const [user] = await db
      .select({
        id: users.id,
        passwordResetToken: users.passwordResetToken,
        passwordResetExpires: users.passwordResetExpires,
      })
      .from(users)
      .where(eq(users.passwordResetToken, token))
      .limit(1);

    if (!user) {
      return c.json({ error: "Invalid or expired reset token" }, 400);
    }

    if (!user.passwordResetExpires || user.passwordResetExpires < new Date()) {
      return c.json({ error: "Invalid or expired reset token" }, 400);
    }

    const passwordHash = await hashPassword(password);

    await db
      .update(users)
      .set({
        passwordHash,
        passwordResetToken: null,
        passwordResetExpires: null,
      })
      .where(eq(users.id, user.id));

    return c.json({ message: "Password reset successfully" }, 200);
  });

  // GET /verify-email
  app.get("/verify-email", async (c) => {
    const token = c.req.query("token");
    if (!token) {
      return c.json({ error: "Token is required" }, 400);
    }

    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.emailVerificationToken, token))
      .limit(1);

    if (!user) {
      return c.json({ error: "Invalid verification token" }, 400);
    }

    await db
      .update(users)
      .set({
        emailVerified: true,
        emailVerificationToken: null,
      })
      .where(eq(users.id, user.id));

    return c.json({ message: "Email verified successfully" }, 200);
  });

  return app;
}
