import { useQuery } from "@tanstack/react-query";
import { getPortfolioHoldings, getAllHoldings } from "@/api/client";

export const useHoldings = (portfolioId?: string) => {
  return useQuery({
    queryKey: ["holdings", portfolioId || "all"],
    queryFn: () =>
      portfolioId ? getPortfolioHoldings(portfolioId) : getAllHoldings(),
    refetchInterval: 60000,
  });
};
