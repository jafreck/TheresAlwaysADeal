import { describe, it, expect, vi, beforeEach } from "vitest";

/* ------------------------------------------------------------------ */
/* Mocks                                                               */
/* ------------------------------------------------------------------ */

const mockNotFound = vi.hoisted(() => vi.fn());
const mockRedirect = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ notFound: mockNotFound, redirect: mockRedirect }));

vi.mock("next/image", () => ({
  default: function MockImage(props: Record<string, unknown>) {
    return { type: "img", props, key: null };
  },
}));

const mockGetGameBySlug = vi.hoisted(() => vi.fn());
const mockGetPriceHistory = vi.hoisted(() => vi.fn());

const MockApiError = vi.hoisted(() => {
  class ApiError extends Error {
    status: number;
    statusText: string;
    body: unknown;
    constructor(status: number, statusText: string, body: unknown) {
      super(`API error ${status}: ${statusText}`);
      this.name = "ApiError";
      this.status = status;
      this.statusText = statusText;
      this.body = body;
    }
  }
  return ApiError;
});

vi.mock("@/lib/api-client", () => ({
  apiClient: {
    getGameBySlug: mockGetGameBySlug,
    getPriceHistory: mockGetPriceHistory,
  },
  ApiError: MockApiError,
}));

vi.mock("@/components/GameBreadcrumb", () => ({
  default: function MockGameBreadcrumb(props: Record<string, unknown>) {
    return { type: "GameBreadcrumb", props, key: null };
  },
}));

vi.mock("@/components/ReadMoreDescription", () => ({
  default: function MockReadMore(props: Record<string, unknown>) {
    return { type: "ReadMoreDescription", props, key: null };
  },
}));

vi.mock("@/components/BestPriceCard", () => ({
  default: function MockBestPriceCard(props: Record<string, unknown>) {
    return { type: "BestPriceCard", props, key: null };
  },
}));

vi.mock("@/components/PriceComparisonTable", () => ({
  default: function MockPriceComparisonTable(
    props: Record<string, unknown>,
  ) {
    return { type: "PriceComparisonTable", props, key: null };
  },
}));

vi.mock("@/components/PriceHistoryChart", () => ({
  default: function MockPriceHistoryChart(props: Record<string, unknown>) {
    return { type: "PriceHistoryChart", props, key: null };
  },
  toChartEntries: (entries: unknown[]) =>
    entries.map((e: Record<string, unknown>) => ({
      storeListingId: String(e.storeListingId),
      price: Number(e.price),
      recordedAt: e.recordedAt,
    })),
}));

vi.mock("@/components/WishlistButton", () => ({
  default: function MockWishlistButton(props: Record<string, unknown>) {
    return { type: "WishlistButton", props, key: null };
  },
}));

vi.mock("@/components/PriceAlertModal", () => ({
  default: function MockPriceAlertModal(props: Record<string, unknown>) {
    return { type: "PriceAlertModal", props, key: null };
  },
}));

vi.mock("@/components/SimilarGames", () => ({
  default: function MockSimilarGames(props: Record<string, unknown>) {
    return { type: "SimilarGames", props, key: null };
  },
}));

vi.mock("@/components/AdSlot", () => ({
  default: function MockAdSlot(props: Record<string, unknown>) {
    return { type: "AdSlot", props, key: null };
  },
}));

/* ------------------------------------------------------------------ */
/* Imports (after mocks)                                               */
/* ------------------------------------------------------------------ */

import GameDetailPage, {
  generateMetadata,
} from "../../../../src/app/games/[slug]/page";

/* ------------------------------------------------------------------ */
/* Fixtures                                                            */
/* ------------------------------------------------------------------ */

const mockGame = {
  id: 42,
  title: "Portal 2",
  slug: "portal-2",
  description: "A puzzle-platform video game developed by Valve.",
  headerImageUrl: "https://cdn.example.com/portal2.jpg",
  steamAppId: "620",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-06-01T00:00:00Z",
  storeListings: [
    {
      id: 100,
      storeId: 1,
      storeName: "Steam",
      storeSlug: "steam",
      storeUrl: "https://store.steampowered.com/app/620",
      isActive: true,
      isAllTimeLow: true,
    },
    {
      id: 101,
      storeId: 2,
      storeName: "GOG",
      storeSlug: "gog",
      storeUrl: "https://gog.com/game/portal_2",
      isActive: true,
      isAllTimeLow: false,
    },
  ],
  priceStats: [
    {
      id: 1,
      storeListingId: 100,
      currentPrice: "4.99",
      lowestPrice: "0.99",
      highestPrice: "19.99",
      averagePrice: "9.99",
      lastCheckedAt: "2024-06-01T12:00:00Z",
    },
    {
      id: 2,
      storeListingId: 101,
      currentPrice: "9.99",
      lowestPrice: "4.99",
      highestPrice: "19.99",
      averagePrice: "14.99",
      lastCheckedAt: "2024-06-01T12:00:00Z",
    },
  ],
};

const mockPriceHistory = [
  {
    id: 1,
    storeListingId: 100,
    price: "4.99",
    originalPrice: "19.99",
    currency: "USD",
    discount: 75,
    saleEndsAt: null,
    recordedAt: "2024-06-01T00:00:00Z",
  },
];

function makeParams(slug: string): Promise<{ slug: string }> {
  return Promise.resolve({ slug });
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function collectAllNodes(node: unknown): unknown[] {
  if (!node || typeof node !== "object") return [];
  const result: unknown[] = [node];
  const n = node as Record<string, unknown>;

  // If node type is a mock function, call it to resolve the rendered output
  if (typeof n.type === "function" && n.props) {
    try {
      const rendered = (n.type as (p: unknown) => unknown)(n.props);
      result.push(...collectAllNodes(rendered));
    } catch {
      // ignore render errors
    }
  }

  if (n.props && typeof n.props === "object") {
    const p = n.props as Record<string, unknown>;
    if (Array.isArray(p.children)) {
      for (const c of p.children.flat(Infinity)) {
        result.push(...collectAllNodes(c));
      }
    } else if (p.children) {
      result.push(...collectAllNodes(p.children));
    }
  }
  return result;
}

/** Get the type name for a React element (handles both string tags and function components). */
function getTypeName(node: unknown): string | undefined {
  if (!node || typeof node !== "object") return undefined;
  const n = node as Record<string, unknown>;
  if (typeof n.type === "string") return n.type;
  if (typeof n.type === "function") return (n.type as { name?: string }).name;
  return undefined;
}

function findByType(el: unknown, typeName: string): Record<string, unknown> | undefined {
  const allNodes = collectAllNodes(el);
  return allNodes.find(
    (n) => n && typeof n === "object" && getTypeName(n) === typeName,
  ) as Record<string, unknown> | undefined;
}

/* ------------------------------------------------------------------ */
/* Tests: generateMetadata                                             */
/* ------------------------------------------------------------------ */

describe("generateMetadata", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return game title and description when game exists", async () => {
    mockGetGameBySlug.mockResolvedValueOnce({ data: mockGame });
    const meta = await generateMetadata({ params: makeParams("portal-2") });
    expect(meta.title).toBe("Portal 2");
    // generateMetaDescription extracts first sentence
    expect(meta.description).toBe("A puzzle-platform video game developed by Valve.");
  });

  it("should return 'Game Not Found' title when game does not exist", async () => {
    mockGetGameBySlug.mockRejectedValueOnce(new Error("404"));
    const meta = await generateMetadata({ params: makeParams("no-game") });
    expect(meta.title).toBe("Game Not Found");
  });

  it("should include openGraph images when headerImageUrl is present", async () => {
    mockGetGameBySlug.mockResolvedValueOnce({ data: mockGame });
    const meta = await generateMetadata({ params: makeParams("portal-2") });
    const og = meta.openGraph as Record<string, unknown>;
    expect(og.images).toEqual([{ url: mockGame.headerImageUrl }]);
  });

  it("should return empty openGraph images when headerImageUrl is null", async () => {
    mockGetGameBySlug.mockResolvedValueOnce({
      data: { ...mockGame, headerImageUrl: null },
    });
    const meta = await generateMetadata({ params: makeParams("portal-2") });
    const og = meta.openGraph as Record<string, unknown>;
    expect(og.images).toEqual([]);
  });

  it("should truncate long description at sentence or word boundary", async () => {
    const longDesc = "A".repeat(200);
    mockGetGameBySlug.mockResolvedValueOnce({
      data: { ...mockGame, description: longDesc },
    });
    const meta = await generateMetadata({ params: makeParams("portal-2") });
    expect(meta.description!.length).toBeLessThanOrEqual(160);
  });

  it("should use fallback description when description is null", async () => {
    mockGetGameBySlug.mockResolvedValueOnce({
      data: { ...mockGame, description: null },
    });
    const meta = await generateMetadata({ params: makeParams("portal-2") });
    expect(meta.description).toContain("best deals for Portal 2");
  });

  it("should extract first sentence ending with exclamation mark", async () => {
    mockGetGameBySlug.mockResolvedValueOnce({
      data: { ...mockGame, description: "Amazing game! You should definitely play it." },
    });
    const meta = await generateMetadata({ params: makeParams("portal-2") });
    expect(meta.description).toBe("Amazing game!");
  });

  it("should extract first sentence ending with question mark", async () => {
    mockGetGameBySlug.mockResolvedValueOnce({
      data: { ...mockGame, description: "Ready to play? This game is incredible." },
    });
    const meta = await generateMetadata({ params: makeParams("portal-2") });
    expect(meta.description).toBe("Ready to play?");
  });

  it("should return short description as-is when no sentence end and <= 160 chars", async () => {
    const shortDesc = "A great game with no sentence ending";
    mockGetGameBySlug.mockResolvedValueOnce({
      data: { ...mockGame, description: shortDesc },
    });
    const meta = await generateMetadata({ params: makeParams("portal-2") });
    expect(meta.description).toBe(shortDesc);
  });

  it("should truncate at word boundary with ellipsis when description exceeds 160 chars", async () => {
    // Build a long description with spaces so word boundary truncation kicks in
    const words = Array.from({ length: 40 }, (_, i) => `word${i}`).join(" ");
    expect(words.length).toBeGreaterThan(160);
    mockGetGameBySlug.mockResolvedValueOnce({
      data: { ...mockGame, description: words },
    });
    const meta = await generateMetadata({ params: makeParams("portal-2") });
    expect(meta.description!.endsWith("...")).toBe(true);
    expect(meta.description!.length).toBeLessThanOrEqual(160);
    // The text before "..." should be a complete word (present in original at a word boundary)
    const withoutEllipsis = meta.description!.slice(0, -3);
    const nextChar = words[withoutEllipsis.length];
    expect(nextChar).toBe(" ");
  });

  it("should truncate at 157 chars with ellipsis when no word boundary after char 100", async () => {
    // One continuous string with no spaces → lastSpace will be -1 (< 100)
    const noSpaces = "A".repeat(200);
    mockGetGameBySlug.mockResolvedValueOnce({
      data: { ...mockGame, description: noSpaces },
    });
    const meta = await generateMetadata({ params: makeParams("portal-2") });
    expect(meta.description).toBe("A".repeat(157) + "...");
  });

  it("should fall back to truncation when sentence end is at or beyond position 155", async () => {
    // Place the sentence end well past 155 characters
    const longSentence = "A".repeat(160) + ". More text follows here";
    mockGetGameBySlug.mockResolvedValueOnce({
      data: { ...mockGame, description: longSentence },
    });
    const meta = await generateMetadata({ params: makeParams("portal-2") });
    // Should not extract the sentence (it's beyond 155), should truncate instead
    expect(meta.description!.length).toBeLessThanOrEqual(160);
    expect(meta.description!.endsWith("...")).toBe(true);
  });

  it("should include canonical URL in alternates", async () => {
    mockGetGameBySlug.mockResolvedValueOnce({ data: mockGame });
    const meta = await generateMetadata({ params: makeParams("portal-2") });
    const alternates = meta.alternates as Record<string, unknown>;
    expect(alternates.canonical).toBe("https://theresalwaysadeal.com/games/portal-2");
  });

  it("should include twitter metadata with summary_large_image card", async () => {
    mockGetGameBySlug.mockResolvedValueOnce({ data: mockGame });
    const meta = await generateMetadata({ params: makeParams("portal-2") });
    const twitter = meta.twitter as Record<string, unknown>;
    expect(twitter.card).toBe("summary_large_image");
    expect(twitter.title).toBe("Portal 2");
    expect(twitter.description).toBeDefined();
  });

  it("should include twitter images when headerImageUrl is present", async () => {
    mockGetGameBySlug.mockResolvedValueOnce({ data: mockGame });
    const meta = await generateMetadata({ params: makeParams("portal-2") });
    const twitter = meta.twitter as Record<string, unknown>;
    expect(twitter.images).toEqual([mockGame.headerImageUrl]);
  });

  it("should return empty twitter images when headerImageUrl is null", async () => {
    mockGetGameBySlug.mockResolvedValueOnce({
      data: { ...mockGame, headerImageUrl: null },
    });
    const meta = await generateMetadata({ params: makeParams("portal-2") });
    const twitter = meta.twitter as Record<string, unknown>;
    expect(twitter.images).toEqual([]);
  });
});

/* ------------------------------------------------------------------ */
/* Tests: GameDetailPage                                               */
/* ------------------------------------------------------------------ */

describe("GameDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetPriceHistory.mockResolvedValue({ data: mockPriceHistory });
  });

  it("should call notFound when game is not found", async () => {
    mockGetGameBySlug.mockRejectedValueOnce(new Error("404"));
    mockNotFound.mockImplementation(() => {
      throw new Error("NEXT_NOT_FOUND");
    });
    await expect(
      GameDetailPage({ params: makeParams("bad-slug") }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(mockNotFound).toHaveBeenCalled();
  });

  it("should render a root div element", async () => {
    mockGetGameBySlug.mockResolvedValueOnce({ data: mockGame });
    const el = await GameDetailPage({ params: makeParams("portal-2") });
    expect(el.type).toBe("div");
  });

  it("should include JSON-LD script tag", async () => {
    mockGetGameBySlug.mockResolvedValueOnce({ data: mockGame });
    const el = await GameDetailPage({ params: makeParams("portal-2") });
    const scriptNode = findByType(el, "script");
    expect(scriptNode).toBeDefined();
    const scriptProps = scriptNode!.props as Record<string, unknown>;
    expect(scriptProps.type).toBe("application/ld+json");
    const jsonLd = JSON.parse(
      (scriptProps.dangerouslySetInnerHTML as Record<string, string>).__html,
    );
    expect(jsonLd["@type"]).toBe("Product");
    expect(jsonLd.name).toBe("Portal 2");
  });

  it("should include JSON-LD AggregateOffer with multiple store offers", async () => {
    mockGetGameBySlug.mockResolvedValueOnce({ data: mockGame });
    const el = await GameDetailPage({ params: makeParams("portal-2") });
    const scriptNode = findByType(el, "script")!;
    const jsonLd = JSON.parse(
      (scriptNode.props as Record<string, Record<string, string>>)
        .dangerouslySetInnerHTML.__html,
    );
    expect(jsonLd.offers["@type"]).toBe("AggregateOffer");
    expect(jsonLd.offers.lowPrice).toBe("4.99");
    expect(jsonLd.offers.highPrice).toBe("9.99");
    expect(jsonLd.offers.offerCount).toBe(2);
    expect(jsonLd.offers.offers).toHaveLength(2);
    expect(jsonLd.offers.offers[0]["@type"]).toBe("Offer");
    expect(jsonLd.offers.offers[0].priceCurrency).toBe("USD");
    expect(jsonLd.offers.offers[0].availability).toBe("https://schema.org/InStock");
  });

  it("should render single Offer when only one active listing", async () => {
    const gameOneStore = {
      ...mockGame,
      storeListings: [mockGame.storeListings[0]],
      priceStats: [mockGame.priceStats[0]],
    };
    mockGetGameBySlug.mockResolvedValueOnce({ data: gameOneStore });
    const el = await GameDetailPage({ params: makeParams("portal-2") });
    const scriptNode = findByType(el, "script")!;
    const jsonLd = JSON.parse(
      (scriptNode.props as Record<string, Record<string, string>>)
        .dangerouslySetInnerHTML.__html,
    );
    expect(jsonLd.offers["@type"]).toBe("Offer");
    expect(jsonLd.offers.price).toBe("4.99");
  });

  it("should render GameBreadcrumb", async () => {
    mockGetGameBySlug.mockResolvedValueOnce({ data: mockGame });
    const el = await GameDetailPage({ params: makeParams("portal-2") });
    const breadcrumb = findByType(el, "MockGameBreadcrumb");
    expect(breadcrumb).toBeDefined();
    expect(
      (breadcrumb!.props as Record<string, unknown>).gameTitle,
    ).toBe("Portal 2");
  });

  it("should render hero image when headerImageUrl is present", async () => {
    mockGetGameBySlug.mockResolvedValueOnce({ data: mockGame });
    const el = await GameDetailPage({ params: makeParams("portal-2") });
    const img = findByType(el, "MockImage");
    expect(img).toBeDefined();
    expect((img!.props as Record<string, unknown>).src).toBe(
      mockGame.headerImageUrl,
    );
  });

  it("should not render hero image when headerImageUrl is null", async () => {
    mockGetGameBySlug.mockResolvedValueOnce({
      data: { ...mockGame, headerImageUrl: null },
    });
    const el = await GameDetailPage({ params: makeParams("portal-2") });
    const img = findByType(el, "MockImage");
    expect(img).toBeUndefined();
  });

  it("should render the game title in an h1", async () => {
    mockGetGameBySlug.mockResolvedValueOnce({ data: mockGame });
    const el = await GameDetailPage({ params: makeParams("portal-2") });
    const h1 = findByType(el, "h1");
    expect(h1).toBeDefined();
    expect(
      (h1!.props as Record<string, unknown>).children,
    ).toBe("Portal 2");
  });

  it("should render WishlistButton with game id", async () => {
    mockGetGameBySlug.mockResolvedValueOnce({ data: mockGame });
    const el = await GameDetailPage({ params: makeParams("portal-2") });
    const wb = findByType(el, "MockWishlistButton");
    expect(wb).toBeDefined();
    expect((wb!.props as Record<string, unknown>).gameId).toBe(42);
  });

  it("should render PriceAlertModal with game id and title", async () => {
    mockGetGameBySlug.mockResolvedValueOnce({ data: mockGame });
    const el = await GameDetailPage({ params: makeParams("portal-2") });
    const modal = findByType(el, "MockPriceAlertModal");
    expect(modal).toBeDefined();
    const modalProps = modal!.props as Record<string, unknown>;
    expect(modalProps.gameId).toBe(42);
    expect(modalProps.gameTitle).toBe("Portal 2");
  });

  it("should render ReadMoreDescription when description exists", async () => {
    mockGetGameBySlug.mockResolvedValueOnce({ data: mockGame });
    const el = await GameDetailPage({ params: makeParams("portal-2") });
    const readMore = findByType(el, "MockReadMore");
    expect(readMore).toBeDefined();
    expect(
      (readMore!.props as Record<string, unknown>).description,
    ).toBe(mockGame.description);
  });

  it("should not render ReadMoreDescription when description is null", async () => {
    mockGetGameBySlug.mockResolvedValueOnce({
      data: { ...mockGame, description: null },
    });
    const el = await GameDetailPage({ params: makeParams("portal-2") });
    const readMore = findByType(el, "MockReadMore");
    expect(readMore).toBeUndefined();
  });

  it("should render BestPriceCard with lowest price listing", async () => {
    mockGetGameBySlug.mockResolvedValueOnce({ data: mockGame });
    const el = await GameDetailPage({ params: makeParams("portal-2") });
    const bestPrice = findByType(el, "MockBestPriceCard");
    expect(bestPrice).toBeDefined();
    const bpProps = bestPrice!.props as Record<string, unknown>;
    expect(bpProps.storeName).toBe("Steam");
    expect(bpProps.currentPrice).toBe(4.99);
  });

  it("should render PriceComparisonTable with rows", async () => {
    mockGetGameBySlug.mockResolvedValueOnce({ data: mockGame });
    const el = await GameDetailPage({ params: makeParams("portal-2") });
    const table = findByType(el, "MockPriceComparisonTable");
    expect(table).toBeDefined();
    const rows = (table!.props as Record<string, unknown>).rows as unknown[];
    expect(rows).toHaveLength(2);
  });

  it("should render PriceHistoryChart when history is available", async () => {
    mockGetGameBySlug.mockResolvedValueOnce({ data: mockGame });
    const el = await GameDetailPage({ params: makeParams("portal-2") });
    const chart = findByType(el, "MockPriceHistoryChart");
    expect(chart).toBeDefined();
  });

  it("should not render PriceHistoryChart when history is empty", async () => {
    mockGetGameBySlug.mockResolvedValueOnce({ data: mockGame });
    mockGetPriceHistory.mockResolvedValueOnce({ data: [] });
    const el = await GameDetailPage({ params: makeParams("portal-2") });
    const chart = findByType(el, "MockPriceHistoryChart");
    expect(chart).toBeUndefined();
  });

  it("should render SimilarGames with currentGameId as string", async () => {
    mockGetGameBySlug.mockResolvedValueOnce({ data: mockGame });
    const el = await GameDetailPage({ params: makeParams("portal-2") });
    const similar = findByType(el, "MockSimilarGames");
    expect(similar).toBeDefined();
    const sgProps = similar!.props as Record<string, unknown>;
    expect(sgProps.currentGameId).toBe("42");
    expect(sgProps.genreSlugs).toEqual(["all"]);
  });

  it("should render AdSlot with game-detail-sidebar slotId", async () => {
    mockGetGameBySlug.mockResolvedValueOnce({ data: mockGame });
    const el = await GameDetailPage({ params: makeParams("portal-2") });
    const adSlot = findByType(el, "MockAdSlot");
    expect(adSlot).toBeDefined();
    expect((adSlot!.props as Record<string, unknown>).slotId).toBe(
      "game-detail-sidebar",
    );
  });

  it("should handle missing price stats for a listing gracefully", async () => {
    const gameNoStats = {
      ...mockGame,
      priceStats: [],
    };
    mockGetGameBySlug.mockResolvedValueOnce({ data: gameNoStats });
    const el = await GameDetailPage({ params: makeParams("portal-2") });
    const bestPrice = findByType(el, "MockBestPriceCard");
    expect(bestPrice).toBeUndefined();
  });

  it("should gracefully handle price history API failure", async () => {
    mockGetGameBySlug.mockResolvedValueOnce({ data: mockGame });
    mockGetPriceHistory.mockRejectedValueOnce(new Error("API down"));
    const el = await GameDetailPage({ params: makeParams("portal-2") });
    expect(el.type).toBe("div");
    const chart = findByType(el, "MockPriceHistoryChart");
    expect(chart).toBeUndefined();
  });

  it("should compute discount as 0 when highestPrice is 0", async () => {
    const gameZeroPrice = {
      ...mockGame,
      storeListings: [mockGame.storeListings[0]],
      priceStats: [
        {
          ...mockGame.priceStats[0],
          highestPrice: "0",
          currentPrice: "0",
        },
      ],
    };
    mockGetGameBySlug.mockResolvedValueOnce({ data: gameZeroPrice });
    const el = await GameDetailPage({ params: makeParams("portal-2") });
    const bestPrice = findByType(el, "MockBestPriceCard");
    expect(bestPrice).toBeDefined();
    expect((bestPrice!.props as Record<string, unknown>).discount).toBe(0);
  });

  it("should exclude inactive listings from JSON-LD offers", async () => {
    const gameWithInactive = {
      ...mockGame,
      storeListings: [
        { ...mockGame.storeListings[0], isActive: true },
        { ...mockGame.storeListings[1], isActive: false },
      ],
    };
    mockGetGameBySlug.mockResolvedValueOnce({ data: gameWithInactive });
    const el = await GameDetailPage({ params: makeParams("portal-2") });
    const scriptNode = findByType(el, "script")!;
    const jsonLd = JSON.parse(
      (scriptNode.props as Record<string, Record<string, string>>)
        .dangerouslySetInnerHTML.__html,
    );
    // Only one active listing → plain Offer, not AggregateOffer
    expect(jsonLd.offers["@type"]).toBe("Offer");
    expect(jsonLd.offers.url).toBe("https://store.steampowered.com/app/620");
  });

  it("should set offers to undefined when no active listings exist", async () => {
    const gameAllInactive = {
      ...mockGame,
      storeListings: mockGame.storeListings.map((l) => ({ ...l, isActive: false })),
    };
    mockGetGameBySlug.mockResolvedValueOnce({ data: gameAllInactive });
    const el = await GameDetailPage({ params: makeParams("portal-2") });
    const scriptNode = findByType(el, "script")!;
    const jsonLd = JSON.parse(
      (scriptNode.props as Record<string, Record<string, string>>)
        .dangerouslySetInnerHTML.__html,
    );
    expect(jsonLd.offers).toBeUndefined();
  });

  it("should exclude active listings without matching priceStats from offers", async () => {
    const gameMissingStats = {
      ...mockGame,
      storeListings: [
        { ...mockGame.storeListings[0], isActive: true },
        { ...mockGame.storeListings[1], isActive: true },
      ],
      // Only provide stats for the first listing
      priceStats: [mockGame.priceStats[0]],
    };
    mockGetGameBySlug.mockResolvedValueOnce({ data: gameMissingStats });
    const el = await GameDetailPage({ params: makeParams("portal-2") });
    const scriptNode = findByType(el, "script")!;
    const jsonLd = JSON.parse(
      (scriptNode.props as Record<string, Record<string, string>>)
        .dangerouslySetInnerHTML.__html,
    );
    // Only one listing has matching stats → plain Offer
    expect(jsonLd.offers["@type"]).toBe("Offer");
    expect(jsonLd.offers.price).toBe("4.99");
  });
});

/* ------------------------------------------------------------------ */
/* Tests: fetchGame redirect handling                                  */
/* ------------------------------------------------------------------ */

describe("fetchGame redirect handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetPriceHistory.mockResolvedValue({ data: [] });
  });

  it("should call redirect when API returns 301 with redirect body", async () => {
    mockRedirect.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });
    mockGetGameBySlug.mockRejectedValueOnce(
      new MockApiError(301, "Moved Permanently", { redirect: true, newSlug: "new-slug" }),
    );

    await expect(
      GameDetailPage({ params: makeParams("old-slug") }),
    ).rejects.toThrow("NEXT_REDIRECT");
    expect(mockRedirect).toHaveBeenCalledWith("/games/new-slug");
  });

  it("should call redirect for generateMetadata when API returns 301", async () => {
    mockRedirect.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });
    mockGetGameBySlug.mockRejectedValueOnce(
      new MockApiError(301, "Moved Permanently", { redirect: true, newSlug: "new-slug" }),
    );

    await expect(
      generateMetadata({ params: makeParams("old-slug") }),
    ).rejects.toThrow("NEXT_REDIRECT");
    expect(mockRedirect).toHaveBeenCalledWith("/games/new-slug");
  });

  it("should return null and call notFound when 301 body has no newSlug", async () => {
    mockGetGameBySlug.mockRejectedValueOnce(
      new MockApiError(301, "Moved Permanently", { redirect: true }),
    );
    mockNotFound.mockImplementation(() => {
      throw new Error("NEXT_NOT_FOUND");
    });

    await expect(
      GameDetailPage({ params: makeParams("old-slug") }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(mockRedirect).not.toHaveBeenCalled();
    expect(mockNotFound).toHaveBeenCalled();
  });

  it("should return null and call notFound when 301 body has redirect=false", async () => {
    mockGetGameBySlug.mockRejectedValueOnce(
      new MockApiError(301, "Moved Permanently", { redirect: false, newSlug: "new-slug" }),
    );
    mockNotFound.mockImplementation(() => {
      throw new Error("NEXT_NOT_FOUND");
    });

    await expect(
      GameDetailPage({ params: makeParams("old-slug") }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it("should return null when API returns non-301 ApiError", async () => {
    mockGetGameBySlug.mockRejectedValueOnce(
      new MockApiError(404, "Not Found", { error: "Not found" }),
    );
    mockNotFound.mockImplementation(() => {
      throw new Error("NEXT_NOT_FOUND");
    });

    await expect(
      GameDetailPage({ params: makeParams("missing-game") }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(mockRedirect).not.toHaveBeenCalled();
  });
});
