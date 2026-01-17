import { useQuery, useMutation } from "@tanstack/react-query";
import { discoverAssets, submitAssetRequest, type DiscoveredAsset } from "@/api/client";
import { DiscoverableAssetClass } from "@workspace/shared-types/database";

/**
 * Hook to discover assets from external providers (Yahoo Finance, CoinGecko)
 * Only triggers when both query and assetClass are provided
 */
export const useDiscoverAssets = (query: string, assetClass: DiscoverableAssetClass | null) => {
  return useQuery({
    queryKey: ["assets", "discover", query, assetClass],
    queryFn: () => {
      if (!assetClass) {
        return Promise.resolve([]);
      }
      return discoverAssets(query, assetClass);
    },
    enabled: query.length >= 1 && assetClass !== null,
    staleTime: 60 * 1000, // 60 seconds - matches backend cache TTL
    retry: 1, // Only retry once for external API calls
  });
};

/**
 * Mutation hook to submit an asset tracking request
 */
export const useSubmitAssetRequest = () => {
  return useMutation({
    mutationFn: ({ symbol, assetClass }: { symbol: string; assetClass: DiscoverableAssetClass }) =>
      submitAssetRequest(symbol, assetClass),
  });
};

export { DiscoverableAssetClass };
export type { DiscoveredAsset };
