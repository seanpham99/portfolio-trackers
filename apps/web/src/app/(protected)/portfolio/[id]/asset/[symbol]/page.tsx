"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useAssetDetails } from "@/api/hooks/use-asset-details";
import { usePortfolio } from "@/features/portfolio/hooks/use-portfolios";
import {
  History,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  ChevronLeft,
  Info,
  Clock,
  ExternalLink,
  ChevronRight,
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
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@workspace/ui/components/hover-card";
import TradingViewWidget from "@/features/portfolio/trading-view-widget";

export default function AssetDetailPage() {
  const params = useParams<{ id: string; symbol: string }>();
  const portfolioId = params.id;
  const symbol = params.symbol;

  const { data: portfolio } = usePortfolio(portfolioId);
  const { data: assetData, isLoading, isError } = useAssetDetails(portfolioId, symbol);

  if (isLoading && !assetData) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
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
          className={`mb-4 rounded-full p-4 ${isNoTransactions ? "bg-amber-500/10 text-amber-500" : "bg-rose-500/10 text-rose-500"}`}
        >
          <Info className="h-8 w-8" />
        </div>
        <h2 className="mb-2 text-2xl font-semibold text-white">
          {isNoTransactions ? "No Transactions Found" : "Asset data not found"}
        </h2>
        <p className="mb-6 max-w-md text-zinc-400">
          {isNoTransactions
            ? `You haven't recorded any transactions for ${symbol} in this portfolio yet.`
            : `We couldn't retrieve the details for ${symbol}. It might have been deleted or moved.`}
        </p>
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

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header Section */}
      <div className="border-b border-border bg-surface/40 px-8 py-4 backdrop-blur-md">
        <div className="mx-auto max-w-7xl">
          <Breadcrumb className="mb-4">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/dashboard">Dashboard</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href={`/portfolio/${portfolioId}`}>{portfolio?.name || "Portfolio"}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-emerald-400">{symbol}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 text-2xl font-bold text-emerald-400 shadow-inner ring-1 ring-emerald-500/20">
                {symbol?.[0]}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-3xl font-bold text-foreground tracking-tight">
                    {details.name}
                  </h1>
                  <Badge
                    variant="outline"
                    className="border-border bg-overlay-light text-muted-foreground uppercase tracking-widest text-[10px]"
                  >
                    {details.asset_class}
                  </Badge>
                  {isStale && (
                    <Badge
                      variant="destructive"
                      className="bg-amber-500/10 text-amber-500 border-amber-500/20 flex gap-1"
                    >
                      <Clock className="h-3 w-3" /> Stale
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-1 text-sm">
                  <span className="text-muted-foreground">
                    {symbol} • {details.market}
                  </span>
                  <span className="h-1 w-1 rounded-full bg-border" />
                  <span className="text-muted-foreground font-medium">
                    Last Price: {formatCurrency(details.current_price)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-lg shadow-emerald-600/20">
                Trade on Exchange <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-8">
        <div className="mx-auto max-w-7xl space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Average Cost"
              value={formatCurrency(details.avg_cost)}
              subValue="Weighted Average"
            />
            <StatCard
              label="Asset Gain"
              value={formatCurrency(details.asset_gain)}
              percentage={details.total_return_pct}
              type="dynamic"
            />
            <StatCard label="FX Gain" value={formatCurrency(details.fx_gain)} type="neutral" />
            <StatCard
              label="Realized P/L"
              value={formatCurrency(details.realized_pl || 0)}
              subValue="Total realized from sells"
            />
          </div>

          {/* Chart & History Row */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* TradingView Widget Integration */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              <div className="rounded-2xl border border-border bg-surface-elevated p-0 shadow-xl relative overflow-hidden h-[500px]">
                <div className="flex items-center justify-between p-6 border-b border-border">
                  <h3 className="font-medium text-foreground flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-emerald-400" /> Interactive Chart
                  </h3>
                </div>
                <div className="flex-1 w-full h-full pb-[60px]">
                  <TradingViewWidget symbol={symbol} />
                </div>
              </div>
            </div>

            {/* Transaction History Sidebar */}
            <div className="flex flex-col gap-4">
              <div className="rounded-2xl border border-border bg-surface-elevated p-0 shadow-xl overflow-hidden flex flex-col h-[500px]">
                <div className="flex items-center gap-2 p-5 border-b border-border bg-overlay-light">
                  <History className="h-5 w-5 text-muted-foreground" />
                  <h3 className="font-medium text-foreground">Recent Transactions</h3>
                </div>
                <ScrollArea className="flex-1">
                  <Table>
                    <TableHeader className="bg-overlay-light">
                      <TableRow className="border-border hover:bg-transparent">
                        <TableHead className="text-muted-foreground pl-5">Date</TableHead>
                        <TableHead className="text-muted-foreground">Type</TableHead>
                        <TableHead className="text-muted-foreground text-right pr-5">
                          Amount
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((tx) => (
                        <TableRow
                          key={tx.id}
                          className="border-border hover:bg-overlay-light transition-colors group"
                        >
                          <TableCell className="pl-5 text-muted-foreground text-xs py-4">
                            {new Date(tx.date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex items-center gap-1.5 font-medium text-xs px-2 py-0.5 rounded-full ${
                                tx.type === "BUY"
                                  ? "bg-emerald-500/10 text-emerald-400"
                                  : "bg-rose-500/10 text-rose-400"
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
                            <div className="text-sm font-medium text-foreground">
                              {tx.quantity} units
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              @ {formatCurrency(tx.price)}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
                <Link
                  href={`/portfolio/${portfolioId}/transactions`}
                  className="p-4 text-center text-xs font-medium text-muted-foreground hover:text-emerald-400 border-t border-border bg-overlay-light transition-colors"
                >
                  View full history <ChevronRight className="inline h-3 w-3 ml-1" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  percentage,
  subValue,
  type = "default",
}: {
  label: string;
  value: string;
  percentage?: number;
  subValue?: string;
  type?: "default" | "dynamic" | "neutral";
}) {
  const isPositive = percentage !== undefined && percentage >= 0;

  return (
    <div className="relative group rounded-2xl border border-white/5 bg-zinc-900/50 p-5 shadow-lg transition-all hover:bg-zinc-900/80 hover:border-white/10 overflow-hidden">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-zinc-500 uppercase tracking-tight">{label}</p>
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-white tracking-tight">{value}</span>
      </div>

      {type === "dynamic" && percentage !== undefined && (
        <div
          className={`mt-2 flex items-center gap-1 text-sm font-medium ${isPositive ? "text-emerald-400" : "text-rose-400"}`}
        >
          {isPositive ? (
            <ArrowUpRight className="h-4 w-4" />
          ) : (
            <ArrowDownRight className="h-4 w-4" />
          )}
          {Math.abs(percentage).toFixed(2)}%
        </div>
      )}

      {subValue && <p className="mt-2 text-xs text-zinc-600 font-medium">{subValue}</p>}

      {type === "neutral" && (
        <p className="mt-2 text-xs text-zinc-600 font-medium italic">Breakdown of FX impact</p>
      )}
    </div>
  );
}
