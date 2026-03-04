import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/image", () => ({
  default: function MockImage(props: Record<string, unknown>) {
    return { type: "img", props, key: null };
  },
}));

const mockGet = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api-client", () => ({
  apiClient: { get: mockGet },
}));

import SimilarGames from "../../src/components/SimilarGames";

const mockGames = [
  {
    id: 1,
    title: "Game One",
    slug: "game-one",
    description: "Desc one",
    headerImageUrl: "https://cdn.example.com/one.jpg",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: 2,
    title: "Game Two",
    slug: "game-two",
    description: "Desc two",
    headerImageUrl: "https://cdn.example.com/two.jpg",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: 3,
    title: "Current Game",
    slug: "current-game",
    description: "Desc current",
    headerImageUrl: "https://cdn.example.com/current.jpg",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
];

describe("SimilarGames", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should be a function", () => {
    expect(typeof SimilarGames).toBe("function");
  });

  it("should return null when genreSlugs is empty", async () => {
    const result = await SimilarGames({
      genreSlugs: [],
      currentGameId: "3",
    });
    expect(result).toBeNull();
  });

  it("should return null when API call fails", async () => {
    mockGet.mockRejectedValueOnce(new Error("Network error"));
    const result = await SimilarGames({
      genreSlugs: ["action"],
      currentGameId: "3",
    });
    expect(result).toBeNull();
  });

  it("should return null when no similar games found after filtering", async () => {
    mockGet.mockResolvedValueOnce({
      data: [mockGames[2]],
      meta: { total: 1, page: 1, limit: 5, hasNext: false },
    });
    const result = await SimilarGames({
      genreSlugs: ["action"],
      currentGameId: "3",
    });
    expect(result).toBeNull();
  });

  it("should render a section with games", async () => {
    mockGet.mockResolvedValueOnce({
      data: mockGames,
      meta: { total: 3, page: 1, limit: 5, hasNext: false },
    });
    const result = await SimilarGames({
      genreSlugs: ["action"],
      currentGameId: "3",
    });
    expect(result).not.toBeNull();
    expect(result!.type).toBe("section");
  });

  it("should filter out the current game", async () => {
    mockGet.mockResolvedValueOnce({
      data: mockGames,
      meta: { total: 3, page: 1, limit: 5, hasNext: false },
    });
    const result = await SimilarGames({
      genreSlugs: ["action"],
      currentGameId: "3",
    });
    const grid = result!.props.children[1];
    const cards = grid.props.children;
    expect(cards).toHaveLength(2);
  });

  it("should render at most 4 GameCard components", async () => {
    const manyGames = Array.from({ length: 6 }, (_, i) => ({
      id: i + 10,
      title: `Game ${i}`,
      slug: `game-${i}`,
      description: null,
      headerImageUrl: `https://cdn.example.com/${i}.jpg`,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    }));
    mockGet.mockResolvedValueOnce({
      data: manyGames,
      meta: { total: 6, page: 1, limit: 5, hasNext: false },
    });
    const result = await SimilarGames({
      genreSlugs: ["rpg"],
      currentGameId: "999",
    });
    const grid = result!.props.children[1];
    const cards = grid.props.children;
    expect(cards.length).toBeLessThanOrEqual(4);
  });

  it("should apply custom className", async () => {
    mockGet.mockResolvedValueOnce({
      data: [mockGames[0]],
      meta: { total: 1, page: 1, limit: 5, hasNext: false },
    });
    const result = await SimilarGames({
      genreSlugs: ["action"],
      currentGameId: "99",
      className: "my-class",
    });
    expect(result!.props.className).toContain("my-class");
  });

  it("should call the API with genre parameter", async () => {
    mockGet.mockResolvedValueOnce({
      data: [],
      meta: { total: 0, page: 1, limit: 5, hasNext: false },
    });
    await SimilarGames({
      genreSlugs: ["action", "rpg"],
      currentGameId: "1",
    });
    expect(mockGet).toHaveBeenCalledWith(
      `/api/v1/games?genre=${encodeURIComponent("action,rpg")}&limit=5`,
    );
  });
});
