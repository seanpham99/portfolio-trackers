import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { usePortfolios } from "./use-portfolios";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as client from "@/api/client";

// Mock client
vi.mock("../client", () => ({
  getPortfolios: vi.fn(),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  Wrapper.displayName = "TestWrapper";
  return Wrapper;
};

describe("usePortfolios", () => {
  it("should fetch portfolios using getPortfolios client method", async () => {
    const mockPortfolios = [
      { id: "1", name: "Test", netWorth: 100, change24h: 5 },
    ];
    (client.getPortfolios as any).mockResolvedValue(mockPortfolios);

    const { result } = renderHook(() => usePortfolios(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.getPortfolios).toHaveBeenCalled();
    expect(result.current.data).toEqual(mockPortfolios);
  });
});
