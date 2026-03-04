import { Resend } from "resend";
import { db, alertNotifications } from "@taad/db";
import {
  priceAlertTemplate,
  verificationTemplate,
  passwordResetTemplate,
} from "./templates.js";
import type { PriceEntry } from "./templates.js";

function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY environment variable is required");
  }
  return new Resend(apiKey);
}

function getFromAddress(): string {
  return process.env.EMAIL_FROM ?? "noreply@theres-always-a-deal.com";
}

export async function sendVerificationEmail(
  email: string,
  token: string,
): Promise<void> {
  const resend = getResendClient();
  const url = `${process.env.APP_URL ?? "http://localhost:3000"}/api/auth/verify-email?token=${token}`;

  try {
    await resend.emails.send({
      from: getFromAddress(),
      to: email,
      subject: "Verify your email — There's Always a Deal",
      html: verificationTemplate(url),
    });
    console.log(`[email] Verification email sent to ${email}`);
  } catch (error) {
    console.error(`[email] Failed to send verification email to ${email}:`, error);
  }
}

export async function sendPasswordResetEmail(
  email: string,
  token: string,
): Promise<void> {
  const resend = getResendClient();
  const url = `${process.env.APP_URL ?? "http://localhost:3000"}/api/auth/reset-password?token=${token}`;

  try {
    await resend.emails.send({
      from: getFromAddress(),
      to: email,
      subject: "Reset your password — There's Always a Deal",
      html: passwordResetTemplate(url),
    });
    console.log(`[email] Password reset email sent to ${email}`);
  } catch (error) {
    console.error(`[email] Failed to send password reset email to ${email}:`, error);
  }
}

export interface PriceAlertData {
  gameTitle: string;
  imageUrl: string;
  prices: PriceEntry[];
  unsubscribeUrl: string;
}

export async function sendPriceAlert(
  userId: string,
  alertId: string,
  priceData: PriceAlertData,
  recipientEmail: string,
  storeListingId: string,
  triggeredPrice: string,
): Promise<void> {
  const resend = getResendClient();

  let sendResult: { id?: string } | undefined;

  try {
    const { data } = await resend.emails.send({
      from: getFromAddress(),
      to: recipientEmail,
      subject: `Price drop: ${priceData.gameTitle} — There's Always a Deal`,
      html: priceAlertTemplate(
        priceData.gameTitle,
        priceData.imageUrl,
        priceData.prices,
        priceData.unsubscribeUrl,
      ),
    });
    sendResult = data ?? undefined;
  } catch (error) {
    console.error(`[email] Failed to send price alert for alert ${alertId}:`, error);

    try {
      await db.insert(alertNotifications).values({
        alertId,
        storeListingId,
        triggeredPrice,
        emailStatus: "failed",
        emailMessageId: null,
        emailProvider: "resend",
      });
    } catch (dbError) {
      console.error(`[email] Failed to log notification failure:`, dbError);
    }
    return;
  }

  try {
    await db.insert(alertNotifications).values({
      alertId,
      storeListingId,
      triggeredPrice,
      emailStatus: "sent",
      emailMessageId: sendResult?.id ?? null,
      emailProvider: "resend",
    });
  } catch (dbError) {
    console.error(`[email] Email sent but failed to log success for alert ${alertId}:`, dbError);
  }

  console.log(`[email] Price alert sent to ${recipientEmail} for alert ${alertId}`);
}

export type { PriceEntry } from "./templates.js";
