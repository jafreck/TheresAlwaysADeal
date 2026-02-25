import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const infrastructureMd = readFileSync(
  join(__dirname, "../../../INFRASTRUCTURE.md"),
  "utf-8",
);

describe("INFRASTRUCTURE.md", () => {
  it("should exist and be non-empty", () => {
    expect(infrastructureMd.length).toBeGreaterThan(0);
  });

  it("should contain an architecture overview section", () => {
    expect(infrastructureMd).toMatch(/##\s+Architecture Overview/i);
  });

  it("should contain an ASCII architecture diagram", () => {
    expect(infrastructureMd).toContain("```");
    expect(infrastructureMd).toMatch(/Vercel/);
    expect(infrastructureMd).toMatch(/Railway/);
  });

  it("should contain a services table", () => {
    expect(infrastructureMd).toMatch(/##\s+Services Table/i);
    expect(infrastructureMd).toMatch(/\|\s*Service\s*\|/);
    expect(infrastructureMd).toMatch(/\|\s*Platform\s*\|/);
  });

  it("should list all five core services in the services table", () => {
    expect(infrastructureMd).toMatch(/Web.*Next\.?js/i);
    expect(infrastructureMd).toMatch(/API.*Hono/i);
    expect(infrastructureMd).toMatch(/Worker/i);
    expect(infrastructureMd).toMatch(/Neon/i);
    expect(infrastructureMd).toMatch(/Upstash/i);
  });

  it("should differentiate production and staging environments", () => {
    expect(infrastructureMd).toMatch(/production/i);
    expect(infrastructureMd).toMatch(/staging/i);
    expect(infrastructureMd).toMatch(/staging.*Neon|Neon.*staging/i);
  });

  it("should contain an environment variables section", () => {
    expect(infrastructureMd).toMatch(/##\s+Environment Variables/i);
  });

  it("should document env vars for the web package", () => {
    expect(infrastructureMd).toMatch(/NEXT_PUBLIC_API_URL/);
    expect(infrastructureMd).toMatch(/packages\/web/i);
  });

  it("should document env vars for the api package", () => {
    expect(infrastructureMd).toMatch(/DATABASE_URL/);
    expect(infrastructureMd).toMatch(/API_PORT/);
    expect(infrastructureMd).toMatch(/packages\/api/i);
  });

  it("should document env vars for the worker package", () => {
    expect(infrastructureMd).toMatch(/REDIS_URL/);
    expect(infrastructureMd).toMatch(/packages\/worker/i);
  });

  it("should document the Logtail logging provider with LOGTAIL_SOURCE_TOKEN", () => {
    expect(infrastructureMd).toMatch(/Logtail/i);
    expect(infrastructureMd).toMatch(/LOGTAIL_SOURCE_TOKEN/);
  });

  it("should document rationale for choosing Logtail", () => {
    // The Logtail section and a Rationale block must both be present
    expect(infrastructureMd).toMatch(/Logtail/i);
    expect(infrastructureMd).toMatch(/[Rr]ationale/);
  });

  it("should document the Sentry error monitoring choice", () => {
    expect(infrastructureMd).toMatch(/Sentry/i);
    expect(infrastructureMd).toMatch(/SENTRY_DSN/);
  });

  it("should document rationale for choosing Sentry", () => {
    // The Sentry section and a Rationale block must both be present
    expect(infrastructureMd).toMatch(/Sentry/i);
    expect(infrastructureMd).toMatch(/[Rr]ationale/);
  });

  it("should contain a monthly cost estimate section", () => {
    expect(infrastructureMd).toMatch(/##\s+Estimated Monthly Cost/i);
    expect(infrastructureMd).toMatch(/\$\d+/);
  });

  it("should list Vercel, Railway, Neon, Upstash costs", () => {
    expect(infrastructureMd).toMatch(/Vercel/);
    expect(infrastructureMd).toMatch(/Railway/);
    expect(infrastructureMd).toMatch(/Neon/);
    expect(infrastructureMd).toMatch(/Upstash/);
    expect(infrastructureMd).toMatch(/Total/i);
  });

  it("should contain a deployment runbook section", () => {
    expect(infrastructureMd).toMatch(/##\s+Deployment Runbook/i);
  });

  it("should document production deployment steps", () => {
    expect(infrastructureMd).toMatch(/Production Deployment/i);
    expect(infrastructureMd).toMatch(/main/);
  });

  it("should document staging deployment steps", () => {
    expect(infrastructureMd).toMatch(/Staging Deployment/i);
    expect(infrastructureMd).toMatch(/staging/i);
  });

  it("should include a health check verification step in the deployment runbook", () => {
    expect(infrastructureMd).toMatch(/\/health/);
    expect(infrastructureMd).toMatch(/curl/i);
  });

  it("should contain a rollback procedure section", () => {
    expect(infrastructureMd).toMatch(/##\s+Rollback Procedure/i);
  });

  it("should document rollback for Vercel", () => {
    // Rollback Procedure section must include a Web (Vercel) subsection
    expect(infrastructureMd).toMatch(/Rollback Procedure/i);
    expect(infrastructureMd).toMatch(/Web.*Vercel|Vercel.*Web/i);
  });

  it("should document rollback for Railway", () => {
    expect(infrastructureMd).toMatch(/Railway.*[Rr]ollback|[Rr]ollback.*Railway/i);
  });

  it("should document rollback for the database (Neon)", () => {
    expect(infrastructureMd).toMatch(/Neon/i);
    expect(infrastructureMd).toMatch(/[Rr]estore|[Rr]ollback/i);
  });

  it("should document the scraper topology decision (bundled with worker)", () => {
    expect(infrastructureMd).toMatch(/Scraper Topology/i);
    expect(infrastructureMd).toMatch(/bundle.*worker|worker.*bundle/i);
  });

  it("should provide rationale for the bundled scraper topology", () => {
    expect(infrastructureMd).toMatch(/[Rr]ationale/);
    expect(infrastructureMd).toMatch(/BullMQ/i);
  });
});
