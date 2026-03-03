/**
 * Stubbed email service — logs to console instead of sending real emails.
 * Will be replaced with a real implementation in #21.
 */

export async function sendVerificationEmail(
  email: string,
  token: string,
): Promise<void> {
  const url = `${process.env.APP_URL ?? "http://localhost:3000"}/api/auth/verify-email?token=${token}`;
  console.log(`[email-stub] Verification email for ${email}: ${url}`);
}

export async function sendPasswordResetEmail(
  email: string,
  token: string,
): Promise<void> {
  const url = `${process.env.APP_URL ?? "http://localhost:3000"}/api/auth/reset-password?token=${token}`;
  console.log(`[email-stub] Password reset email for ${email}: ${url}`);
}
