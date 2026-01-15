import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PerformanceDashboard } from "./performance-dashboard";
import { usePerformanceData } from "./use-performance-data";
import { usePortfolio } from "@/features/portfolio/hooks/use-portfolios";
import { AllTheProviders } from "@test/test-utils";

// Mock the hooks
vi.mock("./use-performance-data", () => ({
  usePerformanceData: vi.fn(),
}));

vi.mock("@/features/portfolio/hooks/use-portfolios", () => ({
  usePortfolio: vi.fn(),
}));

describe("PerformanceDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockPortfolio = {
    id: "portfolio-1",
    name: "Test Portfolio",
    base_currency: "USD",
    netWorth: 10000,
  };

  const mockPerformanceData = {
    dataPoints: Array.from({ length: 31 }, (_, i) => ({
      date: new Date(2025, 0, i + 1),
      value: 10000 + Math.random() * 1000,
      changeFromPrevious: Math.random() * 100,
    })),
    metrics: {
      currentValue: 10000,
      totalChange: 500,
      percentageChange: 5.0,
      startValue: 9500,
    },
  };

  it("should show loading skeleton when data is loading", () => {
    vi.mocked(usePortfolio).mockReturnValue({
      data: mockPortfolio,
      isLoading: false,
      isError: false,
    } as any);

    vi.mocked(usePerformanceData).mockReturnValue({
      data: undefined,
      isLoading: true,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    } as any);

    render(<PerformanceDashboard portfolioId="portfolio-1" />, {
      wrapper: AllTheProviders,
    });

    // Should show skeleton loaders
    const skeletons = screen.getAllByRole("generic");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("should show error state when data fails to load", async () => {
    vi.mocked(usePortfolio).mockReturnValue({
      data: mockPortfolio,
      isLoading: false,
      isError: false,
    } as any);

    const refetchMock = vi.fn();
    vi.mocked(usePerformanceData).mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetching: false,
      isError: true,
      refetch: refetchMock,
    } as any);

    render(<PerformanceDashboard portfolioId="portfolio-1" />, {
      wrapper: AllTheProviders,
    });

    // Should show error message
    expect(screen.getByText(/Failed to load performance data/i)).toBeInTheDocument();

    // Should have retry button
    const retryButton = screen.getByRole("button", { name: /retry/i });
    expect(retryButton).toBeInTheDocument();

    // Clicking retry should call refetch
    await userEvent.click(retryButton);
    expect(refetchMock).toHaveBeenCalled();
  });

  it("should show empty state when portfolio has no holdings", () => {
    vi.mocked(usePortfolio).mockReturnValue({
      data: { ...mockPortfolio, netWorth: 0 },
      isLoading: false,
      isError: false,
    } as any);

    vi.mocked(usePerformanceData).mockReturnValue({
      data: mockPerformanceData,
      isLoading: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    } as any);

    render(<PerformanceDashboard portfolioId="portfolio-1" />, {
      wrapper: AllTheProviders,
    });

    // Should show empty state
    expect(screen.getByText(/No performance data yet/i)).toBeInTheDocument();
    expect(screen.getByText(/Add your first transaction to start tracking/i)).toBeInTheDocument();

    // Should have Add Transaction button
    expect(screen.getByRole("button", { name: /Add Transaction/i })).toBeInTheDocument();
  });

  it("should display performance metrics correctly", () => {
    vi.mocked(usePortfolio).mockReturnValue({
      data: mockPortfolio,
      isLoading: false,
      isError: false,
    } as any);

    vi.mocked(usePerformanceData).mockReturnValue({
      data: mockPerformanceData,
      isLoading: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    } as any);

    render(<PerformanceDashboard portfolioId="portfolio-1" />, {
      wrapper: AllTheProviders,
    });

    // Should show current value
    expect(screen.getByText(/Current Value/i)).toBeInTheDocument();
    expect(screen.getByText(/\$10,000\.00/i)).toBeInTheDocument();

    // Should show total change
    expect(screen.getByText(/Total Change/i)).toBeInTheDocument();
    expect(screen.getByText(/\$500\.00/i)).toBeInTheDocument();

    // Should show percentage change
    expect(screen.getByText(/Return \(%\)/i)).toBeInTheDocument();
    expect(screen.getByText(/\+5\.00%/i)).toBeInTheDocument();
  });

  it("should allow time range selection", async () => {
    const user = userEvent.setup();

    vi.mocked(usePortfolio).mockReturnValue({
      data: mockPortfolio,
      isLoading: false,
      isError: false,
    } as any);

    vi.mocked(usePerformanceData).mockReturnValue({
      data: mockPerformanceData,
      isLoading: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    } as any);

    render(<PerformanceDashboard portfolioId="portfolio-1" />, {
      wrapper: AllTheProviders,
    });

    // Should have time range selector tabs
    expect(screen.getByRole("tab", { name: "1M" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "3M" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "6M" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "1Y" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "ALL" })).toBeInTheDocument();

    // Default should be 3M (selected)
    const threeMonthTab = screen.getByRole("tab", { name: "3M" });
    expect(threeMonthTab).toHaveAttribute("aria-selected", "true");

    // Click 1M tab
    const oneMonthTab = screen.getByRole("tab", { name: "1M" });
    await user.click(oneMonthTab);

    // Tab should be selected
    await waitFor(() => {
      expect(oneMonthTab).toHaveAttribute("aria-selected", "true");
    });
  });

  it("should show refresh indicator when fetching", () => {
    vi.mocked(usePortfolio).mockReturnValue({
      data: mockPortfolio,
      isLoading: false,
      isError: false,
    } as any);

    vi.mocked(usePerformanceData).mockReturnValue({
      data: mockPerformanceData,
      isLoading: false,
      isFetching: true, // Background refetch
      isError: false,
      refetch: vi.fn(),
    } as any);

    render(<PerformanceDashboard portfolioId="portfolio-1" />, {
      wrapper: AllTheProviders,
    });

    // Should show spinner during background refetch
    const spinner = document.querySelector(".animate-spin");
    expect(spinner).toBeInTheDocument();
  });

  it("should call onAddAsset when Add Transaction button is clicked in empty state", async () => {
    const user = userEvent.setup();
    const onAddAssetMock = vi.fn();

    vi.mocked(usePortfolio).mockReturnValue({
      data: { ...mockPortfolio, netWorth: 0 },
      isLoading: false,
      isError: false,
    } as any);

    vi.mocked(usePerformanceData).mockReturnValue({
      data: mockPerformanceData,
      isLoading: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    } as any);

    render(<PerformanceDashboard portfolioId="portfolio-1" onAddAsset={onAddAssetMock} />, {
      wrapper: AllTheProviders,
    });

    const addButton = screen.getByRole("button", { name: /Add Transaction/i });
    await user.click(addButton);

    expect(onAddAssetMock).toHaveBeenCalled();
  });
});
