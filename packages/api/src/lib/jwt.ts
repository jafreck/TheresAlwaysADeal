import jwt from "jsonwebtoken";
import crypto from "node:crypto";

const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "30d";

function getAccessSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET environment variable is required");
  return secret;
}

function getRefreshSecret(): string {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret)
    throw new Error("JWT_REFRESH_SECRET environment variable is required");
  return secret;
}

export function signAccessToken(payload: Record<string, unknown>): string {
  return jwt.sign(payload, getAccessSecret(), {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
}

export function signRefreshToken(payload: Record<string, unknown>): string {
  return jwt.sign(payload, getRefreshSecret(), {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });
}

export function verifyAccessToken(token: string): Record<string, unknown> {
  return jwt.verify(token, getAccessSecret()) as Record<string, unknown>;
}

export function verifyRefreshToken(token: string): Record<string, unknown> {
  return jwt.verify(token, getRefreshSecret()) as Record<string, unknown>;
}

// ─── Unsubscribe Tokens (HMAC-SHA256) ─────────────────────────────────────────

export function signUnsubscribeToken(alertId: string): string {
  const payload = Buffer.from(JSON.stringify({ alertId })).toString("base64url");
  const signature = crypto
    .createHmac("sha256", getAccessSecret())
    .update(payload)
    .digest("base64url");
  return `${payload}.${signature}`;
}

export function verifyUnsubscribeToken(token: string): string {
  const parts = token.split(".");
  if (parts.length !== 2) throw new Error("Invalid unsubscribe token");
  const [payload, signature] = parts;
  const expected = crypto
    .createHmac("sha256", getAccessSecret())
    .update(payload!)
    .digest("base64url");
  if (signature !== expected) throw new Error("Invalid unsubscribe token");
  const { alertId } = JSON.parse(
    Buffer.from(payload!, "base64url").toString(),
  ) as { alertId: string };
  if (!alertId) throw new Error("Invalid unsubscribe token");
  return alertId;
}
