import { describe, it, expect, vi } from "vitest";
import { screen, render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router";
import PortfolioDetail from "@/routes/_protected._layout.portfolio.$id._index";

// Mock the hooks
vi.mock("@/features/portfolio/hooks/use-portfolios", () => ({
  usePortfolio: vi.fn(),
}));

import { usePortfolio } from "@/features/portfolio/hooks/use-portfolios";

vi.mock("@/features/portfolio/unified-holdings-table", () => ({
  UnifiedHoldingsTable: () => (
    <div data-testid="holdings-table">Holdings Table</div>
  ),
}));

vi.mock("@/features/portfolio/portfolio-history-chart", () => ({
  PortfolioHistoryChart: () => <div>Chart</div>,
}));

vi.mock("@/features/portfolio/allocation-donut", () => ({
  AllocationDonut: () => <div>Donut</div>,
}));

vi.mock("@/features/transactions/add-asset-modal", () => ({
  AddAssetModal: () => <div>Add Asset Modal</div>,
}));

describe("Portfolio Detail Page", () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });

  it("renders 404/Empty when portfolio not found", () => {
    // Mock usePortfolio to return error or empty
    (usePortfolio as any).mockReturnValue({
      data: null,
      isLoading: false,
      isError: true,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/portfolio/999"]}>
          <Routes>
            <Route path="/portfolio/:id" element={<PortfolioDetail />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(screen.getByText(/Portfolio not found/i)).toBeInTheDocument();
  });

  it("renders portfolio details and holdings table when found", () => {
    // Mock successful portfolio fetch
    (usePortfolio as any).mockReturnValue({
      data: {
        id: "123",
        name: "My Growth Portfolio",
        base_currency: "USD",
        netWorth: 50000,
      },
      isLoading: false,
      isError: false,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/portfolio/123"]}>
          <Routes>
            <Route path="/portfolio/:id" element={<PortfolioDetail />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(
      screen.getByRole("heading", { name: "My Growth Portfolio" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("holdings-table")).toBeInTheDocument();
  });
});
