import { describe, it, expect } from "vitest";

describe("TermsOfServicePage", () => {
  it("should export metadata with title 'Terms of Service'", async () => {
    const mod = await import("../../../src/app/terms/page");
    expect(mod.metadata.title).toBe("Terms of Service");
  });

  it("should export metadata with a description", async () => {
    const mod = await import("../../../src/app/terms/page");
    expect(mod.metadata.description).toBeDefined();
    expect(typeof mod.metadata.description).toBe("string");
  });

  it("should be a function (React component)", async () => {
    const mod = await import("../../../src/app/terms/page");
    expect(typeof mod.default).toBe("function");
  });

  it("should render a main element", async () => {
    const mod = await import("../../../src/app/terms/page");
    const element = mod.default();
    expect(element.type).toBe("main");
  });

  it("should include a Terms of Service h1 heading", async () => {
    const mod = await import("../../../src/app/terms/page");
    const element = mod.default();
    const children = element.props.children;
    const h1 = children.find(
      (c: { type: string }) => c?.type === "h1",
    );
    expect(h1).toBeTruthy();
    expect(h1.props.children).toBe("Terms of Service");
  });

  it("should include an Acceptance of Terms section", async () => {
    const mod = await import("../../../src/app/terms/page");
    const element = mod.default();
    const sections = element.props.children.filter(
      (c: { type: string }) => c?.type === "section",
    );
    const found = sections.some((s: { props: { children: Array<{ props: { children: string } }> } }) => {
      const h2 = s.props.children[0];
      return h2?.props?.children === "Acceptance of Terms";
    });
    expect(found).toBe(true);
  });

  it("should include a Use of Service section", async () => {
    const mod = await import("../../../src/app/terms/page");
    const element = mod.default();
    const sections = element.props.children.filter(
      (c: { type: string }) => c?.type === "section",
    );
    const found = sections.some((s: { props: { children: Array<{ props: { children: string } }> } }) => {
      const h2 = s.props.children[0];
      return h2?.props?.children === "Use of Service";
    });
    expect(found).toBe(true);
  });

  it("should include an Intellectual Property section", async () => {
    const mod = await import("../../../src/app/terms/page");
    const element = mod.default();
    const sections = element.props.children.filter(
      (c: { type: string }) => c?.type === "section",
    );
    const found = sections.some((s: { props: { children: Array<{ props: { children: string } }> } }) => {
      const h2 = s.props.children[0];
      return h2?.props?.children === "Intellectual Property";
    });
    expect(found).toBe(true);
  });

  it("should include a Limitation of Liability section", async () => {
    const mod = await import("../../../src/app/terms/page");
    const element = mod.default();
    const html = JSON.stringify(element);
    expect(html).toContain("Limitation of Liability");
  });

  it("should include a Third-Party Links section", async () => {
    const mod = await import("../../../src/app/terms/page");
    const element = mod.default();
    const sections = element.props.children.filter(
      (c: { type: string }) => c?.type === "section",
    );
    const found = sections.some((s: { props: { children: Array<{ props: { children: string } }> } }) => {
      const h2 = s.props.children[0];
      return h2?.props?.children === "Third-Party Links";
    });
    expect(found).toBe(true);
  });

  it("should include a Changes to Terms section", async () => {
    const mod = await import("../../../src/app/terms/page");
    const element = mod.default();
    const sections = element.props.children.filter(
      (c: { type: string }) => c?.type === "section",
    );
    const found = sections.some((s: { props: { children: Array<{ props: { children: string } }> } }) => {
      const h2 = s.props.children[0];
      return h2?.props?.children === "Changes to Terms";
    });
    expect(found).toBe(true);
  });

  it("should include a Contact section", async () => {
    const mod = await import("../../../src/app/terms/page");
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

  it("should have exactly seven sections", async () => {
    const mod = await import("../../../src/app/terms/page");
    const element = mod.default();
    const sections = element.props.children.filter(
      (c: { type: string }) => c?.type === "section",
    );
    expect(sections).toHaveLength(7);
  });

  it("should include a last-updated date", async () => {
    const mod = await import("../../../src/app/terms/page");
    const element = mod.default();
    const html = JSON.stringify(element);
    expect(html).toContain("Last updated");
  });

  it("should contain a contact email link", async () => {
    const mod = await import("../../../src/app/terms/page");
    const element = mod.default();
    const html = JSON.stringify(element);
    expect(html).toContain("mailto:legal@theresalwaysadeal.com");
  });

  it("should use consistent max-w-3xl styling", async () => {
    const mod = await import("../../../src/app/terms/page");
    const element = mod.default();
    expect(element.props.className).toContain("max-w-3xl");
  });

  it("should include a list of prohibited uses in Use of Service section", async () => {
    const mod = await import("../../../src/app/terms/page");
    const element = mod.default();
    const html = JSON.stringify(element);
    expect(html).toContain("Scrape");
    expect(html).toContain("interfere");
  });
});
