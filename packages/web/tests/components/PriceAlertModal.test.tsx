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
    createPriceAlert: vi.fn(),
  },
}));

vi.mock("lucide-react", () => ({
  X: function MockX(props: Record<string, unknown>) {
    return <span data-testid="x-icon" {...props} />;
  },
}));

vi.mock("@radix-ui/react-dialog", () => {
  const React = require("react");
  return {
    Root: ({ children, open, onOpenChange }: { children: React.ReactNode; open: boolean; onOpenChange: (v: boolean) => void }) => {
      return <div data-testid="dialog-root" data-open={open} data-onchange={!!onOpenChange}>{children}</div>;
    },
    Portal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    Overlay: ({ className }: { className?: string }) => <div data-testid="dialog-overlay" className={className} />,
    Content: ({ children, className }: { children: React.ReactNode; className?: string }) => (
      <div data-testid="dialog-content" className={className} role="dialog">{children}</div>
    ),
    Title: ({ children, className }: { children: React.ReactNode; className?: string }) => (
      <h2 data-testid="dialog-title" className={className}>{children}</h2>
    ),
    Description: ({ children, className }: { children: React.ReactNode; className?: string }) => (
      <p data-testid="dialog-description" className={className}>{children}</p>
    ),
    Close: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) => (
      asChild ? <>{children}</> : <button>{children}</button>
    ),
  };
});

import PriceAlertModal from "../../src/components/PriceAlertModal";
import { apiClient } from "../../src/lib/api-client";

const mockCreatePriceAlert = apiClient.createPriceAlert as ReturnType<typeof vi.fn>;

describe("PriceAlertModal", () => {
  afterEach(cleanup);

  beforeEach(() => {
    mockAccessToken = null;
    vi.clearAllMocks();
    mockCreatePriceAlert.mockResolvedValue({
      data: { id: 1, gameId: 1, userId: 1, targetPrice: "10.00", isActive: true, createdAt: "" },
    });
  });

  it("should be exported as default", () => {
    expect(typeof PriceAlertModal).toBe("function");
  });

  it("should render a trigger button with 'Set Price Alert' text", () => {
    render(<PriceAlertModal gameId={1} gameTitle="Portal 2" />);
    expect(screen.getByText("Set Price Alert")).toBeTruthy();
  });

  it("should show login hint when not authenticated", () => {
    mockAccessToken = null;
    render(<PriceAlertModal gameId={1} gameTitle="Portal 2" />);
    const trigger = screen.getByText("Set Price Alert");
    expect(trigger.getAttribute("title")).toBe("Log in to set price alerts");
  });

  it("should apply reduced opacity when not authenticated", () => {
    mockAccessToken = null;
    render(<PriceAlertModal gameId={1} gameTitle="Portal 2" />);
    const trigger = screen.getByText("Set Price Alert");
    expect(trigger.className).toContain("opacity-50");
  });

  it("should not open modal when not authenticated", () => {
    mockAccessToken = null;
    render(<PriceAlertModal gameId={1} gameTitle="Portal 2" />);
    fireEvent.click(screen.getByText("Set Price Alert"));
    const root = screen.getByTestId("dialog-root");
    expect(root.getAttribute("data-open")).toBe("false");
  });

  it("should open modal when authenticated", () => {
    mockAccessToken = "test-token";
    render(<PriceAlertModal gameId={1} gameTitle="Portal 2" />);
    fireEvent.click(screen.getByText("Set Price Alert"));
    const root = screen.getByTestId("dialog-root");
    expect(root.getAttribute("data-open")).toBe("true");
  });

  it("should render game title in dialog title", () => {
    render(<PriceAlertModal gameId={1} gameTitle="Portal 2" />);
    expect(screen.getByTestId("dialog-title").textContent).toContain("Portal 2");
  });

  it("should render target price input", () => {
    mockAccessToken = "test-token";
    render(<PriceAlertModal gameId={1} gameTitle="Portal 2" />);
    fireEvent.click(screen.getByText("Set Price Alert"));
    const input = screen.getByLabelText("Target Price (USD)");
    expect(input).toBeTruthy();
    expect(input.getAttribute("type")).toBe("number");
  });

  it("should show validation error for empty target price", async () => {
    mockAccessToken = "test-token";
    render(<PriceAlertModal gameId={1} gameTitle="Portal 2" />);
    fireEvent.click(screen.getByText("Set Price Alert"));
    fireEvent.click(screen.getByText("Create Alert"));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeTruthy();
    });
  });

  it("should call createPriceAlert on valid submission", async () => {
    mockAccessToken = "test-token";
    render(<PriceAlertModal gameId={42} gameTitle="Portal 2" />);
    fireEvent.click(screen.getByText("Set Price Alert"));

    const input = screen.getByLabelText("Target Price (USD)");
    fireEvent.change(input, { target: { value: "9.99" } });
    fireEvent.click(screen.getByText("Create Alert"));

    await waitFor(() => {
      expect(mockCreatePriceAlert).toHaveBeenCalledWith(42, 9.99);
    });
  });

  it("should show success message after successful submission", async () => {
    mockAccessToken = "test-token";
    render(<PriceAlertModal gameId={1} gameTitle="Portal 2" />);
    fireEvent.click(screen.getByText("Set Price Alert"));

    const input = screen.getByLabelText("Target Price (USD)");
    fireEvent.change(input, { target: { value: "9.99" } });
    fireEvent.click(screen.getByText("Create Alert"));

    await waitFor(() => {
      expect(screen.getByRole("status").textContent).toContain("successfully");
    });
  });

  it("should show error message on API failure", async () => {
    mockAccessToken = "test-token";
    mockCreatePriceAlert.mockRejectedValue(new Error("Server error"));

    render(<PriceAlertModal gameId={1} gameTitle="Portal 2" />);
    fireEvent.click(screen.getByText("Set Price Alert"));

    const input = screen.getByLabelText("Target Price (USD)");
    fireEvent.change(input, { target: { value: "9.99" } });
    fireEvent.click(screen.getByText("Create Alert"));

    await waitFor(() => {
      const alerts = screen.getAllByRole("alert");
      const errorAlert = alerts.find((el) =>
        el.textContent?.includes("Failed to create price alert"),
      );
      expect(errorAlert).toBeTruthy();
    });
  });

  it("should accept a custom className", () => {
    render(
      <PriceAlertModal gameId={1} gameTitle="Portal 2" className="extra" />,
    );
    const trigger = screen.getByText("Set Price Alert");
    expect(trigger.className).toContain("extra");
  });

  it("should render dialog description about notification", () => {
    render(<PriceAlertModal gameId={1} gameTitle="Portal 2" />);
    const desc = screen.getByTestId("dialog-description");
    expect(desc.textContent).toContain("notify you when the price drops");
  });

  it("should not show login hint when authenticated", () => {
    mockAccessToken = "test-token";
    render(<PriceAlertModal gameId={1} gameTitle="Portal 2" />);
    const trigger = screen.getByText("Set Price Alert");
    expect(trigger.getAttribute("title")).toBeNull();
  });

  it("should not apply reduced opacity when authenticated", () => {
    mockAccessToken = "test-token";
    render(<PriceAlertModal gameId={1} gameTitle="Portal 2" />);
    const trigger = screen.getByText("Set Price Alert");
    expect(trigger.className).not.toContain("opacity-50");
  });

  it("should render a Create Alert submit button", () => {
    mockAccessToken = "test-token";
    render(<PriceAlertModal gameId={1} gameTitle="Portal 2" />);
    fireEvent.click(screen.getByText("Set Price Alert"));
    expect(screen.getByText("Create Alert")).toBeTruthy();
  });

  it("should render a Cancel button", () => {
    mockAccessToken = "test-token";
    render(<PriceAlertModal gameId={1} gameTitle="Portal 2" />);
    fireEvent.click(screen.getByText("Set Price Alert"));
    expect(screen.getByText("Cancel")).toBeTruthy();
  });

  it("should render a close button with aria-label", () => {
    render(<PriceAlertModal gameId={1} gameTitle="Portal 2" />);
    const closeButton = screen.getByLabelText("Close");
    expect(closeButton).toBeTruthy();
  });
});
