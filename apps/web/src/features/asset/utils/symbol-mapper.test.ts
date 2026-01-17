import { describe, it, expect } from "vitest";
import { mapToTradingViewSymbol } from "./symbol-mapper";

describe("mapToTradingViewSymbol", () => {
  describe("CRYPTO assets", () => {
    it("returns SYMBOLUSDT for crypto without suffix", () => {
      expect(mapToTradingViewSymbol({ symbol: "BTC", asset_class: "CRYPTO" })).toBe("BTCUSDT");
      expect(mapToTradingViewSymbol({ symbol: "ETH", asset_class: "CRYPTO" })).toBe("ETHUSDT");
    });

    it("does not double-add USDT suffix", () => {
      expect(mapToTradingViewSymbol({ symbol: "BTCUSDT", asset_class: "CRYPTO" })).toBe("BTCUSDT");
    });
  });

  describe("US STOCK assets", () => {
    it("uses NASDAQ for NMS exchange", () => {
      expect(
        mapToTradingViewSymbol({
          symbol: "AAPL",
          asset_class: "STOCK",
          market: "US",
          exchange: "NMS",
        })
      ).toBe("NASDAQ:AAPL");
    });

    it("uses NYSE for NYQ exchange", () => {
      expect(
        mapToTradingViewSymbol({
          symbol: "IBM",
          asset_class: "STOCK",
          market: "US",
          exchange: "NYQ",
        })
      ).toBe("NYSE:IBM");
    });

    it("falls back to NASDAQ for US market without exchange", () => {
      expect(mapToTradingViewSymbol({ symbol: "XYZ", asset_class: "STOCK", market: "US" })).toBe(
        "NASDAQ:XYZ"
      );
    });
  });

  describe("VN STOCK assets", () => {
    it("uses HOSE exchange", () => {
      expect(
        mapToTradingViewSymbol({
          symbol: "VIC",
          asset_class: "STOCK",
          market: "VN",
          exchange: "HOSE",
        })
      ).toBe("HOSE:VIC");
    });

    it("uses HNX exchange", () => {
      expect(
        mapToTradingViewSymbol({
          symbol: "VN30",
          asset_class: "STOCK",
          market: "VN",
          exchange: "HNX",
        })
      ).toBe("HNX:VN30");
    });

    it("falls back to HOSE for VN market without exchange", () => {
      expect(mapToTradingViewSymbol({ symbol: "ABC", asset_class: "STOCK", market: "VN" })).toBe(
        "HOSE:ABC"
      );
    });
  });
});
