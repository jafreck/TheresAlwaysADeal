import { describe, it, expect } from "vitest";
import BestPriceCard from "../../src/components/BestPriceCard";
import PriceBadge from "../../src/components/PriceBadge";
import DiscountBadge from "../../src/components/DiscountBadge";
import BuyButton from "../../src/components/BuyButton";

const baseProps = {
  storeName: "Steam",
  storeUrl: "https://store.steampowered.com/app/123",
  currentPrice: 29.99,
  originalPrice: 59.99,
  discount: 50,
  isAllTimeLow: false,
  referralParam: "ref=taad",
};

function collectAll(element: any): any[] {
  const results: any[] = [];
  function walk(el: any) {
    if (!el || typeof el !== "object") return;
    results.push(el);
    const children = el.props?.children;
    if (Array.isArray(children)) children.forEach(walk);
    else if (children && typeof children === "object") walk(children);
  }
  walk(element);
  return results;
}

function findByType(element: any, type: string | Function): any[] {
  return collectAll(element).filter((el) => el.type === type);
}

function findTextContent(element: any): string[] {
  const texts: string[] = [];
  function walk(el: any) {
    if (typeof el === "string") {
      texts.push(el);
      return;
    }
    if (!el || typeof el !== "object") return;
    const children = el.props?.children;
    if (typeof children === "string") texts.push(children);
    else if (Array.isArray(children)) children.forEach(walk);
    else if (children && typeof children === "object") walk(children);
  }
  walk(element);
  return texts;
}

describe("BestPriceCard", () => {
  it("should be a function (React component)", () => {
    expect(typeof BestPriceCard).toBe("function");
  });

  it("should render the store name", () => {
    const element = BestPriceCard(baseProps);
    const texts = findTextContent(element);
    expect(texts).toContain("Steam");
  });

  it("should render PriceBadge with current and original price", () => {
    const element = BestPriceCard(baseProps);
    const badges = findByType(element, PriceBadge);
    expect(badges.length).toBeGreaterThanOrEqual(1);
    const badge = badges[0];
    expect(badge.props.currentPrice).toBe(29.99);
    expect(badge.props.originalPrice).toBe(59.99);
  });

  it("should render DiscountBadge when discount > 0", () => {
    const element = BestPriceCard(baseProps);
    const badges = findByType(element, DiscountBadge);
    expect(badges.length).toBe(1);
    expect(badges[0].props.discount).toBe(50);
  });

  it("should not render DiscountBadge when discount is 0", () => {
    const element = BestPriceCard({ ...baseProps, discount: 0 });
    const badges = findByType(element, DiscountBadge);
    expect(badges.length).toBe(0);
  });

  it("should render an All-time low badge when isAllTimeLow is true", () => {
    const element = BestPriceCard({ ...baseProps, isAllTimeLow: true });
    const texts = findTextContent(element);
    expect(texts).toContain("All-time low");
  });

  it("should not render an All-time low badge when isAllTimeLow is false", () => {
    const element = BestPriceCard({ ...baseProps, isAllTimeLow: false });
    const texts = findTextContent(element);
    expect(texts).not.toContain("All-time low");
  });

  it("should render BuyButton with href constructed by appending referralParam to storeUrl", () => {
    const element = BestPriceCard(baseProps);
    const buttons = findByType(element, BuyButton);
    expect(buttons.length).toBe(1);
    expect(buttons[0].props.href).toBe(
      "https://store.steampowered.com/app/123?ref=taad",
    );
  });

  it("should use & separator when storeUrl already has query params", () => {
    const element = BestPriceCard({
      ...baseProps,
      storeUrl: "https://store.example.com/app/123?foo=bar",
    });
    const buttons = findByType(element, BuyButton);
    expect(buttons[0].props.href).toBe(
      "https://store.example.com/app/123?foo=bar&ref=taad",
    );
  });

  it("should accept a custom className", () => {
    const element = BestPriceCard({ ...baseProps, className: "custom" });
    expect(element.props.className).toContain("custom");
  });

  it("should pass storeName to BuyButton", () => {
    const element = BestPriceCard(baseProps);
    const buttons = findByType(element, BuyButton);
    expect(buttons[0].props.storeName).toBe("Steam");
  });

  it("should render 'Best Price' heading", () => {
    const element = BestPriceCard(baseProps);
    const texts = findTextContent(element);
    expect(texts).toContain("Best Price");
  });

  it("should not render DiscountBadge when discount is negative", () => {
    const element = BestPriceCard({ ...baseProps, discount: -5 });
    const badges = findByType(element, DiscountBadge);
    expect(badges.length).toBe(0);
  });

  it("should pass w-full className to BuyButton", () => {
    const element = BestPriceCard(baseProps);
    const buttons = findByType(element, BuyButton);
    expect(buttons[0].props.className).toBe("w-full");
  });

  it("should render PriceBadge with originalPrice prop", () => {
    const element = BestPriceCard({ ...baseProps, originalPrice: 79.99 });
    const badges = findByType(element, PriceBadge);
    expect(badges[0].props.originalPrice).toBe(79.99);
  });

  it("should render DiscountBadge when discount is exactly 1", () => {
    const element = BestPriceCard({ ...baseProps, discount: 1 });
    const badges = findByType(element, DiscountBadge);
    expect(badges.length).toBe(1);
    expect(badges[0].props.discount).toBe(1);
  });
});
