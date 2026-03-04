import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const envExamplePath = join(__dirname, "../../../.env.example");
const envExampleContent = readFileSync(envExamplePath, "utf-8");

describe(".env.example", () => {
  it("should contain a SENTRY_DSN entry with a placeholder value", () => {
    expect(envExampleContent).toMatch(/^SENTRY_DSN=/m);
  });

  it("should contain a LOGTAIL_SOURCE_TOKEN entry with a placeholder value", () => {
    expect(envExampleContent).toMatch(/^LOGTAIL_SOURCE_TOKEN=/m);
  });

  it("should include an inline comment for SENTRY_DSN", () => {
    const lines = envExampleContent.split("\n");
    const sentryCommentLine = lines.find((l) => /sentry/i.test(l) && l.startsWith("#"));
    expect(sentryCommentLine).toBeTruthy();
  });

  it("should include an inline comment for LOGTAIL_SOURCE_TOKEN", () => {
    const lines = envExampleContent.split("\n");
    const logtailCommentLine = lines.find((l) => /logtail/i.test(l) && l.startsWith("#"));
    expect(logtailCommentLine).toBeTruthy();
  });

  it("should preserve existing DATABASE_URL entry", () => {
    expect(envExampleContent).toMatch(/^DATABASE_URL=/m);
  });

  it("should preserve existing REDIS_URL entry", () => {
    expect(envExampleContent).toMatch(/^REDIS_URL=/m);
  });

  it("should preserve existing API_PORT entry", () => {
    expect(envExampleContent).toMatch(/^API_PORT=/m);
  });

  it("should preserve existing NEXT_PUBLIC_API_URL entry", () => {
    expect(envExampleContent).toMatch(/^NEXT_PUBLIC_API_URL=/m);
  });

  it("should contain a JWT_SECRET entry", () => {
    expect(envExampleContent).toMatch(/^JWT_SECRET=/m);
  });

  it("should contain a JWT_REFRESH_SECRET entry", () => {
    expect(envExampleContent).toMatch(/^JWT_REFRESH_SECRET=/m);
  });

  it("should contain a STEAM_OPENID_REALM entry", () => {
    expect(envExampleContent).toMatch(/^STEAM_OPENID_REALM=/m);
  });

  it("should contain a STEAM_OPENID_RETURN_URL entry", () => {
    expect(envExampleContent).toMatch(/^STEAM_OPENID_RETURN_URL=/m);
  });

  it("should include a Steam section header comment", () => {
    const lines = envExampleContent.split("\n");
    const steamHeaderLine = lines.find((l) => /─── Steam/.test(l) && l.startsWith("#"));
    expect(steamHeaderLine).toBeTruthy();
  });
});
