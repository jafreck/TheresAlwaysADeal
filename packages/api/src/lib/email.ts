/**
 * Stubbed email service — logs to console instead of sending real emails.
 * Will be replaced with a real implementation in #21.
 */

export const AFFILIATE_DISCLOSURE =
  "This email may contain affiliate links. We may earn a commission on purchases made through these links at no extra cost to you.";

export async function sendVerificationEmail(
  email: string,
  token: string,
): Promise<void> {
  const url = `${process.env.APP_URL ?? "http://localhost:3000"}/api/auth/verify-email?token=${token}`;
  console.log(`[email-stub] Verification email for ${email}: ${url}\n${AFFILIATE_DISCLOSURE}`);
}

export async function sendPasswordResetEmail(
  email: string,
  token: string,
): Promise<void> {
  const url = `${process.env.APP_URL ?? "http://localhost:3000"}/api/auth/reset-password?token=${token}`;
  console.log(`[email-stub] Password reset email for ${email}: ${url}\n${AFFILIATE_DISCLOSURE}`);
}
