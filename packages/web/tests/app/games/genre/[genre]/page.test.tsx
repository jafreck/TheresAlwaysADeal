import { describe, it, expect, vi, beforeEach } from "vitest";

/* ------------------------------------------------------------------ */
/* Mocks                                                               */
/* ------------------------------------------------------------------ */

vi.mock("next/link", () => ({
  default: function MockLink({ children, href, ...props }: Record<string, unknown>) {
    return { type: "a", props: { href, ...props, children }, key: null };
  },
}));

vi.mock("next/image", () => ({
  default: function MockImage(props: Record<string, unknown>) {
    return { type: "img", props, key: null };
  },
}));

const mockGet = vi.hoisted(() => vi.fn());
const mockGetGenres = vi.hoisted(() => vi.fn());
vi.mock("@/lib/server-api", () => ({
  serverApi: {
    get: mockGet,
    getGenres: mockGetGenres,
  },
}));

/* ------------------------------------------------------------------ */
/* Imports (after mocks)                                               */
/* ------------------------------------------------------------------ */

import GenrePage, {
  generateMetadata,
  generateStaticParams,
  revalidate,
} from "../../../../../src/app/games/genre/[genre]/page";

/* ------------------------------------------------------------------ */
/* Fixtures                                                            */
/* ------------------------------------------------------------------ */

const mockGames = [
  {
    id: 1,
    title: "Dark Souls III",
    slug: "dark-souls-iii",
    description: "An action RPG.",
    headerImageUrl: "https://cdn.example.com/ds3.jpg",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-06-01T00:00:00Z",
  },
  {
    id: 2,
    title: "Elden Ring",
    slug: "elden-ring",
    description: "An open-world action RPG.",
    headerImageUrl: null,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-06-01T00:00:00Z",
  },
];

const mockGenres = [
  { id: "g1", name: "Action", slug: "action" },
  { id: "g2", name: "RPG", slug: "rpg" },
];

function makeParams(genre: string): Promise<{ genre: string }> {
  return Promise.resolve({ genre });
}

function makeSearchParams(params: Record<string, string> = {}): Promise<Record<string, string | undefined>> {
  return Promise.resolve(params);
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function collectAllNodes(node: unknown): unknown[] {
  if (!node || typeof node !== "object") return [];
  const result: unknown[] = [node];
  const n = node as Record<string, unknown>;

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

function collectText(node: unknown): string {
  if (!node) return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (typeof node !== "object") return "";
  const n = node as Record<string, unknown>;
  if (n.props && typeof n.props === "object") {
    const p = n.props as Record<string, unknown>;
    if (Array.isArray(p.children)) {
      return p.children.flat(Infinity).map(collectText).join("");
    }
    if (p.children) return collectText(p.children);
  }
  return "";
}

function findByType(el: unknown, typeName: string): Record<string, unknown>[] {
  const allNodes = collectAllNodes(el);
  return allNodes.filter((n) => {
    if (!n || typeof n !== "object") return false;
    const node = n as Record<string, unknown>;
    return node.type === typeName;
  }) as Record<string, unknown>[];
}

/* ------------------------------------------------------------------ */
/* Tests: revalidate                                                   */
/* ------------------------------------------------------------------ */

describe("revalidate", () => {
  it("should be set to 900 seconds (15 min)", () => {
    expect(revalidate).toBe(900);
  });
});

/* ------------------------------------------------------------------ */
/* Tests: generateStaticParams                                         */
/* ------------------------------------------------------------------ */

describe("generateStaticParams", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return genre slugs from the API", async () => {
    mockGetGenres.mockResolvedValueOnce(mockGenres);

    const params = await generateStaticParams();
    expect(params).toEqual([
      { genre: "action" },
      { genre: "rpg" },
    ]);
  });

  it("should call getGenres with 3600 revalidation", async () => {
    mockGetGenres.mockResolvedValueOnce([]);

    await generateStaticParams();
    expect(mockGetGenres).toHaveBeenCalledWith(3600);
  });

  it("should return empty array when API fails", async () => {
    mockGetGenres.mockRejectedValueOnce(new Error("API down"));

    const params = await generateStaticParams();
    expect(params).toEqual([]);
  });
});

/* ------------------------------------------------------------------ */
/* Tests: generateMetadata                                             */
/* ------------------------------------------------------------------ */

describe("generateMetadata", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return title with genre name in title case", async () => {
    const meta = await generateMetadata({
      params: makeParams("role-playing"),
      searchParams: makeSearchParams(),
    });
    expect(meta.title).toBe("Role Playing Games — Best Deals & Prices");
  });

  it("should return description containing genre name", async () => {
    const meta = await generateMetadata({
      params: makeParams("action"),
      searchParams: makeSearchParams(),
    });
    expect(meta.description).toContain("Action");
    expect(meta.description).toContain("best deals");
  });

  it("should include canonical URL in alternates", async () => {
    const meta = await generateMetadata({
      params: makeParams("rpg"),
      searchParams: makeSearchParams(),
    });
    const alternates = meta.alternates as Record<string, unknown>;
    expect(alternates.canonical).toContain("/games/genre/rpg");
  });

  it("should include openGraph metadata", async () => {
    const meta = await generateMetadata({
      params: makeParams("strategy"),
      searchParams: makeSearchParams(),
    });
    const og = meta.openGraph as Record<string, unknown>;
    expect(og.title).toContain("Strategy");
    expect(og.type).toBe("website");
  });
});

/* ------------------------------------------------------------------ */
/* Tests: GenrePage                                                    */
/* ------------------------------------------------------------------ */

describe("GenrePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render a root div element", async () => {
    mockGet.mockResolvedValueOnce({
      data: mockGames,
      meta: { total: 2, page: 1, limit: 24, hasNext: false },
    });

    const el = await GenrePage({
      params: makeParams("action"),
      searchParams: makeSearchParams(),
    });
    expect(el.type).toBe("div");
  });

  it("should render genre heading in title case", async () => {
    mockGet.mockResolvedValueOnce({
      data: mockGames,
      meta: { total: 2, page: 1, limit: 24, hasNext: false },
    });

    const el = await GenrePage({
      params: makeParams("action"),
      searchParams: makeSearchParams(),
    });
    const text = collectText(el);
    expect(text).toContain("Action Games");
  });

  it("should render breadcrumb with Home, Games, and genre name", async () => {
    mockGet.mockResolvedValueOnce({
      data: mockGames,
      meta: { total: 2, page: 1, limit: 24, hasNext: false },
    });

    const el = await GenrePage({
      params: makeParams("strategy"),
      searchParams: makeSearchParams(),
    });
    const text = collectText(el);
    expect(text).toContain("Home");
    expect(text).toContain("Games");
    expect(text).toContain("Strategy");
  });

  it("should render game cards with links to game detail pages", async () => {
    mockGet.mockResolvedValueOnce({
      data: mockGames,
      meta: { total: 2, page: 1, limit: 24, hasNext: false },
    });

    const el = await GenrePage({
      params: makeParams("action"),
      searchParams: makeSearchParams(),
    });
    const allNodes = collectAllNodes(el);
    const gameLinks = allNodes.filter((n) => {
      if (!n || typeof n !== "object") return false;
      const node = n as Record<string, unknown>;
      const props = node.props as Record<string, unknown> | undefined;
      const href = props?.href as string | undefined;
      return href?.match(/^\/games\/[^/]+$/) && !href.startsWith("/games/genre/");
    });
    expect(gameLinks.length).toBeGreaterThanOrEqual(2);
  });

  it("should render game titles", async () => {
    mockGet.mockResolvedValueOnce({
      data: mockGames,
      meta: { total: 2, page: 1, limit: 24, hasNext: false },
    });

    const el = await GenrePage({
      params: makeParams("action"),
      searchParams: makeSearchParams(),
    });
    const text = collectText(el);
    expect(text).toContain("Dark Souls III");
    expect(text).toContain("Elden Ring");
  });

  it("should render empty state when no games found", async () => {
    mockGet.mockResolvedValueOnce({
      data: [],
      meta: { total: 0, page: 1, limit: 24, hasNext: false },
    });

    const el = await GenrePage({
      params: makeParams("horror"),
      searchParams: makeSearchParams(),
    });
    const text = collectText(el);
    expect(text).toContain("No horror games found");
  });

  it("should render empty state when API fails", async () => {
    mockGet.mockRejectedValueOnce(new Error("API down"));

    const el = await GenrePage({
      params: makeParams("rpg"),
      searchParams: makeSearchParams(),
    });
    const text = collectText(el);
    expect(text).toContain("No rpg games found");
  });

  it("should render pagination when total pages > 1", async () => {
    mockGet.mockResolvedValueOnce({
      data: mockGames,
      meta: { total: 50, page: 1, limit: 24, hasNext: true },
    });

    const el = await GenrePage({
      params: makeParams("action"),
      searchParams: makeSearchParams(),
    });
    const text = collectText(el);
    expect(text).toContain("Page 1 of 3");
    expect(text).toContain("Next");
  });

  it("should not render Previous button on page 1", async () => {
    mockGet.mockResolvedValueOnce({
      data: mockGames,
      meta: { total: 50, page: 1, limit: 24, hasNext: true },
    });

    const el = await GenrePage({
      params: makeParams("action"),
      searchParams: makeSearchParams(),
    });
    const text = collectText(el);
    expect(text).not.toContain("Previous");
  });

  it("should render Previous button on page 2", async () => {
    mockGet.mockResolvedValueOnce({
      data: mockGames,
      meta: { total: 50, page: 2, limit: 24, hasNext: true },
    });

    const el = await GenrePage({
      params: makeParams("action"),
      searchParams: makeSearchParams({ page: "2" }),
    });
    const text = collectText(el);
    expect(text).toContain("Previous");
    expect(text).toContain("Next");
  });

  it("should not render Next button on last page", async () => {
    mockGet.mockResolvedValueOnce({
      data: mockGames,
      meta: { total: 50, page: 3, limit: 24, hasNext: false },
    });

    const el = await GenrePage({
      params: makeParams("action"),
      searchParams: makeSearchParams({ page: "3" }),
    });
    const text = collectText(el);
    expect(text).toContain("Previous");
    expect(text).not.toContain("Next");
  });

  it("should not render pagination when single page", async () => {
    mockGet.mockResolvedValueOnce({
      data: mockGames,
      meta: { total: 2, page: 1, limit: 24, hasNext: false },
    });

    const el = await GenrePage({
      params: makeParams("action"),
      searchParams: makeSearchParams(),
    });
    const text = collectText(el);
    expect(text).not.toContain("Page 1 of");
  });

  it("should default to page 1 for invalid page param", async () => {
    mockGet.mockResolvedValueOnce({
      data: mockGames,
      meta: { total: 2, page: 1, limit: 24, hasNext: false },
    });

    const el = await GenrePage({
      params: makeParams("action"),
      searchParams: makeSearchParams({ page: "abc" }),
    });
    // Should still render normally
    expect(el.type).toBe("div");
    expect(mockGet).toHaveBeenCalledWith(
      expect.stringContaining("page=1"),
      900,
    );
  });

  it("should clamp negative page values to 1", async () => {
    mockGet.mockResolvedValueOnce({
      data: mockGames,
      meta: { total: 2, page: 1, limit: 24, hasNext: false },
    });

    await GenrePage({
      params: makeParams("action"),
      searchParams: makeSearchParams({ page: "-5" }),
    });
    expect(mockGet).toHaveBeenCalledWith(
      expect.stringContaining("page=1"),
      900,
    );
  });

  it("should encode genre slug in API request", async () => {
    mockGet.mockResolvedValueOnce({
      data: [],
      meta: { total: 0, page: 1, limit: 24, hasNext: false },
    });

    await GenrePage({
      params: makeParams("role-playing"),
      searchParams: makeSearchParams(),
    });
    expect(mockGet).toHaveBeenCalledWith(
      expect.stringContaining("genre=role-playing"),
      900,
    );
  });

  it("should render image for games with headerImageUrl", async () => {
    mockGet.mockResolvedValueOnce({
      data: [mockGames[0]],
      meta: { total: 1, page: 1, limit: 24, hasNext: false },
    });

    const el = await GenrePage({
      params: makeParams("action"),
      searchParams: makeSearchParams(),
    });
    const allNodes = collectAllNodes(el);
    const imageNodes = allNodes.filter((n) => {
      if (!n || typeof n !== "object") return false;
      const node = n as Record<string, unknown>;
      const props = node.props as Record<string, unknown> | undefined;
      return props?.src === "https://cdn.example.com/ds3.jpg";
    });
    expect(imageNodes.length).toBeGreaterThanOrEqual(1);
  });

  it("should render 'No image' placeholder for games without headerImageUrl", async () => {
    mockGet.mockResolvedValueOnce({
      data: [mockGames[1]],
      meta: { total: 1, page: 1, limit: 24, hasNext: false },
    });

    const el = await GenrePage({
      params: makeParams("action"),
      searchParams: makeSearchParams(),
    });
    const text = collectText(el);
    expect(text).toContain("No image");
  });

  it("should request correct page and limit from API", async () => {
    mockGet.mockResolvedValueOnce({
      data: mockGames,
      meta: { total: 50, page: 2, limit: 24, hasNext: true },
    });

    await GenrePage({
      params: makeParams("action"),
      searchParams: makeSearchParams({ page: "2" }),
    });
    expect(mockGet).toHaveBeenCalledWith(
      expect.stringContaining("page=2&limit=24"),
      900,
    );
  });
});
