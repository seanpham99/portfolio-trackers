import { render, screen } from "@testing-library/react";
import { UnifiedHoldingsTable } from "./unified-holdings-table";
import { useHoldings } from "./hooks/use-holdings";
import { vi, describe, it, expect, beforeEach } from "vitest";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router";

// Mock the useHoldings hook
vi.mock("./hooks/use-holdings", () => ({
  useHoldings: vi.fn(),
}));

describe("UnifiedHoldingsTable", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );

  it("renders loading state", () => {
    vi.mocked(useHoldings).mockReturnValue({
      data: [],
      isLoading: true,
    } as any);
    render(<UnifiedHoldingsTable />, { wrapper });
    expect(screen.getByText("Loading holdings...")).toBeInTheDocument();
  });

  it("renders holdings data", () => {
    vi.mocked(useHoldings).mockReturnValue({
      data: [
        {
          asset_id: "1",
          symbol: "AAPL",
          name: "Apple",
          asset_class: "US Equity",
          total_quantity: 10,
          avg_cost: 100,
          market: "US",
        },
      ],
      isLoading: false,
    } as any);
    render(<UnifiedHoldingsTable />, { wrapper });
    expect(screen.getByText("AAPL")).toBeInTheDocument();
    expect(screen.getByText("Apple")).toBeInTheDocument();
    expect(screen.getByText("US Equity")).toBeInTheDocument();
  });

  it("should NOT render expansion chevron column", () => {
    vi.mocked(useHoldings).mockReturnValue({
      data: [
        {
          asset_id: "1",
          symbol: "AAPL",
          name: "Apple",
          asset_class: "US Equity",
          total_quantity: 10,
          avg_cost: 100,
          market: "US",
          calculationMethod: "WEIGHTED_AVG",
          dataSource: "Manual Entry",
        },
      ],
      isLoading: false,
    } as any);
    render(<UnifiedHoldingsTable />, { wrapper });

    // Should NOT have chevron button for row expansion
    const chevronButtons = screen.queryAllByRole("button", {
      name: /methodology/i,
    });
    expect(
      chevronButtons.filter((btn) => btn.querySelector('svg[class*="rotate"]')),
    ).toHaveLength(0);
  });

  it("should render info icon for methodology tooltip", () => {
    vi.mocked(useHoldings).mockReturnValue({
      data: [
        {
          asset_id: "1",
          symbol: "AAPL",
          name: "Apple",
          asset_class: "US Equity",
          total_quantity: 10,
          avg_cost: 100,
          market: "US",
          pl: 50,
          calculationMethod: "WEIGHTED_AVG",
          dataSource: "Manual Entry",
        },
      ],
      isLoading: false,
    });
    render(<UnifiedHoldingsTable />, { wrapper });

    // Should have info icons with aria-label for accessibility
    // One in column header + one per row
    const infoIcons = screen.getAllByLabelText(/view.*methodology/i);
    expect(infoIcons.length).toBeGreaterThan(0);

    // Header tooltip should exist
    const headerTooltip = screen.getByLabelText(
      "View methodology for P/L calculation",
    );
    expect(headerTooltip).toBeInTheDocument();

    // Row tooltip should exist
    const rowTooltip = screen.getByLabelText("View methodology for this asset");
    expect(rowTooltip).toBeInTheDocument();
  });
});
