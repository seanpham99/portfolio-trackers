import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPortfolios, getPortfolio, addTransaction, searchAssets } from "@/api/client";
import { TransactionType } from "@workspace/shared-types/api";

export const usePortfolios = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["portfolios"],
    queryFn: () => getPortfolios(),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const refresh = async () => {
    return queryClient.fetchQuery({
      queryKey: ["portfolios"],
      queryFn: () => getPortfolios({ refresh: true }),
    });
  };

  return { ...query, refresh };
};

export const usePortfolio = (id: string) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["portfolio", id],
    queryFn: () => getPortfolio(id),
    enabled: !!id,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const refresh = async () => {
    if (!id) return;
    return queryClient.fetchQuery({
      queryKey: ["portfolio", id],
      queryFn: () => getPortfolio(id, { refresh: true }),
    });
  };

  return { ...query, refresh };
};

export const useSearchAssets = (query: string) => {
  return useQuery({
    queryKey: ["assets", "search", query],
    queryFn: () => searchAssets(query),
    enabled: query.length >= 2,
    staleTime: 5 * 60 * 1000, // Assets don't change often
  });
};

export const useAddTransaction = (portfolioId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (transaction: {
      asset_id: string;
      type: TransactionType;
      quantity: number;
      price: number;
      fee?: number;
      exchange_rate?: number;
      transaction_date?: string;
      notes?: string;
    }) =>
      addTransaction(portfolioId, {
        ...transaction,
        portfolio_id: portfolioId,
      }),
    onSuccess: () => {
      // Invalidate portfolio and holdings queries
      queryClient.invalidateQueries({ queryKey: ["portfolio", portfolioId] });
      queryClient.invalidateQueries({ queryKey: ["holdings", portfolioId] });
      queryClient.invalidateQueries({ queryKey: ["holdings", "all"] });
    },
  });
};
