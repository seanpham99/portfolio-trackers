"use client";

import { useHoldings } from "@/features/portfolio/hooks/use-holdings";
import { useUser } from "@/hooks/use-user";
import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { usePortfolio } from "@/features/portfolio/hooks/use-portfolios";
import { UnifiedHoldingsTable } from "@/features/portfolio/unified-holdings-table";
import { PortfolioHistoryChart } from "@/features/portfolio/portfolio-history-chart";
import { AllocationDonut } from "@/features/portfolio/allocation-donut";
import { StalenessBadge } from "@workspace/ui/components/staleness-badge";
import { useStaleness } from "@/hooks/use-staleness";
import { AddAssetModal } from "@/features/transactions/add-asset-modal";
import { PerformanceDashboard } from "@/features/analytics/performance-dashboard";
import { MetricInfoCard, MetricKeys } from "@/features/metrics";
import { Button } from "@workspace/ui/components/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@workspace/ui/components/tabs";
import {
  ChevronLeft,
  AlertCircle,
  Plus,
  TrendingUp,
  TrendingDown,
  Wallet,
  BarChart3,
  PieChart,
  List,
} from "lucide-react";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyMedia,
} from "@workspace/ui/components/empty";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui/components/breadcrumb";

export default function PortfolioDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { data: response, isLoading, isError, refresh, isRefetching } = usePortfolio(id);
  const { data: user } = useUser();
  const { data: holdings } = useHoldings();
  const portfolio = response?.data;
  const { isStale, label } = useStaleness(response?.meta?.staleness);

  const [isAddAssetOpen, setIsAddAssetOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-24 bg-muted rounded-xl" />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="h-64 bg-muted rounded-xl lg:col-span-2" />
            <div className="h-64 bg-muted rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !portfolio) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </EmptyMedia>
            <EmptyTitle>Portfolio not found</EmptyTitle>
            <EmptyDescription>
              The portfolio you are looking for does not exist or you do not have permission to view
              it.
            </EmptyDescription>
          </EmptyHeader>
          <div className="mt-6 flex justify-center">
            <Link href="/dashboard">
              <Button variant="outline">
                <ChevronLeft className="mr-2 h-4 w-4" /> Back to Dashboard
              </Button>
            </Link>
          </div>
        </Empty>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: portfolio.base_currency,
    }).format(value);
  };

  // Calculate total gain/loss
  const totalGain = portfolio.totalGain ?? 0;
  const isPositive = totalGain >= 0;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto max-w-7xl px-6 py-5">
          {/* Breadcrumb */}
          <Breadcrumb className="mb-4">
            <BreadcrumbList className="text-sm">
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link
                    href="/dashboard"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Dashboard
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="text-muted-foreground/50" />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-foreground font-medium">
                  {portfolio.name}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Portfolio Info Row */}
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="flex items-center gap-4">
              {/* Portfolio Icon */}
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-linear-to-br from-primary/20 to-primary/5 text-primary ring-1 ring-primary/20">
                <Wallet className="h-6 w-6" />
              </div>

              {/* Portfolio Details */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-foreground tracking-tight">
                    {portfolio.name}
                  </h1>
                  {/* TODO: max assets should be fetched from the backend not hardcoded */}
                  {user?.subscription_tier === "free" && (
                    <span className="text-sm text-muted-foreground">
                      ({holdings?.data?.length || 0}/20 assets)
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {portfolio.description || "Multi-asset investment portfolio"}
                </p>
                <StalenessBadge
                  isStale={isStale}
                  label={label}
                  onRefresh={refresh}
                  isRefreshing={isRefetching}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Net Worth & Action */}
            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className="flex items-center justify-end gap-1 mb-1">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                    Net Worth
                  </p>
                  <MetricInfoCard metricKey={MetricKeys.NET_WORTH} iconSize="sm" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-foreground tabular-nums">
                    {formatCurrency(portfolio.netWorth)}
                  </span>
                  <span
                    className={`flex items-center gap-0.5 text-sm font-medium ${isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}
                  >
                    {isPositive ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    {isPositive ? "+" : ""}
                    {formatCurrency(totalGain)}
                    <MetricInfoCard metricKey={MetricKeys.TOTAL_GAIN} iconSize="sm" />
                  </span>
                </div>
              </div>

              <Button
                onClick={() => setIsAddAssetOpen(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm font-medium gap-2"
              >
                <Plus className="h-4 w-4" /> Add Asset
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-7xl">
          <Tabs defaultValue="overview" className="space-y-6">
            {/* Tab Navigation */}
            <TabsList className="bg-muted/50 border border-border p-1 rounded-lg h-auto">
              <TabsTrigger
                value="overview"
                className="rounded-md px-4 py-2 text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="performance"
                className="rounded-md px-4 py-2 text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm gap-2"
              >
                <TrendingUp className="h-4 w-4" />
                Performance
              </TabsTrigger>
              <TabsTrigger
                value="holdings"
                className="rounded-md px-4 py-2 text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm gap-2"
              >
                <List className="h-4 w-4" />
                Holdings
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent
              value="overview"
              className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300"
            >
              {/* Charts Row */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* History Chart */}
                <div className="lg:col-span-2 rounded-xl border border-border bg-card overflow-hidden">
                  <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    <h3 className="font-medium text-foreground">Portfolio History</h3>
                  </div>
                  <div className="p-1">
                    <PortfolioHistoryChart portfolioId={id} />
                  </div>
                </div>

                {/* Allocation Donut */}
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
                    <PieChart className="h-4 w-4 text-primary" />
                    <h3 className="font-medium text-foreground">Allocation</h3>
                  </div>
                  <div className="p-4 flex items-center justify-center">
                    <AllocationDonut portfolioId={id} allocation={portfolio?.allocation} />
                  </div>
                </div>
              </div>

              {/* Holdings Table */}
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <UnifiedHoldingsTable portfolioId={id} onAddAsset={() => setIsAddAssetOpen(true)} />
              </div>
            </TabsContent>

            {/* Performance Tab */}
            <TabsContent
              value="performance"
              className="rounded-xl border border-border bg-card p-6 animate-in fade-in slide-in-from-bottom-2 duration-300"
            >
              <PerformanceDashboard portfolioId={id} onAddAsset={() => setIsAddAssetOpen(true)} />
            </TabsContent>

            {/* Holdings Tab */}
            <TabsContent
              value="holdings"
              className="rounded-xl border border-border bg-card overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300"
            >
              <UnifiedHoldingsTable portfolioId={id} onAddAsset={() => setIsAddAssetOpen(true)} />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Add Asset Modal */}
      <AddAssetModal
        isOpen={isAddAssetOpen}
        onClose={() => setIsAddAssetOpen(false)}
        stageId="all"
        portfolioId={id}
      />
    </div>
  );
}
