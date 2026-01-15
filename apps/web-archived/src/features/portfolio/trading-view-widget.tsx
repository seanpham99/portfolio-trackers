import React, { useEffect, useRef, memo } from "react";

function TradingViewWidget({ symbol }: { symbol: string }) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;

    // Clean up previous widget
    container.current.innerHTML = "";

    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    const getTradingViewSymbol = () => {
      if (symbol.includes(":")) return symbol;

      // Smart mapping based on project conventions (can be expanded)
      const s = symbol.toUpperCase();

      // If it looks like a crypto (ends in USDT, BTC, ETH)
      if (s.endsWith("USDT") || s.endsWith("BTC") || s.endsWith("ETH")) {
        return `BINANCE:${s}USDT`;
      }

      // Default to NASDAQ for demo if not specified
      return `NASDAQ:${s}`;
    };

    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: getTradingViewSymbol(),
      interval: "D",
      timezone: "Etc/UTC",
      theme: "dark",
      style: "1",
      locale: "en",
      allow_symbol_change: true,
      calendar: false,
      support_host: "https://www.tradingview.com",
    });

    container.current.appendChild(script);
  }, [symbol]);

  return (
    <div
      className="tradingview-widget-container h-full w-full"
      ref={container}
    />
  );
}

export default memo(TradingViewWidget);
