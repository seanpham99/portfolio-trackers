import { describe, it, expect, vi, beforeEach } from "vitest";
import * as client from "./client";
import { apiFetch } from "@/lib/api";

// Mock apiFetch
vi.mock("@/lib/api", () => ({
  apiFetch: vi.fn(),
  getApiUrl: vi.fn().mockReturnValue("http://localhost:3000"),
  getAuthHeaders: vi
    .fn()
    .mockResolvedValue({ Authorization: "Bearer test-token" }),
}));

describe("API Client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getPortfolios", () => {
    it("should fetch portfolios from /portfolios", async () => {
      const mockPortfolios = [
        { id: "1", name: "Main", netWorth: 1000, change24h: 50 },
      ];
      (apiFetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockPortfolios,
      });

      const result = await client.getPortfolios();

      expect(apiFetch).toHaveBeenCalledWith("/portfolios");
      expect(result).toEqual(mockPortfolios);
    });
  });

  describe("getPortfolioHoldings", () => {
    it("should fetch holdings for a specific portfolio", async () => {
      const portfolioId = "123";
      const mockHoldings = [{ asset_symbol: "AAPL", quantity: 10 }];
      (apiFetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockHoldings,
      });

      const result = await client.getPortfolioHoldings(portfolioId);

      expect(apiFetch).toHaveBeenCalledWith(
        `/portfolios/${portfolioId}/holdings`,
      );
      expect(result).toEqual(mockHoldings);
    });
  });
});
