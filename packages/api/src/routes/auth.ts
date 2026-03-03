import { Hono, type Context } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { z } from "zod";
import crypto from "node:crypto";
import { eq, and, isNull } from "drizzle-orm";
import {
  db,
  users,
  refreshTokens,
  passwordResetTokens,
  emailVerificationTokens,
} from "@taad/db";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../lib/jwt.js";
import { hashPassword, verifyPassword } from "../lib/password.js";
import { Redis, type Redis as RedisClient } from "ioredis";

const auth = new Hono();

// ─── Validation Schemas ─────────────────────────────────────────────────────

const registerSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[a-z]/, "Must contain at least one lowercase letter")
    .regex(/[0-9]/, "Must contain at least one number"),
  name: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[a-z]/, "Must contain at least one lowercase letter")
    .regex(/[0-9]/, "Must contain at least one number"),
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

const REFRESH_COOKIE = "refresh_token";
const REFRESH_TOKEN_DAYS = 30;

function setRefreshCookie(c: Context, token: string) {
  setCookie(c, REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
    path: "/",
    maxAge: REFRESH_TOKEN_DAYS * 24 * 60 * 60,
  });
}

function clearRefreshCookie(c: Context) {
  deleteCookie(c, REFRESH_COOKIE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
    path: "/",
  });
}

async function createAndStoreRefreshToken(userId: string): Promise<string> {
  const token = await signRefreshToken(userId);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000);
  await db.insert(refreshTokens).values({ userId, token, expiresAt });
  return token;
}

// Brute-force protection via Redis
let _redis: RedisClient | null = null;
function getRedis(): RedisClient | null {
  if (!process.env.REDIS_URL) return null;
  if (!_redis) _redis = new Redis(process.env.REDIS_URL);
  return _redis;
}

const BRUTE_FORCE_MAX = 10;
const BRUTE_FORCE_WINDOW = 15 * 60; // 15 minutes in seconds

async function checkBruteForce(email: string): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false; // fail open
  try {
    const key = `login_attempts:${email}`;
    const current = await redis.get(key);
    return current !== null && parseInt(current, 10) >= BRUTE_FORCE_MAX;
  } catch {
    return false; // fail open on Redis errors
  }
}

async function recordFailedLogin(email: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    const key = `login_attempts:${email}`;
    const current = await redis.incr(key);
    if (current === 1) {
      await redis.expire(key, BRUTE_FORCE_WINDOW);
    }
  } catch {
    // fail open on Redis errors
  }
}

// ─── POST /register ──────────────────────────────────────────────────────────

auth.post("/register", async (c) => {
  const body = await c.req.json();
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Validation failed", details: parsed.error.flatten() }, 400);
  }

  const { email, password, name } = parsed.data;

  // Check if email already exists
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing) {
    return c.json({ error: "Email already exists" }, 409);
  }

  const passwordHash = await hashPassword(password);

  const [user] = await db
    .insert(users)
    .values({ email, name, passwordHash, emailVerified: false })
    .returning({ id: users.id });

  // Create email verification token
  const verificationToken = crypto.randomBytes(32).toString("hex");
  const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  await db.insert(emailVerificationTokens).values({
    userId: user!.id,
    token: verificationToken,
    expiresAt: verificationExpires,
  });

  // Stub email sending
  console.log(`[EMAIL STUB] Verification email for ${email}: token=${verificationToken}`);

  const accessToken = await signAccessToken(user!.id);
  const refreshToken = await createAndStoreRefreshToken(user!.id);

  setRefreshCookie(c, refreshToken);

  return c.json({ accessToken }, 201);
});

// ─── POST /login ─────────────────────────────────────────────────────────────

auth.post("/login", async (c) => {
  const body = await c.req.json();
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Validation failed", details: parsed.error.flatten() }, 400);
  }

  const { email, password } = parsed.data;

  // Brute-force protection
  const blocked = await checkBruteForce(email);
  if (blocked) {
    return c.json({ error: "Too many login attempts. Please try again later." }, 429);
  }

  const [user] = await db
    .select({ id: users.id, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user || !user.passwordHash) {
    await recordFailedLogin(email);
    return c.json({ error: "Invalid credentials" }, 401);
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    await recordFailedLogin(email);
    return c.json({ error: "Invalid credentials" }, 401);
  }

  const accessToken = await signAccessToken(user.id);
  const refreshToken = await createAndStoreRefreshToken(user.id);

  setRefreshCookie(c, refreshToken);

  return c.json({ accessToken }, 200);
});

// ─── POST /refresh ───────────────────────────────────────────────────────────

auth.post("/refresh", async (c) => {
  const token = getCookie(c, REFRESH_COOKIE);
  if (!token) {
    return c.json({ error: "No refresh token" }, 401);
  }

  let payload;
  try {
    payload = await verifyRefreshToken(token);
  } catch {
    return c.json({ error: "Invalid or expired refresh token" }, 401);
  }

  // Check token is not revoked in DB
  const [stored] = await db
    .select({ id: refreshTokens.id, revokedAt: refreshTokens.revokedAt })
    .from(refreshTokens)
    .where(and(eq(refreshTokens.token, token), isNull(refreshTokens.revokedAt)))
    .limit(1);

  if (!stored) {
    return c.json({ error: "Refresh token revoked or not found" }, 401);
  }

  const accessToken = await signAccessToken(payload.sub!);

  return c.json({ accessToken }, 200);
});

// ─── POST /logout ────────────────────────────────────────────────────────────

auth.post("/logout", async (c) => {
  const token = getCookie(c, REFRESH_COOKIE);
  if (token) {
    await db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokens.token, token));
  }

  clearRefreshCookie(c);

  return c.json({ message: "Logged out" }, 200);
});

// ─── POST /forgot-password ──────────────────────────────────────────────────

auth.post("/forgot-password", async (c) => {
  const body = await c.req.json();
  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Validation failed", details: parsed.error.flatten() }, 400);
  }

  const { email } = parsed.data;

  // Always return 200 to prevent user enumeration
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (user) {
    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    await db.insert(passwordResetTokens).values({
      userId: user.id,
      token: resetToken,
      expiresAt,
    });

    // Stub email sending
    console.log(`[EMAIL STUB] Password reset for ${email}: token=${resetToken}`);
  }

  return c.json({ message: "If the email exists, a reset link has been sent." }, 200);
});

// ─── POST /reset-password ───────────────────────────────────────────────────

auth.post("/reset-password", async (c) => {
  const body = await c.req.json();
  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Validation failed", details: parsed.error.flatten() }, 400);
  }

  const { token, password } = parsed.data;

  const [resetRecord] = await db
    .select({
      id: passwordResetTokens.id,
      userId: passwordResetTokens.userId,
      expiresAt: passwordResetTokens.expiresAt,
      usedAt: passwordResetTokens.usedAt,
    })
    .from(passwordResetTokens)
    .where(eq(passwordResetTokens.token, token))
    .limit(1);

  if (!resetRecord || resetRecord.usedAt || resetRecord.expiresAt < new Date()) {
    return c.json({ error: "Invalid or expired reset token" }, 400);
  }

  const passwordHash = await hashPassword(password);

  await db.update(users).set({ passwordHash }).where(eq(users.id, resetRecord.userId));
  await db
    .update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(eq(passwordResetTokens.id, resetRecord.id));

  return c.json({ message: "Password has been reset" }, 200);
});

// ─── GET /verify-email ──────────────────────────────────────────────────────

auth.get("/verify-email", async (c) => {
  const token = c.req.query("token");
  if (!token) {
    return c.json({ error: "Token is required" }, 400);
  }

  const [record] = await db
    .select({
      id: emailVerificationTokens.id,
      userId: emailVerificationTokens.userId,
      expiresAt: emailVerificationTokens.expiresAt,
      usedAt: emailVerificationTokens.usedAt,
    })
    .from(emailVerificationTokens)
    .where(eq(emailVerificationTokens.token, token))
    .limit(1);

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return c.json({ error: "Invalid or expired verification token" }, 400);
  }

  await db.update(users).set({ emailVerified: true }).where(eq(users.id, record.userId));
  await db
    .update(emailVerificationTokens)
    .set({ usedAt: new Date() })
    .where(eq(emailVerificationTokens.id, record.id));

  return c.json({ message: "Email verified successfully" }, 200);
});

export { auth };
