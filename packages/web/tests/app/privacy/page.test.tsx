import { describe, it, expect } from "vitest";

describe("PrivacyPolicyPage", () => {
  it("should export metadata with title 'Privacy Policy'", async () => {
    const mod = await import("../../../src/app/privacy/page");
    expect(mod.metadata.title).toBe("Privacy Policy");
  });

  it("should export metadata with a description", async () => {
    const mod = await import("../../../src/app/privacy/page");
    expect(mod.metadata.description).toBeDefined();
    expect(typeof mod.metadata.description).toBe("string");
  });

  it("should be a function (React component)", async () => {
    const mod = await import("../../../src/app/privacy/page");
    expect(typeof mod.default).toBe("function");
  });

  it("should render a main element", async () => {
    const mod = await import("../../../src/app/privacy/page");
    const Page = mod.default;
    const element = Page();
    expect(element.type).toBe("main");
  });

  it("should include a Privacy Policy h1 heading", async () => {
    const mod = await import("../../../src/app/privacy/page");
    const element = mod.default();
    const children = element.props.children;
    const h1 = children.find(
      (c: { type: string }) => c?.type === "h1",
    );
    expect(h1).toBeTruthy();
    expect(h1.props.children).toBe("Privacy Policy");
  });

  it("should include a Data We Collect section", async () => {
    const mod = await import("../../../src/app/privacy/page");
    const element = mod.default();
    const sections = element.props.children.filter(
      (c: { type: string }) => c?.type === "section",
    );
    const found = sections.some((s: { props: { children: Array<{ props: { children: string } }> } }) => {
      const h2 = s.props.children[0];
      return h2?.props?.children === "Data We Collect";
    });
    expect(found).toBe(true);
  });

  it("should include a Cookies section", async () => {
    const mod = await import("../../../src/app/privacy/page");
    const element = mod.default();
    const sections = element.props.children.filter(
      (c: { type: string }) => c?.type === "section",
    );
    const found = sections.some((s: { props: { children: Array<{ props: { children: string } }> } }) => {
      const h2 = s.props.children[0];
      return h2?.props?.children === "Cookies";
    });
    expect(found).toBe(true);
  });

  it("should include a Contact section", async () => {
    const mod = await import("../../../src/app/privacy/page");
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

  it("should include a Managing Cookie Consent section", async () => {
    const mod = await import("../../../src/app/privacy/page");
    const element = mod.default();
    const sections = element.props.children.filter(
      (c: { type: string }) => c?.type === "section",
    );
    const found = sections.some((s: { props: { children: Array<{ props: { children: string } }> } }) => {
      const h2 = s.props.children[0];
      return h2?.props?.children === "Managing Cookie Consent";
    });
    expect(found).toBe(true);
  });

  it("should include a Your Rights section", async () => {
    const mod = await import("../../../src/app/privacy/page");
    const element = mod.default();
    const sections = element.props.children.filter(
      (c: { type: string }) => c?.type === "section",
    );
    const found = sections.some((s: { props: { children: Array<{ props: { children: string } }> } }) => {
      const h2 = s.props.children[0];
      return h2?.props?.children === "Your Rights";
    });
    expect(found).toBe(true);
  });

  it("should contain a link to Google Ads Settings", async () => {
    const mod = await import("../../../src/app/privacy/page");
    const element = mod.default();
    const html = JSON.stringify(element);
    expect(html).toContain("https://www.google.com/settings/ads");
  });

  it("should contain a contact email link", async () => {
    const mod = await import("../../../src/app/privacy/page");
    const element = mod.default();
    const html = JSON.stringify(element);
    expect(html).toContain("mailto:privacy@theresalwaysadeal.com");
  });

  it("should include an Advertising & Google AdSense section", async () => {
    const mod = await import("../../../src/app/privacy/page");
    const element = mod.default();
    const html = JSON.stringify(element);
    expect(html).toContain("Google AdSense");
    expect(html).toContain("Advertising");
  });

  it("should have exactly six sections", async () => {
    const mod = await import("../../../src/app/privacy/page");
    const element = mod.default();
    const sections = element.props.children.filter(
      (c: { type: string }) => c?.type === "section",
    );
    expect(sections).toHaveLength(6);
  });

  it("should include a last-updated date", async () => {
    const mod = await import("../../../src/app/privacy/page");
    const element = mod.default();
    const html = JSON.stringify(element);
    expect(html).toContain("Last updated");
  });
});
