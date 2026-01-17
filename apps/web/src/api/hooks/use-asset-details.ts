import { useQuery } from "@tanstack/react-query";
import { getAssetDetails } from "@/api/client";

export const useAssetDetails = (portfolioId: string, symbol: string) => {
  return useQuery({
    queryKey: ["asset-details", portfolioId, symbol],
    queryFn: () => getAssetDetails(portfolioId, symbol),
    enabled: !!portfolioId && !!symbol,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};
