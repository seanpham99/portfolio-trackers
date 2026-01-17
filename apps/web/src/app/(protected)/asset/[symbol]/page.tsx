import dynamic from "next/dynamic";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, TrendingUp, Info } from "lucide-react";

import { AssetChartSkeleton } from "@/features/asset/components/asset-chart-skeleton";
import { mapToTradingViewSymbol } from "@/features/asset/utils/symbol-mapper";
import { getAsset } from "@/api/client";
import { MetricInfoCard, MetricKeys } from "@/features/metrics";

// Lazy load the TradingView chart - it's heavy and relies on window
const AssetChart = dynamic(
  () => import("@/features/asset/components/asset-chart").then((mod) => mod.AssetChart),
  {
    ssr: false,
    loading: () => <AssetChartSkeleton />,
  }
);

interface AssetPageProps {
  params: Promise<{ symbol: string }>;
}

export default async function AssetPage({ params }: AssetPageProps) {
  const { symbol } = await params;
  const decodedSymbol = decodeURIComponent(symbol);

  // Fetch authoritative asset data from database
  const asset = await getAsset(decodedSymbol);

  if (!asset) {
    notFound(); // Show 404 if asset doesn't exist in database
  }

  // Map to TradingView symbol using database fields
  const tradingViewSymbol = mapToTradingViewSymbol({
    symbol: asset.symbol,
    asset_class: asset.asset_class,
    market: asset.market,
    exchange: asset.exchange,
  });

  return (
    <div className="min-h-screen space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-surface text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-semibold text-foreground">
              <TrendingUp className="h-6 w-6 text-primary" />
              {asset.symbol}
              <MetricInfoCard metricKey={MetricKeys.MARKET_VALUE} iconSize="sm" />
            </h1>
            <p className="text-sm text-muted-foreground">
              {asset.name_en} • {asset.asset_class}
            </p>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-foreground">Price Chart</h2>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Info className="h-4 w-4" />
            <span>RSI, MACD, and Moving Averages enabled by default</span>
          </div>
        </div>
        <AssetChart symbol={tradingViewSymbol} />
      </section>

      {/* Indicator Legend */}
      <section className="rounded-xl border border-border bg-surface/50 p-4">
        <h3 className="mb-3 text-sm font-medium text-foreground">Technical Indicators</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1">
            <div className="text-sm font-medium text-foreground">Moving Average (MA)</div>
            <p className="text-xs text-muted-foreground">
              Smooths price data to identify trend direction.
            </p>
          </div>
          <div className="space-y-1">
            <div className="text-sm font-medium text-foreground">RSI (Relative Strength Index)</div>
            <p className="text-xs text-muted-foreground">
              Measures momentum; above 70 = overbought, below 30 = oversold.
            </p>
          </div>
          <div className="space-y-1">
            <div className="text-sm font-medium text-foreground">
              MACD (Moving Average Convergence Divergence)
            </div>
            <p className="text-xs text-muted-foreground">
              Shows relationship between two moving averages for trend signals.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
