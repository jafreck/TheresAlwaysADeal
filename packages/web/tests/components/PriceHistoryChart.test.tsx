import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";

// Mock recharts to render testable HTML elements
vi.mock("recharts", () => ({
  LineChart: ({ children, ...props }: any) => (
    <div data-testid="line-chart">{children}</div>
  ),
  Line: (props: any) => (
    <div data-testid="line" data-name={props.name} data-datakey={props.dataKey} />
  ),
  XAxis: (props: any) => <div data-testid="x-axis" />,
  YAxis: (props: any) => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ReferenceLine: (props: any) => (
    <div data-testid="reference-line" data-y={props.y} />
  ),
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
}));

import PriceHistoryChart from "../../src/components/PriceHistoryChart";
import type { PriceHistoryEntry } from "../../src/components/PriceHistoryChart";

const sampleEntries: PriceHistoryEntry[] = [
  { storeListingId: "store-1", price: 59.99, recordedAt: "2025-01-01T00:00:00Z" },
  { storeListingId: "store-1", price: 49.99, recordedAt: "2025-03-01T00:00:00Z" },
  { storeListingId: "store-1", price: 29.99, recordedAt: "2025-06-01T00:00:00Z" },
  { storeListingId: "store-2", price: 54.99, recordedAt: "2025-01-01T00:00:00Z" },
  { storeListingId: "store-2", price: 39.99, recordedAt: "2025-03-01T00:00:00Z" },
  { storeListingId: "store-2", price: 34.99, recordedAt: "2025-06-01T00:00:00Z" },
];

const storeNames: Record<string, string> = {
  "store-1": "Steam",
  "store-2": "GOG",
};

describe("PriceHistoryChart", () => {
  afterEach(() => {
    cleanup();
  });

  it("should be a function (React component)", () => {
    expect(typeof PriceHistoryChart).toBe("function");
  });

  it("should render a LineChart", () => {
    render(<PriceHistoryChart entries={sampleEntries} storeNames={storeNames} />);
    expect(screen.getByTestId("line-chart")).toBeDefined();
  });

  it("should render a line for each store", () => {
    render(<PriceHistoryChart entries={sampleEntries} storeNames={storeNames} />);
    const lines = screen.getAllByTestId("line");
    expect(lines.length).toBe(2);
  });

  it("should render store names as line names", () => {
    render(<PriceHistoryChart entries={sampleEntries} storeNames={storeNames} />);
    const lines = screen.getAllByTestId("line");
    const names = lines.map((l) => l.getAttribute("data-name"));
    expect(names).toContain("Steam");
    expect(names).toContain("GOG");
  });

  it("should render a ReferenceLine for the all-time low", () => {
    render(<PriceHistoryChart entries={sampleEntries} storeNames={storeNames} />);
    const ref = screen.getByTestId("reference-line");
    expect(ref.getAttribute("data-y")).toBe("29.99");
  });

  it("should render date range selector buttons (3M, 6M, 1Y, All)", () => {
    render(<PriceHistoryChart entries={sampleEntries} storeNames={storeNames} />);
    expect(screen.getByText("3M")).toBeDefined();
    expect(screen.getByText("6M")).toBeDefined();
    expect(screen.getByText("1Y")).toBeDefined();
    expect(screen.getByText("All")).toBeDefined();
  });

  it("should default to 'All' range (All button has active style)", () => {
    render(<PriceHistoryChart entries={sampleEntries} storeNames={storeNames} />);
    const allButton = screen.getByText("All");
    expect(allButton.className).toContain("bg-primary");
  });

  it("should render toggleable checkboxes for each store", () => {
    render(<PriceHistoryChart entries={sampleEntries} storeNames={storeNames} />);
    const checkboxes = screen.getAllByRole("checkbox") as HTMLInputElement[];
    expect(checkboxes.length).toBe(2);
    expect(checkboxes[0].checked).toBe(true);
  });

  it("should render store names next to checkboxes", () => {
    render(<PriceHistoryChart entries={sampleEntries} storeNames={storeNames} />);
    expect(screen.getByText("Steam")).toBeDefined();
    expect(screen.getByText("GOG")).toBeDefined();
  });

  it("should render XAxis and YAxis", () => {
    render(<PriceHistoryChart entries={sampleEntries} storeNames={storeNames} />);
    expect(screen.getByTestId("x-axis")).toBeDefined();
    expect(screen.getByTestId("y-axis")).toBeDefined();
  });

  it("should accept a custom className", () => {
    const { container } = render(
      <PriceHistoryChart entries={sampleEntries} storeNames={storeNames} className="custom" />,
    );
    expect((container.firstChild as HTMLElement).className).toContain("custom");
  });

  it("should not render ReferenceLine when entries is empty", () => {
    render(<PriceHistoryChart entries={[]} storeNames={{}} />);
    expect(screen.queryByTestId("reference-line")).toBeNull();
  });

  it("should not render lines when entries is empty", () => {
    render(<PriceHistoryChart entries={[]} storeNames={{}} />);
    expect(screen.queryAllByTestId("line").length).toBe(0);
  });

  it("should hide a line when its checkbox is unchecked", () => {
    render(<PriceHistoryChart entries={sampleEntries} storeNames={storeNames} />);
    const checkboxes = screen.getAllByRole("checkbox") as HTMLInputElement[];
    expect(screen.getAllByTestId("line").length).toBe(2);

    fireEvent.click(checkboxes[0]);

    expect(screen.getAllByTestId("line").length).toBe(1);
  });
});
