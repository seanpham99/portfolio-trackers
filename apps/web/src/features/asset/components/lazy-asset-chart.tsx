"use client";

import dynamic from "next/dynamic";
import { AssetChartSkeleton } from "./asset-chart-skeleton";

const AssetChart = dynamic(() => import("./asset-chart").then((mod) => mod.AssetChart), {
  ssr: false,
  loading: () => <AssetChartSkeleton />,
});

interface LazyAssetChartProps {
  symbol: string;
}

export function LazyAssetChart({ symbol }: LazyAssetChartProps) {
  return <AssetChart symbol={symbol} />;
}
