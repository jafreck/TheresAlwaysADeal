import { describe, it, expect } from "vitest";
import PriceComparisonTable from "../../src/components/PriceComparisonTable";
import type { StoreListingRow } from "../../src/components/PriceComparisonTable";
import BuyButton from "../../src/components/BuyButton";
import PriceBadge from "../../src/components/PriceBadge";
import DiscountBadge from "../../src/components/DiscountBadge";
import StoreIcon from "../../src/components/StoreIcon";

const sampleRows: StoreListingRow[] = [
  {
    storeName: "Steam",
    storeUrl: "https://store.steampowered.com/app/123",
    storeLogoUrl: null,
    currentPrice: 29.99,
    originalPrice: 59.99,
    discount: 50,
    lastChecked: "2025-01-15T12:00:00Z",
    isAllTimeLow: true,
    referralParam: "ref=taad",
  },
  {
    storeName: "GOG",
    storeUrl: "https://gog.com/game/123?lang=en",
    storeLogoUrl: null,
    currentPrice: 34.99,
    originalPrice: 59.99,
    discount: 42,
    lastChecked: "2025-01-14T08:30:00Z",
    isAllTimeLow: false,
    referralParam: "ref=taad",
  },
];

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
    if (typeof el === "number") {
      texts.push(String(el));
      return;
    }
    if (!el || typeof el !== "object") return;
    const children = el.props?.children;
    if (typeof children === "string") texts.push(children);
    else if (typeof children === "number") texts.push(String(children));
    else if (Array.isArray(children)) children.forEach(walk);
    else if (children && typeof children === "object") walk(children);
  }
  walk(element);
  return texts;
}

describe("PriceComparisonTable", () => {
  it("should be a function (React component)", () => {
    expect(typeof PriceComparisonTable).toBe("function");
  });

  it("should render a table element", () => {
    const element = PriceComparisonTable({ rows: sampleRows });
    const tables = findByType(element, "table");
    expect(tables.length).toBe(1);
  });

  it("should render column headers: Store, Price, Original, Discount, Last Checked, Buy", () => {
    const element = PriceComparisonTable({ rows: sampleRows });
    const ths = findByType(element, "th");
    const headers = ths.map((th) => th.props.children);
    expect(headers).toEqual([
      "Store",
      "Price",
      "Original",
      "Discount",
      "Last Checked",
      "Buy",
    ]);
  });

  it("should render one row per store listing", () => {
    const element = PriceComparisonTable({ rows: sampleRows });
    const tbody = findByType(element, "tbody")[0];
    const trs = findByType(tbody, "tr");
    expect(trs.length).toBe(2);
  });

  it("should render store names in rows", () => {
    const element = PriceComparisonTable({ rows: sampleRows });
    const texts = findTextContent(element);
    expect(texts).toContain("Steam");
    expect(texts).toContain("GOG");
  });

  it("should render BuyButton with referralParam appended to storeUrl", () => {
    const element = PriceComparisonTable({ rows: sampleRows });
    const buttons = findByType(element, BuyButton);
    expect(buttons.length).toBe(2);
    const hrefs = buttons.map((b) => b.props.href);
    expect(hrefs).toContain(
      "https://store.steampowered.com/app/123?ref=taad",
    );
    expect(hrefs).toContain("https://gog.com/game/123?lang=en&ref=taad");
  });

  it("should show ATL indicator for rows with isAllTimeLow", () => {
    const element = PriceComparisonTable({ rows: sampleRows });
    const texts = findTextContent(element);
    expect(texts).toContain("ATL");
  });

  it("should format lastChecked as a readable date", () => {
    const element = PriceComparisonTable({ rows: sampleRows });
    const texts = findTextContent(element);
    expect(texts.some((t) => t.includes("Jan") && t.includes("2025"))).toBe(
      true,
    );
  });

  it("should accept a custom className", () => {
    const element = PriceComparisonTable({
      rows: sampleRows,
      className: "custom-table",
    });
    expect(element.props.className).toContain("custom-table");
  });

  it("should render an empty tbody when rows is empty", () => {
    const element = PriceComparisonTable({ rows: [] });
    const tbody = findByType(element, "tbody")[0];
    const trs = findByType(tbody, "tr");
    expect(trs.length).toBe(0);
  });

  it("should render StoreIcon for each row", () => {
    const element = PriceComparisonTable({ rows: sampleRows });
    const icons = findByType(element, StoreIcon);
    expect(icons.length).toBe(2);
    expect(icons[0].props.storeName).toBe("Steam");
    expect(icons[1].props.storeName).toBe("GOG");
  });

  it("should render PriceBadge for current and original price columns", () => {
    const element = PriceComparisonTable({ rows: sampleRows });
    const badges = findByType(element, PriceBadge);
    // 2 rows × 2 PriceBadge columns (Price + Original)
    expect(badges.length).toBe(4);
  });

  it("should render DiscountBadge for each row", () => {
    const element = PriceComparisonTable({ rows: sampleRows });
    const badges = findByType(element, DiscountBadge);
    expect(badges.length).toBe(2);
    expect(badges[0].props.discount).toBe(50);
    expect(badges[1].props.discount).toBe(42);
  });
});
