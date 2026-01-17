import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, TrendingUp, Info } from "lucide-react";

import { mapToTradingViewSymbol } from "@/features/asset/utils/symbol-mapper";
import { getAsset } from "@/api/client";
import { MetricInfoCard, MetricKeys } from "@/features/metrics";

import { LazyAssetChart } from "@/features/asset/components/lazy-asset-chart";

import { createClient } from "@/lib/supabase/server";

interface AssetPageProps {
  params: Promise<{ symbol: string }>;
}

export default async function AssetPage({ params }: AssetPageProps) {
  const { symbol } = await params;
  const decodedSymbol = decodeURIComponent(symbol);

  // Get session token for authenticated request
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;

  // Fetch authoritative asset data from database
  const asset = await getAsset(decodedSymbol, token);

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
    <div className="min-h-screen bg-zinc-950 p-4 lg:p-6">
      <div className="mx-auto max-w-[1920px] grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Header - Compact Row */}
        <header className="col-span-1 lg:col-span-12 flex flex-col items-start justify-between gap-4 border-b border-white/5 pb-4 md:flex-row md:items-center">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="group flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-400 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            </Link>

            <div className="flex items-center gap-3">
              <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight text-white">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
                {asset.symbol}
              </h1>
              <span className="h-4 w-px bg-zinc-800" />
              <p className="flex items-center gap-2 text-sm text-zinc-400">
                {asset.name_en}
                <span className="text-zinc-600">/</span>
                <span className="text-zinc-500">{asset.name_local || asset.sector}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-md border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-1 text-xs font-medium text-emerald-500">
              {asset.asset_class}
            </div>
            {asset.market && (
              <div className="flex items-center gap-1.5 rounded-md border border-blue-500/20 bg-blue-500/5 px-2.5 py-1 text-xs font-medium text-blue-500">
                {asset.market}
              </div>
            )}
            {asset.exchange && (
              <div className="flex items-center gap-1.5 rounded-md border border-purple-500/20 bg-purple-500/5 px-2.5 py-1 text-xs font-medium text-purple-500">
                {asset.exchange}
              </div>
            )}
          </div>
        </header>

        {/* Main Chart Section - Takes up 9/12 cols */}
        <section className="col-span-1 lg:col-span-9 flex flex-col gap-4">
          {/* Chart Toolbar/Header */}
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-semibold text-white">Price Performance</h2>
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <Info className="h-3.5 w-3.5" />
              <span>Real-time data via TradingView</span>
            </div>
          </div>

          {/* Chart Container */}
          <div className="relative h-[600px] w-full overflow-hidden rounded-xl border border-white/5 bg-zinc-900/30 shadow-inner">
            <LazyAssetChart symbol={tradingViewSymbol} />
          </div>
        </section>

        {/* Analytics Sidebar - Takes up 3/12 cols */}
        <section className="col-span-1 lg:col-span-3 flex flex-col gap-4">
          <h2 className="px-1 text-sm font-semibold text-white">Key Metrics</h2>

          <div className="space-y-3">
            {/* Moving Average Card */}
            <div className="group rounded-xl border border-white/5 bg-zinc-900/30 p-4 transition-colors hover:border-emerald-500/20 hover:bg-zinc-900/50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium text-zinc-200">Moving Avg</span>
                </div>
                <MetricInfoCard metricKey={MetricKeys.DAILY_CHANGE} iconSize="sm" />
              </div>
              <p className="text-xs leading-relaxed text-zinc-400">Trend smoothing indicator.</p>
            </div>

            {/* RSI Card */}
            <div className="group rounded-xl border border-white/5 bg-zinc-900/30 p-4 transition-colors hover:border-blue-500/20 hover:bg-zinc-900/50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                    <span className="text-[10px] font-bold">RSI</span>
                  </div>
                  <span className="text-sm font-medium text-zinc-200">RSI</span>
                </div>
                <MetricInfoCard metricKey={MetricKeys.ASSET_GAIN} iconSize="sm" />
              </div>
              <p className="text-xs leading-relaxed text-zinc-400">
                Momentum: &gt;70 Overbought, &lt;30 Oversold.
              </p>
            </div>

            {/* MACD Card */}
            <div className="group rounded-xl border border-white/5 bg-zinc-900/30 p-4 transition-colors hover:border-purple-500/20 hover:bg-zinc-900/50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500">
                    <div className="relative h-4 w-4">
                      <div className="absolute top-1 left-0 right-0 h-px bg-current rotate-45" />
                      <div className="absolute bottom-1 left-0 right-0 h-px bg-current -rotate-45" />
                    </div>
                  </div>
                  <span className="text-sm font-medium text-zinc-200">MACD</span>
                </div>
                <MetricInfoCard metricKey={MetricKeys.MARKET_VALUE} iconSize="sm" />
              </div>
              <p className="text-xs leading-relaxed text-zinc-400">Trend-following momentum.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
