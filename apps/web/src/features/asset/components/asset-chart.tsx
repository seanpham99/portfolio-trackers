"use client";

import { AdvancedRealTimeChart } from "react-ts-tradingview-widgets";
import { useTheme } from "next-themes";

interface AssetChartProps {
  /**
   * The trading symbol in TradingView format (e.g., "BINANCE:BTCUSDT", "NASDAQ:AAPL")
   */
  symbol: string;
}

/**
 * TradingView Advanced Real-Time Chart with professional technical indicators.
 * Includes RSI, MACD, and Moving Averages by default.
 *
 * @remarks
 * This component MUST be lazy-loaded with SSR disabled as it relies on browser APIs.
 */
export function AssetChart({ symbol }: AssetChartProps) {
  const { resolvedTheme } = useTheme();
  const theme = resolvedTheme === "dark" ? "dark" : "light";

  return (
    <div className="h-[600px] w-full overflow-hidden rounded-xl border border-border">
      <AdvancedRealTimeChart
        symbol={symbol}
        theme={theme}
        autosize
        hide_side_toolbar={false}
        allow_symbol_change={false}
        save_image={false}
        details={true}
        hotlist={false}
        calendar={false}
        studies={["MASimple@tv-basicstudies", "RSI@tv-basicstudies", "MACD@tv-basicstudies"]}
        container_id={`tradingview-chart-${symbol.replace(/[^a-zA-Z0-9]/g, "-")}`}
      />
    </div>
  );
}
