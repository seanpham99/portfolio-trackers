/**
 * Asset data from database for TradingView symbol mapping.
 */
export interface AssetForChart {
  symbol: string;
  asset_class: string; // "STOCK" | "CRYPTO" from database
  market?: string | null; // "US" | "VN" | null
  exchange?: string | null; // "NYQ" | "NMS" | "HNX" | null
}

/**
 * Maps database exchange codes to TradingView exchange prefixes.
 */
const EXCHANGE_MAP: Record<string, string> = {
  // US Exchanges
  NYQ: "NYSE",
  NMS: "NASDAQ",
  NYSE: "NYSE",
  NASDAQ: "NASDAQ",
  // VN Exchanges
  HNX: "HNX",
  HOSE: "HOSE",
  UPCOM: "UPCOM",
};

/**
 * Maps an asset from the database to a TradingView-compatible symbol.
 *
 * @param asset - Asset data from database
 * @returns TradingView symbol format
 *
 * @example
 * // Crypto: just SYMBOLUSDT (no exchange prefix - works across exchanges)
 * mapToTradingViewSymbol({ symbol: "BTC", asset_class: "CRYPTO" }) // "BTCUSDT"
 *
 * // US Stock: EXCHANGE:SYMBOL
 * mapToTradingViewSymbol({ symbol: "AAPL", asset_class: "STOCK", market: "US", exchange: "NMS" }) // "NASDAQ:AAPL"
 *
 * // VN Stock: EXCHANGE:SYMBOL
 * mapToTradingViewSymbol({ symbol: "VIC", asset_class: "STOCK", market: "VN", exchange: "HOSE" }) // "HOSE:VIC"
 */
export function mapToTradingViewSymbol(asset: AssetForChart): string {
  const { symbol, asset_class, market, exchange } = asset;

  // Crypto: just use SYMBOLUSDT without exchange prefix
  // TradingView will find the best match across exchanges
  if (asset_class === "CRYPTO") {
    const hasSuffix = symbol.includes("USDT") || symbol.includes("USD");
    return hasSuffix ? symbol : `${symbol}USDT`;
  }

  // Stock: use EXCHANGE:SYMBOL format
  if (asset_class === "STOCK" && exchange) {
    const tvExchange = EXCHANGE_MAP[exchange] ?? exchange;
    return `${tvExchange}:${symbol}`;
  }

  // Fallback: try to infer from market
  if (market === "VN") {
    return `HOSE:${symbol}`;
  }
  if (market === "US") {
    return `NASDAQ:${symbol}`;
  }

  // Ultimate fallback: just the symbol
  return symbol;
}
