import { useQuery } from "@tanstack/react-query";
import { getPortfolioHistory } from "@/api/client";
import { PortfolioSnapshotDto } from "@workspace/shared-types/api";

type Range = "1D" | "1W" | "1M" | "3M" | "1Y" | "ALL";

interface UsePortfolioHistoryOptions {
  range?: Range;
  enabled?: boolean;
}

export function usePortfolioHistory(
  portfolioId: string | undefined,
  options: UsePortfolioHistoryOptions = {}
) {
  const { range = "1M", enabled = true } = options;

  return useQuery({
    queryKey: ["portfolio-history", portfolioId, range],
    queryFn: async () => {
      if (!portfolioId) throw new Error("Portfolio ID required");

      const response = await getPortfolioHistory(portfolioId, range);
      return response.data;
    },
    enabled: !!portfolioId && enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes staleness for history
  });
}
