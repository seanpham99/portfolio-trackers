import { useQuery } from "@tanstack/react-query";
import { getExchangeRate } from "@/api/client";

export function useExchangeRate(from: string, to: string, date: string, enabled = true) {
  return useQuery({
    queryKey: ["exchange-rate", from, to, date],
    queryFn: async () => {
      if (!from || !to || !date || from === to) return null;
      const data = await getExchangeRate(from, to, date);
      return data.rate;
    },
    enabled: enabled && !!from && !!to && !!date && from !== to,
    staleTime: Infinity, // Historical rates are immutable
    gcTime: Infinity, // Keep in cache as long as possible
    retry: false, // Don't retry if it fails (likely no data)
  });
}
