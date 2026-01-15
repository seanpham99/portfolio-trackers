import { useState } from "react";
import { usePerformanceData } from "./use-performance-data";
import { PerformanceChart } from "./performance-chart";
import { PerformanceMetricsPanel } from "./performance-metrics";
import { TimeRangeSelector } from "./time-range-selector";
import { usePortfolio } from "@/features/portfolio/hooks/use-portfolios";
import type { TimeRange } from "./analytics.types";
import { Button } from "@workspace/ui/components/button";
import { Plus } from "lucide-react";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyMedia,
} from "@workspace/ui/components/empty";
import Link from "next/link";

interface PerformanceDashboardProps {
  portfolioId: string;
  onAddAsset?: () => void;
}

function PerformanceChartSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-xl bg-zinc-900/50" />
        ))}
      </div>
      <div className="h-100 animate-pulse rounded-xl bg-zinc-900/50" />
    </div>
  );
}

function ErrorCard({ onRetry }: { onRetry: () => void }) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyTitle>Failed to load performance data</EmptyTitle>
        <EmptyDescription>
          There was an error loading your portfolio performance. Please try again.
        </EmptyDescription>
      </EmptyHeader>
      <div className="mt-6 flex justify-center">
        <Button onClick={onRetry} variant="outline">
          Retry
        </Button>
      </div>
    </Empty>
  );
}

export function PerformanceDashboard({ portfolioId, onAddAsset }: PerformanceDashboardProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>("3M");
  const { data: portfolio } = usePortfolio(portfolioId);
  const { data, isLoading, isFetching, isError, refetch } = usePerformanceData(
    portfolioId,
    timeRange
  );

  // Check if portfolio has any holdings
  const hasHoldings = portfolio && portfolio.netWorth > 0;

  if (isLoading) {
    return <PerformanceChartSkeleton />;
  }

  if (isError) {
    return <ErrorCard onRetry={() => refetch()} />;
  }

  // Empty state when no holdings
  if (!hasHoldings) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600/10">
              <Plus className="h-6 w-6 text-emerald-600" />
            </div>
          </EmptyMedia>
          <EmptyTitle>No performance data yet</EmptyTitle>
          <EmptyDescription>
            Add your first transaction to start tracking your portfolio performance over time.
          </EmptyDescription>
        </EmptyHeader>
        <div className="mt-6 flex justify-center gap-3">
          {onAddAsset ? (
            <Button onClick={onAddAsset} className="bg-emerald-600 hover:bg-emerald-500 text-white">
              <Plus className="mr-2 h-4 w-4" /> Add Transaction
            </Button>
          ) : (
            <Link href={`/portfolio/${portfolioId}`}>
              <Button className="bg-emerald-600 hover:bg-emerald-500 text-white">
                <Plus className="mr-2 h-4 w-4" /> Add Transaction
              </Button>
            </Link>
          )}
        </div>
      </Empty>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header with Time Range Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white tracking-tight">Performance</h2>
          <p className="text-sm text-zinc-500">Track your portfolio value over time</p>
        </div>
        <div className="relative">
          <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
          {isFetching && (
            <div className="absolute -right-8 top-1/2 -translate-y-1/2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
            </div>
          )}
        </div>
      </div>

      {/* Metrics Panel */}
      <PerformanceMetricsPanel
        metrics={data.metrics}
        currency={portfolio?.base_currency || "USD"}
      />

      {/* Chart */}
      <PerformanceChart data={data.dataPoints} currency={portfolio?.base_currency || "USD"} />
    </div>
  );
}
