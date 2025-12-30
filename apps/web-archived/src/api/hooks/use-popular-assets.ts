import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/api/client";
import { PopularAssetDto } from "@workspace/api-types";

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
    staleTime: 60 * 60 * 1000, // 1 hour - these don't change often
  });
}
