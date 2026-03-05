import { describe, it, expect } from "vitest";
import {
  priceAlertTemplate,
  verificationTemplate,
  passwordResetTemplate,
} from "../src/templates.js";
import type { PriceEntry } from "../src/templates.js";

describe("verificationTemplate", () => {
  it("should return an HTML string containing the verification URL", () => {
    const url = "https://example.com/verify?token=abc123";
    const html = verificationTemplate(url);
    expect(html).toContain(url);
  });

  it("should include a verify email heading", () => {
    const html = verificationTemplate("https://example.com/verify");
    expect(html).toContain("Verify your email");
  });

  it("should use inline styles (no external stylesheet links)", () => {
    const html = verificationTemplate("https://example.com/verify");
    expect(html).not.toContain('<link rel="stylesheet"');
    expect(html).toContain("style=");
  });

  it("should return valid HTML with doctype", () => {
    const html = verificationTemplate("https://example.com/verify");
    expect(html).toMatch(/^<!DOCTYPE html>/);
    expect(html).toContain("</html>");
  });

  it("should include a clickable button with the URL as href", () => {
    const url = "https://example.com/verify?token=xyz";
    const html = verificationTemplate(url);
    expect(html).toContain(`href="${url}"`);
    expect(html).toContain("Verify Email");
  });
});

describe("passwordResetTemplate", () => {
  it("should return an HTML string containing the reset URL", () => {
    const url = "https://example.com/reset?token=reset123";
    const html = passwordResetTemplate(url);
    expect(html).toContain(url);
  });

  it("should include a reset password heading", () => {
    const html = passwordResetTemplate("https://example.com/reset");
    expect(html).toContain("Reset your password");
  });

  it("should use inline styles (no external stylesheet links)", () => {
    const html = passwordResetTemplate("https://example.com/reset");
    expect(html).not.toContain('<link rel="stylesheet"');
    expect(html).toContain("style=");
  });

  it("should return valid HTML with doctype", () => {
    const html = passwordResetTemplate("https://example.com/reset");
    expect(html).toMatch(/^<!DOCTYPE html>/);
    expect(html).toContain("</html>");
  });

  it("should include a clickable button with the URL as href", () => {
    const url = "https://example.com/reset?token=abc";
    const html = passwordResetTemplate(url);
    expect(html).toContain(`href="${url}"`);
    expect(html).toContain("Reset Password");
  });

  it("should mention link expiration", () => {
    const html = passwordResetTemplate("https://example.com/reset");
    expect(html).toContain("expires");
  });
});

describe("priceAlertTemplate", () => {
  const samplePrices: PriceEntry[] = [
    { storeName: "Steam", price: "29.99", referralUrl: "https://store.steampowered.com/app/123?ref=taad" },
    { storeName: "GOG", price: "24.99", referralUrl: "https://gog.com/game/test?ref=taad" },
  ];
  const gameTitle = "Test Game";
  const imageUrl = "https://cdn.example.com/game.jpg";
  const unsubscribeUrl = "https://example.com/unsubscribe?token=unsub123";

  it("should return an HTML string containing the game title", () => {
    const html = priceAlertTemplate(gameTitle, imageUrl, samplePrices, unsubscribeUrl);
    expect(html).toContain(gameTitle);
  });

  it("should include the game image", () => {
    const html = priceAlertTemplate(gameTitle, imageUrl, samplePrices, unsubscribeUrl);
    expect(html).toContain(`src="${imageUrl}"`);
  });

  it("should include store names and prices for each entry", () => {
    const html = priceAlertTemplate(gameTitle, imageUrl, samplePrices, unsubscribeUrl);
    expect(html).toContain("Steam");
    expect(html).toContain("$29.99");
    expect(html).toContain("GOG");
    expect(html).toContain("$24.99");
  });

  it("should include referral buy links for each store", () => {
    const html = priceAlertTemplate(gameTitle, imageUrl, samplePrices, unsubscribeUrl);
    expect(html).toContain(`href="${samplePrices[0].referralUrl}"`);
    expect(html).toContain(`href="${samplePrices[1].referralUrl}"`);
    expect(html).toContain("Buy");
  });

  it("should include the unsubscribe link", () => {
    const html = priceAlertTemplate(gameTitle, imageUrl, samplePrices, unsubscribeUrl);
    expect(html).toContain(`href="${unsubscribeUrl}"`);
    expect(html).toContain("Unsubscribe");
  });

  it("should use inline styles (no external stylesheet links)", () => {
    const html = priceAlertTemplate(gameTitle, imageUrl, samplePrices, unsubscribeUrl);
    expect(html).not.toContain('<link rel="stylesheet"');
    expect(html).toContain("style=");
  });

  it("should return valid HTML with doctype", () => {
    const html = priceAlertTemplate(gameTitle, imageUrl, samplePrices, unsubscribeUrl);
    expect(html).toMatch(/^<!DOCTYPE html>/);
    expect(html).toContain("</html>");
  });

  it("should include a Price Drop Alert heading", () => {
    const html = priceAlertTemplate(gameTitle, imageUrl, samplePrices, unsubscribeUrl);
    expect(html).toContain("Price Drop Alert");
  });

  it("should handle a single price entry", () => {
    const singlePrice: PriceEntry[] = [
      { storeName: "Epic", price: "9.99", referralUrl: "https://epic.com/game?ref=taad" },
    ];
    const html = priceAlertTemplate(gameTitle, imageUrl, singlePrice, unsubscribeUrl);
    expect(html).toContain("Epic");
    expect(html).toContain("$9.99");
  });

  it("should handle empty prices array", () => {
    const html = priceAlertTemplate(gameTitle, imageUrl, [], unsubscribeUrl);
    expect(html).toContain(gameTitle);
    expect(html).toContain("Price Drop Alert");
  });

  it("should escape HTML special characters in game title", () => {
    const dangerousTitle = '<script>alert("xss")</script>';
    const html = priceAlertTemplate(dangerousTitle, imageUrl, samplePrices, unsubscribeUrl);
    expect(html).not.toContain("<script>alert");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("&quot;xss&quot;");
  });

  it("should escape ampersands in game title", () => {
    const titleWithAmp = "Ratchet & Clank";
    const html = priceAlertTemplate(titleWithAmp, imageUrl, samplePrices, unsubscribeUrl);
    expect(html).toContain("Ratchet &amp; Clank");
  });

  it("should escape HTML special characters in store name", () => {
    const dangerousPrices: PriceEntry[] = [
      { storeName: '<b>Evil Store</b>', price: "9.99", referralUrl: "https://example.com" },
    ];
    const html = priceAlertTemplate(gameTitle, imageUrl, dangerousPrices, unsubscribeUrl);
    expect(html).not.toContain("<b>Evil Store</b>");
    expect(html).toContain("&lt;b&gt;Evil Store&lt;/b&gt;");
  });

  it("should escape HTML special characters in price", () => {
    const dangerousPrices: PriceEntry[] = [
      { storeName: "Steam", price: '19.99"<img>', referralUrl: "https://example.com" },
    ];
    const html = priceAlertTemplate(gameTitle, imageUrl, dangerousPrices, unsubscribeUrl);
    expect(html).not.toContain('<img>');
    expect(html).toContain("&lt;img&gt;");
  });

  it("should escape single quotes in game title", () => {
    const titleWithQuote = "Assassin's Creed";
    const html = priceAlertTemplate(titleWithQuote, imageUrl, samplePrices, unsubscribeUrl);
    expect(html).toContain("Assassin&#39;s Creed");
  });
});
