import { describe, it, expect } from "vitest";

describe("AffiliateDisclosurePage", () => {
  it("should export metadata with title 'Affiliate Disclosure'", async () => {
    const mod = await import("../../../src/app/affiliate-disclosure/page");
    expect(mod.metadata.title).toBe("Affiliate Disclosure");
  });

  it("should export metadata with a description", async () => {
    const mod = await import("../../../src/app/affiliate-disclosure/page");
    expect(mod.metadata.description).toBeDefined();
    expect(typeof mod.metadata.description).toBe("string");
  });

  it("should be a function (React component)", async () => {
    const mod = await import("../../../src/app/affiliate-disclosure/page");
    expect(typeof mod.default).toBe("function");
  });

  it("should render a main element", async () => {
    const mod = await import("../../../src/app/affiliate-disclosure/page");
    const element = mod.default();
    expect(element.type).toBe("main");
  });

  it("should include an Affiliate Disclosure h1 heading", async () => {
    const mod = await import("../../../src/app/affiliate-disclosure/page");
    const element = mod.default();
    const children = element.props.children;
    const h1 = children.find(
      (c: { type: string }) => c?.type === "h1",
    );
    expect(h1).toBeTruthy();
    expect(h1.props.children).toBe("Affiliate Disclosure");
  });

  it("should include an FTC Disclosure section", async () => {
    const mod = await import("../../../src/app/affiliate-disclosure/page");
    const element = mod.default();
    const sections = element.props.children.filter(
      (c: { type: string }) => c?.type === "section",
    );
    const found = sections.some((s: { props: { children: Array<{ props: { children: string } }> } }) => {
      const h2 = s.props.children[0];
      return h2?.props?.children === "FTC Disclosure";
    });
    expect(found).toBe(true);
  });

  it("should include an Our Affiliate Relationships section", async () => {
    const mod = await import("../../../src/app/affiliate-disclosure/page");
    const element = mod.default();
    const html = JSON.stringify(element);
    expect(html).toContain("Our Affiliate Relationships");
  });

  it("should include a How It Works section", async () => {
    const mod = await import("../../../src/app/affiliate-disclosure/page");
    const element = mod.default();
    const sections = element.props.children.filter(
      (c: { type: string }) => c?.type === "section",
    );
    const found = sections.some((s: { props: { children: Array<{ props: { children: string } }> } }) => {
      const h2 = s.props.children[0];
      return h2?.props?.children === "How It Works";
    });
    expect(found).toBe(true);
  });

  it("should include an Our Commitment to You section", async () => {
    const mod = await import("../../../src/app/affiliate-disclosure/page");
    const element = mod.default();
    const html = JSON.stringify(element);
    expect(html).toContain("Our Commitment to You");
  });

  it("should include a Contact section", async () => {
    const mod = await import("../../../src/app/affiliate-disclosure/page");
    const element = mod.default();
    const sections = element.props.children.filter(
      (c: { type: string }) => c?.type === "section",
    );
    const found = sections.some((s: { props: { children: Array<{ props: { children: string } }> } }) => {
      const h2 = s.props.children[0];
      return h2?.props?.children === "Contact";
    });
    expect(found).toBe(true);
  });

  it("should have exactly five sections", async () => {
    const mod = await import("../../../src/app/affiliate-disclosure/page");
    const element = mod.default();
    const sections = element.props.children.filter(
      (c: { type: string }) => c?.type === "section",
    );
    expect(sections).toHaveLength(5);
  });

  it("should include a last-updated date", async () => {
    const mod = await import("../../../src/app/affiliate-disclosure/page");
    const element = mod.default();
    const html = JSON.stringify(element);
    expect(html).toContain("Last updated");
  });

  it("should contain a contact email link", async () => {
    const mod = await import("../../../src/app/affiliate-disclosure/page");
    const element = mod.default();
    const html = JSON.stringify(element);
    expect(html).toContain("mailto:legal@theresalwaysadeal.com");
  });

  it("should mention affiliate stores: Steam, GOG, Epic, Humble, Fanatical", async () => {
    const mod = await import("../../../src/app/affiliate-disclosure/page");
    const element = mod.default();
    const html = JSON.stringify(element);
    expect(html).toContain("Steam");
    expect(html).toContain("GOG");
    expect(html).toContain("Epic Games Store");
    expect(html).toContain("Humble Bundle");
    expect(html).toContain("Fanatical");
  });

  it("should include FTC-required commission disclosure language", async () => {
    const mod = await import("../../../src/app/affiliate-disclosure/page");
    const element = mod.default();
    const html = JSON.stringify(element);
    expect(html).toContain("earn a commission");
    expect(html).toContain("no additional cost to you");
  });

  it("should use consistent max-w-3xl styling", async () => {
    const mod = await import("../../../src/app/affiliate-disclosure/page");
    const element = mod.default();
    expect(element.props.className).toContain("max-w-3xl");
  });

  it("should state that affiliate relationships do not influence price comparisons", async () => {
    const mod = await import("../../../src/app/affiliate-disclosure/page");
    const element = mod.default();
    const html = JSON.stringify(element);
    expect(html).toContain("do not influence");
  });
});
