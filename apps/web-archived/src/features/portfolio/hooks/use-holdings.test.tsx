import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useHoldings } from "./use-holdings";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as client from "@/api/client";

// Mock client
vi.mock("@/api/client", () => ({
  getPortfolioHoldings: vi.fn(),
  getAllHoldings: vi.fn(),
  getPortfolios: vi.fn(),
  apiFetch: vi.fn(),
}));

const createWrapper = () => {
  const queryClient = new QueryClient();
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  Wrapper.displayName = "Wrapper";
  return Wrapper;
};

describe("useHoldings", () => {
  it("should fetch holdings for specific portfolio", async () => {
    const portfolioId = "123";
    const mockHoldings = [{ asset_symbol: "AAPL", quantity: 10 }];
    (client.getPortfolioHoldings as any).mockResolvedValue(mockHoldings);

    // we pass portfolioId now
    const { result } = renderHook(() => useHoldings(portfolioId), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.getPortfolioHoldings).toHaveBeenCalledWith(portfolioId);
    expect(result.current.data).toEqual(mockHoldings);
  });

  it("should fetch all holdings if portfolioId is missing", async () => {
    (client.getAllHoldings as any).mockResolvedValue([]);

    const { result } = renderHook(() => useHoldings(undefined), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.getAllHoldings).toHaveBeenCalled();
  });
});
