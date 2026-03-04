import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";

let mockAccessToken: string | null = null;

vi.mock("../../src/lib/auth-store", () => ({
  useAuthStore: vi.fn((selector: (state: { accessToken: string | null }) => unknown) =>
    selector({ accessToken: mockAccessToken }),
  ),
}));

vi.mock("../../src/lib/api-client", () => ({
  apiClient: {
    toggleWishlist: vi.fn(),
  },
}));

vi.mock("lucide-react", () => ({
  Heart: function MockHeart(props: Record<string, unknown>) {
    return <span data-testid="heart-icon" {...props} />;
  },
}));

import WishlistButton from "../../src/components/WishlistButton";
import { apiClient } from "../../src/lib/api-client";

const mockToggleWishlist = apiClient.toggleWishlist as ReturnType<typeof vi.fn>;

describe("WishlistButton", () => {
  afterEach(cleanup);

  beforeEach(() => {
    mockAccessToken = null;
    vi.clearAllMocks();
    mockToggleWishlist.mockResolvedValue({ data: { id: 1, gameId: 1, userId: 1, createdAt: "" } });
  });

  it("should render a button element", () => {
    const { container } = render(
      <WishlistButton gameId={1} initialIsWishlisted={false} />,
    );
    expect(container.querySelector("button")).toBeTruthy();
  });

  it("should show outline heart when not wishlisted", () => {
    render(<WishlistButton gameId={1} initialIsWishlisted={false} />);
    const button = screen.getByRole("button");
    expect(button.getAttribute("aria-pressed")).toBe("false");
    expect(button.getAttribute("aria-label")).toBe("Add to wishlist");
  });

  it("should show filled heart when wishlisted", () => {
    render(<WishlistButton gameId={1} initialIsWishlisted={true} />);
    const button = screen.getByRole("button");
    expect(button.getAttribute("aria-pressed")).toBe("true");
    expect(button.getAttribute("aria-label")).toBe("Remove from wishlist");
  });

  it("should show login hint when not authenticated", () => {
    mockAccessToken = null;
    render(<WishlistButton gameId={1} initialIsWishlisted={false} />);
    const button = screen.getByRole("button");
    expect(button.getAttribute("title")).toBe("Log in to add to wishlist");
  });

  it("should not show login hint when authenticated", () => {
    mockAccessToken = "test-token";
    render(<WishlistButton gameId={1} initialIsWishlisted={false} />);
    const button = screen.getByRole("button");
    expect(button.getAttribute("title")).toBeNull();
  });

  it("should not call API when clicking unauthenticated", async () => {
    mockAccessToken = null;
    render(<WishlistButton gameId={1} initialIsWishlisted={false} />);
    fireEvent.click(screen.getByRole("button"));
    expect(mockToggleWishlist).not.toHaveBeenCalled();
  });

  it("should toggle optimistically when authenticated", async () => {
    mockAccessToken = "test-token";
    render(<WishlistButton gameId={1} initialIsWishlisted={false} />);
    const button = screen.getByRole("button");

    fireEvent.click(button);

    expect(button.getAttribute("aria-pressed")).toBe("true");
    expect(button.getAttribute("aria-label")).toBe("Remove from wishlist");
  });

  it("should call toggleWishlist API when authenticated", async () => {
    mockAccessToken = "test-token";
    render(<WishlistButton gameId={42} initialIsWishlisted={false} />);

    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(mockToggleWishlist).toHaveBeenCalledWith(42);
    });
  });

  it("should revert on API error", async () => {
    mockAccessToken = "test-token";
    mockToggleWishlist.mockRejectedValue(new Error("Network error"));

    render(<WishlistButton gameId={1} initialIsWishlisted={false} />);
    const button = screen.getByRole("button");

    fireEvent.click(button);

    // Optimistic: should be true
    expect(button.getAttribute("aria-pressed")).toBe("true");

    // After error: should revert to false
    await waitFor(() => {
      expect(button.getAttribute("aria-pressed")).toBe("false");
    });
  });

  it("should revert wishlisted→not-wishlisted on API error", async () => {
    mockAccessToken = "test-token";
    mockToggleWishlist.mockRejectedValue(new Error("Network error"));

    render(<WishlistButton gameId={1} initialIsWishlisted={true} />);
    const button = screen.getByRole("button");

    fireEvent.click(button);

    expect(button.getAttribute("aria-pressed")).toBe("false");

    await waitFor(() => {
      expect(button.getAttribute("aria-pressed")).toBe("true");
    });
  });

  it("should apply reduced opacity when not authenticated", () => {
    mockAccessToken = null;
    render(<WishlistButton gameId={1} initialIsWishlisted={false} />);
    const button = screen.getByRole("button");
    expect(button.className).toContain("opacity-50");
  });

  it("should accept a custom className", () => {
    render(
      <WishlistButton gameId={1} initialIsWishlisted={false} className="extra" />,
    );
    const button = screen.getByRole("button");
    expect(button.className).toContain("extra");
  });

  it("should be exported as default", () => {
    expect(typeof WishlistButton).toBe("function");
  });

  it("should disable button while API call is in flight", async () => {
    mockAccessToken = "test-token";
    let resolveFn!: (v: unknown) => void;
    mockToggleWishlist.mockReturnValue(new Promise((resolve) => { resolveFn = resolve; }));

    render(<WishlistButton gameId={1} initialIsWishlisted={false} />);
    const button = screen.getByRole("button") as HTMLButtonElement;

    fireEvent.click(button);
    expect(button.disabled).toBe(true);

    resolveFn({ data: { id: 1, gameId: 1, userId: 1, createdAt: "" } });
    await waitFor(() => {
      expect(button.disabled).toBe(false);
    });
  });

  it("should apply fill-current class to heart icon when wishlisted", () => {
    render(<WishlistButton gameId={1} initialIsWishlisted={true} />);
    const icon = screen.getByTestId("heart-icon");
    expect(icon.className).toContain("fill-current");
  });

  it("should not apply fill-current class to heart icon when not wishlisted", () => {
    render(<WishlistButton gameId={1} initialIsWishlisted={false} />);
    const icon = screen.getByTestId("heart-icon");
    expect(icon.className).not.toContain("fill-current");
  });

  it("should not apply cursor-not-allowed when authenticated", () => {
    mockAccessToken = "test-token";
    render(<WishlistButton gameId={1} initialIsWishlisted={false} />);
    const button = screen.getByRole("button");
    expect(button.className).not.toContain("cursor-not-allowed");
  });

  it("should apply cursor-not-allowed when not authenticated", () => {
    mockAccessToken = null;
    render(<WishlistButton gameId={1} initialIsWishlisted={false} />);
    const button = screen.getByRole("button");
    expect(button.className).toContain("cursor-not-allowed");
  });
});
