import { useQuery } from "@tanstack/react-query";
import type { TimeRange, PerformanceData } from "./analytics.types";
import { generateMockPerformanceData } from "@/lib/mockPrices";
import { usePortfolio } from "@/features/portfolio/hooks/use-portfolios";

/**
 * Maps time range to number of days
 */
function getTimeRangeDays(timeRange: TimeRange): number {
  switch (timeRange) {
    case "1M":
      return 30;
    case "3M":
      return 90;
    case "6M":
      return 180;
    case "1Y":
      return 365;
    case "ALL":
      return 730; // 2 years for "all time"
    default:
      return 90;
  }
}

/**
 * Custom hook to fetch performance data for a portfolio
 * Currently uses mock data generation - Story 3-6 will replace with real API
 *
 * @param portfolioId - Portfolio ID to fetch performance for
 * @param timeRange - Time range to fetch (1M, 3M, 6M, 1Y, ALL)
 */
export function usePerformanceData(portfolioId: string, timeRange: TimeRange) {
  // Get current portfolio value
  const { data: portfolio } = usePortfolio(portfolioId);

  return useQuery({
    queryKey: ["portfolio", portfolioId, "performance", timeRange],
    queryFn: (): PerformanceData => {
      const currentValue = portfolio?.netWorth || 0;
      const days = getTimeRangeDays(timeRange);
      const dataPoints = generateMockPerformanceData(currentValue, days);

      // Calculate metrics
      const startValue = dataPoints[0]?.value || 0;
      const totalChange = currentValue - startValue;
      const percentageChange =
        startValue > 0 ? (totalChange / startValue) * 100 : 0;

      return {
        dataPoints,
        metrics: {
          currentValue,
          totalChange,
          percentageChange,
          startValue,
        },
      };
    },
    enabled: !!portfolio, // Only run query when portfolio data is available
    staleTime: 30 * 1000, // 30s - matches backend Redis cache TTL
    refetchInterval: 60 * 1000, // 60s - matches NFR polling requirement
    retry: 3,
  });
}
