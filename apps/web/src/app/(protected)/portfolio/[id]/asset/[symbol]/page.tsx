"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useAssetDetails } from "@/api/hooks/use-asset-details";
import { usePortfolio } from "@/features/portfolio/hooks/use-portfolios";
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  ChevronLeft,
  Info,
  Clock,
  ExternalLink,
  ChevronRight,
  DollarSign,
  Percent,
  Wallet,
  Activity,
} from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui/components/breadcrumb";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { ScrollArea } from "@workspace/ui/components/scroll-area";
import TradingViewWidget from "@/features/portfolio/trading-view-widget";
import { MetricInfoCard, MetricKeys, type MetricKey } from "@/features/metrics";

export default function AssetDetailPage() {
  const params = useParams<{ id: string; symbol: string }>();
  const portfolioId = params.id;
  const symbol = params.symbol;

  const { data: portfolioResponse } = usePortfolio(portfolioId);
  const portfolio = portfolioResponse?.data;
  const { data: assetResponse, isLoading, isError } = useAssetDetails(portfolioId, symbol);
  const assetData = assetResponse?.data;

  if (isLoading && !assetData) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground animate-pulse">Loading asset details...</p>
        </div>
      </div>
    );
  }

  if (isError || !assetData) {
    const isNoTransactions = (isError as any)?.message?.includes("No transactions");
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
        <div
          className={`mb-4 rounded-full p-4 ${isNoTransactions ? "bg-amber-500/10 text-amber-500" : "bg-destructive/10 text-destructive"}`}
        >
          <Info className="h-8 w-8" />
        </div>
        <div className="p-6 border border-border rounded-xl mb-6 bg-surface max-w-md">
          <h2 className="mb-2 text-2xl font-semibold text-foreground">
            {isNoTransactions ? "No Transactions Found" : "Asset data not found"}
          </h2>
          <p className="text-muted-foreground">
            {isNoTransactions
              ? `You haven't recorded any transactions for ${symbol} in this portfolio yet.`
              : `We couldn't retrieve the details for ${symbol}. It might have been deleted or moved.`}
          </p>
        </div>
        <Link href={`/portfolio/${portfolioId}`}>
          <Button variant="outline" className="gap-2">
            <ChevronLeft className="h-4 w-4" /> Back to Portfolio
          </Button>
        </Link>
      </div>
    );
  }

  const { details, transactions } = assetData;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: details.currency || "USD",
      minimumFractionDigits: 2,
    }).format(value);
  };

  const isStale = new Date().getTime() - new Date(details.last_updated).getTime() > 3600000;
  const isPositiveReturn = details.total_return_pct >= 0;

  return (
    <div className="flex h-full flex-col">
      {/* Header Section */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm px-6 py-4 sticky top-0 z-10">
        <div className="mx-auto max-w-7xl">
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
                <BreadcrumbLink asChild>
                  <Link
                    href={`/portfolio/${portfolioId}`}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {portfolio?.name || "Portfolio"}
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="text-muted-foreground/50" />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-foreground font-medium">{symbol}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Asset Info Row */}
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="flex items-center gap-4">
              {/* Asset Icon */}
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-linear-to-br from-primary/20 to-primary/5 text-2xl font-bold text-primary ring-1 ring-primary/20">
                {symbol?.[0]}
              </div>

              {/* Asset Details */}
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
                    {details.name}
                    <MetricInfoCard metricKey={MetricKeys.MARKET_VALUE} iconSize="sm" />
                  </h1>
                  <Badge
                    variant="secondary"
                    className="uppercase tracking-wider text-[10px] font-medium"
                  >
                    {details.asset_class}
                  </Badge>
                  {isStale && (
                    <Badge
                      variant="outline"
                      className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 flex gap-1"
                    >
                      <Clock className="h-3 w-3" /> Stale
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="font-mono">{symbol}</span>
                  <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                  <span>{details.market}</span>
                </div>
              </div>
            </div>

            {/* Price & Action */}
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">
                  Current Price
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-foreground tabular-nums">
                    {formatCurrency(details.current_price)}
                  </span>
                  <span
                    className={`flex items-center gap-0.5 text-sm font-medium ${isPositiveReturn ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}
                  >
                    {isPositiveReturn ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    {Math.abs(details.total_return_pct).toFixed(2)}%
                  </span>
                </div>
              </div>

              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-sm gap-2">
                Trade on Exchange <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={<DollarSign className="h-4 w-4" />}
              label="Average Cost"
              metricKey={MetricKeys.COST_BASIS}
              value={formatCurrency(details.avg_cost)}
              subValue="Weighted average per unit"
            />
            <StatCard
              icon={<Activity className="h-4 w-4" />}
              label="Asset Gain"
              metricKey={MetricKeys.ASSET_GAIN}
              value={formatCurrency(details.asset_gain)}
              percentage={details.total_return_pct}
              variant="dynamic"
            />
            <StatCard
              icon={<Percent className="h-4 w-4" />}
              label="FX Gain"
              metricKey={MetricKeys.FX_GAIN}
              value={formatCurrency(details.fx_gain)}
              subValue="Currency impact"
            />
            <StatCard
              icon={<Wallet className="h-4 w-4" />}
              label="Realized P/L"
              metricKey={MetricKeys.REALIZED_PL}
              value={formatCurrency(details.realized_pl || 0)}
              subValue="From closed positions"
            />
          </div>

          {/* Chart & Transactions Row */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Chart Section */}
            <div className="lg:col-span-2 rounded-xl border border-border bg-card overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
                <TrendingUp className="h-4 w-4 text-primary" />
                <h3 className="font-medium text-foreground">Price Chart</h3>
              </div>
              <div className="h-[450px] w-full">
                <TradingViewWidget symbol={symbol} />
              </div>
            </div>

            {/* Transactions */}
            <div className="flex flex-col rounded-xl border border-border bg-card overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
                <Activity className="h-4 w-4 text-primary" />
                <h3 className="font-medium text-foreground">Recent Transactions</h3>
              </div>
              <ScrollArea className="flex-1">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-muted-foreground text-xs pl-5">Date</TableHead>
                      <TableHead className="text-muted-foreground text-xs">Type</TableHead>
                      <TableHead className="text-muted-foreground text-xs text-right pr-5">
                        Details
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx) => (
                      <TableRow
                        key={tx.id}
                        className="border-border hover:bg-muted/50 transition-colors cursor-pointer"
                      >
                        <TableCell className="pl-5 text-muted-foreground text-xs py-3">
                          {new Date(tx.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center gap-1 font-medium text-xs px-2 py-0.5 rounded-full ${
                              tx.type === "BUY"
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                            }`}
                          >
                            {tx.type === "BUY" ? (
                              <ArrowUpRight className="h-3 w-3" />
                            ) : (
                              <ArrowDownRight className="h-3 w-3" />
                            )}
                            {tx.type}
                          </span>
                        </TableCell>
                        <TableCell className="text-right pr-5">
                          <div className="text-sm font-medium text-foreground tabular-nums">
                            {tx.quantity} units
                          </div>
                          <div className="text-xs text-muted-foreground tabular-nums">
                            @ {formatCurrency(tx.price)}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
              <Link
                href="#"
                className="flex items-center justify-center gap-1 p-3 text-xs font-medium text-muted-foreground hover:text-foreground border-t border-border hover:bg-muted/50 transition-colors"
              >
                View full history <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  metricKey?: MetricKey;
  value: string;
  percentage?: number;
  subValue?: string;
  variant?: "default" | "dynamic";
}

function StatCard({
  icon,
  label,
  metricKey,
  value,
  percentage,
  subValue,
  variant = "default",
}: StatCardProps) {
  const isPositive = percentage !== undefined && percentage >= 0;

  return (
    <div className="group relative rounded-xl border border-border bg-card p-5 transition-all duration-200 hover:border-primary/30 hover:shadow-md">
      {/* Icon + Label Row */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
          {label}
          {metricKey && <MetricInfoCard metricKey={metricKey} iconSize="sm" />}
        </p>
      </div>

      {/* Value */}
      <p className="text-2xl font-bold text-foreground tabular-nums tracking-tight">{value}</p>

      {/* Percentage or SubValue */}
      {variant === "dynamic" && percentage !== undefined ? (
        <div
          className={`mt-2 flex items-center gap-1 text-sm font-medium ${isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}
        >
          {isPositive ? (
            <ArrowUpRight className="h-4 w-4" />
          ) : (
            <ArrowDownRight className="h-4 w-4" />
          )}
          {Math.abs(percentage).toFixed(2)}%
        </div>
      ) : subValue ? (
        <p className="mt-2 text-xs text-muted-foreground">{subValue}</p>
      ) : null}
    </div>
  );
}
