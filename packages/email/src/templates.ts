export interface PriceEntry {
  storeName: string;
  price: string;
  referralUrl: string;
}

export function priceAlertTemplate(
  gameTitle: string,
  imageUrl: string,
  prices: PriceEntry[],
  unsubscribeUrl: string,
): string {
  const priceRows = prices
    .map(
      (p) => `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:14px;">${p.storeName}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:14px;font-weight:bold;color:#16a34a;">$${p.price}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;">
            <a href="${p.referralUrl}" style="display:inline-block;padding:6px 16px;background-color:#2563eb;color:#ffffff;text-decoration:none;border-radius:4px;font-size:13px;">Buy</a>
          </td>
        </tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;">
        <tr>
          <td style="padding:0;">
            <img src="${imageUrl}" alt="${gameTitle}" width="600" style="display:block;width:100%;max-width:600px;height:auto;" />
          </td>
        </tr>
        <tr>
          <td style="padding:24px;">
            <h1 style="margin:0 0 8px;font-size:22px;color:#111827;">Price Drop Alert</h1>
            <p style="margin:0 0 20px;font-size:16px;color:#374151;"><strong>${gameTitle}</strong> has dropped in price!</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;">
              <tr style="background-color:#f9fafb;">
                <th style="padding:10px 12px;text-align:left;font-size:13px;color:#6b7280;font-weight:600;">Store</th>
                <th style="padding:10px 12px;text-align:left;font-size:13px;color:#6b7280;font-weight:600;">Price</th>
                <th style="padding:10px 12px;text-align:center;font-size:13px;color:#6b7280;font-weight:600;"></th>
              </tr>
              ${priceRows}
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:0 24px 24px;">
            <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
              <a href="${unsubscribeUrl}" style="color:#6b7280;text-decoration:underline;">Unsubscribe from this alert</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function verificationTemplate(verificationUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;">
        <tr>
          <td style="padding:32px 24px;text-align:center;">
            <h1 style="margin:0 0 12px;font-size:22px;color:#111827;">Verify your email</h1>
            <p style="margin:0 0 24px;font-size:16px;color:#374151;">Click the button below to verify your email address and activate your account.</p>
            <a href="${verificationUrl}" style="display:inline-block;padding:12px 32px;background-color:#2563eb;color:#ffffff;text-decoration:none;border-radius:6px;font-size:16px;font-weight:600;">Verify Email</a>
            <p style="margin:24px 0 0;font-size:13px;color:#9ca3af;">If you didn't create an account, you can safely ignore this email.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function passwordResetTemplate(resetUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;">
        <tr>
          <td style="padding:32px 24px;text-align:center;">
            <h1 style="margin:0 0 12px;font-size:22px;color:#111827;">Reset your password</h1>
            <p style="margin:0 0 24px;font-size:16px;color:#374151;">Click the button below to reset your password. This link expires in 1 hour.</p>
            <a href="${resetUrl}" style="display:inline-block;padding:12px 32px;background-color:#2563eb;color:#ffffff;text-decoration:none;border-radius:6px;font-size:16px;font-weight:600;">Reset Password</a>
            <p style="margin:24px 0 0;font-size:13px;color:#9ca3af;">If you didn't request a password reset, you can safely ignore this email.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
