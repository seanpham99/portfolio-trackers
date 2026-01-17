import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/api/client";
import { PopularAssetDto } from "@workspace/shared-types/api";

// TODO: Move this logic to backend (GET /assets/popular should return top market cap)
const TOP_ASSETS = ["BTC", "ETH", "AAPL", "NVDA", "TSLA", "MSFT", "GOOGL", "AMZN", "BNB", "SOL"];

export function usePopularAssets() {
  return useQuery({
    queryKey: ["assets", "popular"],
    queryFn: async (): Promise<PopularAssetDto[]> => {
      const res = await apiFetch("/assets/popular");
      if (!res.ok) {
        throw new Error("Failed to fetch popular assets");
      }
      return res.json();
    },
    select: (data) => {
      // Sort: Top assets first, then remaining alphabetical
      return [...data].sort((a, b) => {
        const indexA = TOP_ASSETS.indexOf(a.symbol);
        const indexB = TOP_ASSETS.indexOf(b.symbol);

        // If both are in top list, sort by priority in that list
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        // If only A is in top list, A comes first
        if (indexA !== -1) return -1;
        // If only B is in top list, B comes first
        if (indexB !== -1) return 1;

        // Otherwise alphabetical
        return a.symbol.localeCompare(b.symbol);
      });
    },
    staleTime: 60 * 60 * 1000, // 1 hour - these don't change often
  });
}
