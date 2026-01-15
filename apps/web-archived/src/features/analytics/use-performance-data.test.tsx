import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { usePerformanceData } from "./use-performance-data";
import { usePortfolio } from "@/features/portfolio/hooks/use-portfolios";
import { AllTheProviders } from "@test/test-utils";

// Mock the portfolio hook
vi.mock("@/features/portfolio/hooks/use-portfolios", () => ({
  usePortfolio: vi.fn(),
}));

describe("usePerformanceData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should generate performance data for 1 month", async () => {
    // Mock portfolio with net worth
    vi.mocked(usePortfolio).mockReturnValue({
      data: {
        id: "portfolio-1",
        name: "Test Portfolio",
        base_currency: "USD",
        netWorth: 10000,
      },
      isLoading: false,
      isError: false,
    } as any);

    const { result } = renderHook(
      () => usePerformanceData("portfolio-1", "1M"),
      { wrapper: AllTheProviders },
    );

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });

    // Verify data structure
    expect(result.current.data?.dataPoints).toHaveLength(31); // 30 days + today
    expect(result.current.data?.metrics).toMatchObject({
      currentValue: 10000,
      totalChange: expect.any(Number),
      percentageChange: expect.any(Number),
      startValue: expect.any(Number),
    });
  });

  it("should generate performance data for 3 months", async () => {
    vi.mocked(usePortfolio).mockReturnValue({
      data: {
        id: "portfolio-1",
        name: "Test Portfolio",
        base_currency: "USD",
        netWorth: 10000,
      },
      isLoading: false,
      isError: false,
    } as any);

    const { result } = renderHook(
      () => usePerformanceData("portfolio-1", "3M"),
      { wrapper: AllTheProviders },
    );

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });

    expect(result.current.data?.dataPoints).toHaveLength(91); // 90 days + today
  });

  it("should not fetch when portfolio is not loaded", () => {
    vi.mocked(usePortfolio).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    } as any);

    const { result } = renderHook(
      () => usePerformanceData("portfolio-1", "1M"),
      { wrapper: AllTheProviders },
    );

    expect(result.current.data).toBeUndefined();
  });

  it("should calculate metrics correctly", async () => {
    vi.mocked(usePortfolio).mockReturnValue({
      data: {
        id: "portfolio-1",
        name: "Test Portfolio",
        base_currency: "USD",
        netWorth: 10000,
      },
      isLoading: false,
      isError: false,
    } as any);

    const { result } = renderHook(
      () => usePerformanceData("portfolio-1", "1M"),
      { wrapper: AllTheProviders },
    );

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });

    const metrics = result.current.data!.metrics;

    // Current value should match portfolio net worth
    expect(metrics.currentValue).toBe(10000);

    // Total change should be calculated
    expect(typeof metrics.totalChange).toBe("number");

    // Percentage change should be calculated
    expect(typeof metrics.percentageChange).toBe("number");

    // Start value should exist
    expect(metrics.startValue).toBeGreaterThan(0);
  });

  it("should generate data points with correct structure", async () => {
    vi.mocked(usePortfolio).mockReturnValue({
      data: {
        id: "portfolio-1",
        name: "Test Portfolio",
        base_currency: "USD",
        netWorth: 10000,
      },
      isLoading: false,
      isError: false,
    } as any);

    const { result } = renderHook(
      () => usePerformanceData("portfolio-1", "1M"),
      { wrapper: AllTheProviders },
    );

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });

    const firstPoint = result.current.data!.dataPoints[0];

    // Verify data point structure
    expect(firstPoint).toHaveProperty("date");
    expect(firstPoint).toHaveProperty("value");
    expect(firstPoint).toHaveProperty("changeFromPrevious");

    // Date should be a Date object
    expect(firstPoint.date).toBeInstanceOf(Date);

    // Value should be non-negative
    expect(firstPoint.value).toBeGreaterThanOrEqual(0);
  });

  it("should handle different time ranges correctly", async () => {
    vi.mocked(usePortfolio).mockReturnValue({
      data: {
        id: "portfolio-1",
        name: "Test Portfolio",
        base_currency: "USD",
        netWorth: 10000,
      },
      isLoading: false,
      isError: false,
    } as any);

    // Test each time range
    const timeRanges: Array<["1M" | "3M" | "6M" | "1Y" | "ALL", number]> = [
      ["1M", 31],
      ["3M", 91],
      ["6M", 181],
      ["1Y", 366],
      ["ALL", 731],
    ];

    for (const [range, expectedLength] of timeRanges) {
      const { result } = renderHook(
        () => usePerformanceData("portfolio-1", range),
        { wrapper: AllTheProviders },
      );

      await waitFor(() => {
        expect(result.current.data).toBeDefined();
      });

      expect(result.current.data?.dataPoints).toHaveLength(expectedLength);
    }
  });
});
