import jwt from "jsonwebtoken";

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
