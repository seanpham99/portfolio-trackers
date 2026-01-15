import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getAssetDetails } from "@/api/client";
import { AssetDetailsResponseDto, HoldingDto } from "@workspace/api-types";

export const useAssetDetails = (portfolioId: string, symbol: string) => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ["asset-details", portfolioId, symbol],
    queryFn: () => getAssetDetails(portfolioId, symbol),
    enabled: !!portfolioId && !!symbol,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    initialData: () => {
      // Attempt to hydrate from the holdings cache
      const holdings = queryClient.getQueryData<HoldingDto[]>([
        "holdings",
        portfolioId,
      ]);
      if (holdings) {
        const holding = holdings.find((h) => h.symbol === symbol);
        if (holding) {
          // Construct a partial AssetDetailsResponseDto to avoid loading state
          return {
            details: {
              asset_id: holding.asset_id,
              symbol: holding.symbol,
              name: holding.name,
              asset_class: holding.asset_class,
              market: holding.market,
              currency: holding.currency,
              total_quantity: holding.total_quantity,
              avg_cost: holding.avg_cost,
              // Other fields will be null/zero until the real fetch completes
              current_price: 0,
              current_value: 0,
              total_return_abs: 0,
              total_return_pct: 0,
              unrealized_pl: 0,
              unrealized_pl_pct: 0,
              realized_pl: 0,
              asset_gain: 0,
              fx_gain: 0,
              calculation_method: "WEIGHTED_AVG",
              last_updated: new Date().toISOString(),
            },
            transactions: [], // Transactions will be loaded by the query
          } as AssetDetailsResponseDto;
        }
      }
      return undefined;
    },
  });
};
