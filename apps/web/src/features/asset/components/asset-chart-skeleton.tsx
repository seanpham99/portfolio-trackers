"use client";

/**
 * Skeleton loader for the TradingView chart component.
 * Provides a "Calm" UX while the heavy widget is being loaded.
 */
export function AssetChartSkeleton() {
  return (
    <div className="h-[600px] w-full animate-pulse rounded-xl border border-border bg-muted/50">
      <div className="flex h-full flex-col items-center justify-center gap-4">
        {/* Chart icon placeholder */}
        <div className="h-16 w-16 rounded-lg bg-muted" />
        <div className="text-sm text-muted-foreground">Loading chart...</div>
      </div>
    </div>
  );
}
