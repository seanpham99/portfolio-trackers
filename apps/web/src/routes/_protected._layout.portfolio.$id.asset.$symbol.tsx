import { useParams, Link } from "react-router";
import { useAssetDetails } from "@/api/hooks/use-asset-details";
import { usePortfolio } from "@/api/hooks/use-portfolios";
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
} from "@repo/ui/components/breadcrumb";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/table";
import { ScrollArea } from "@repo/ui/components/scroll-area";
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@repo/ui/components/hover-card";
import TradingViewWidget from "@/components/asset/trading-view-widget";
import { CalculationMethod } from "@repo/api-types";

export default function AssetDetailPage() {
  const { id: portfolioId, symbol } = useParams<{
    id: string;
    symbol: string;
  }>();
  const { data: portfolio } = usePortfolio(portfolioId!);
  const {
    data: assetData,
    isLoading,
    isError,
  } = useAssetDetails(portfolioId!, symbol!);

  if (isLoading && !assetData) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
          <p className="text-zinc-500 animate-pulse">
            Loading asset details...
          </p>
        </div>
      </div>
    );
  }

  if (isError || !assetData) {
    const isNoTransactions = (isError as any)?.message?.includes(
      "No transactions",
    );
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
        <Link to={`/portfolio/${portfolioId}`}>
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

  const isStale =
    new Date().getTime() - new Date(details.last_updated).getTime() > 3600000; // 1 hour

  return (
    <div className="flex h-full flex-col bg-zinc-950">
      {/* Header Section */}
      <div className="border-b border-white/[0.06] bg-zinc-900/40 px-8 py-4 backdrop-blur-md">
        <div className="mx-auto max-w-7xl">
          <Breadcrumb className="mb-4">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/dashboard">Dashboard</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to={`/portfolio/${portfolioId}`}>
                    {portfolio?.name || "Portfolio"}
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-emerald-400">
                  {symbol}
                </BreadcrumbPage>
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
                  <h1 className="text-3xl font-bold text-white tracking-tight">
                    {details.name}
                  </h1>
                  <Badge
                    variant="outline"
                    className="border-white/10 bg-white/5 text-zinc-400 uppercase tracking-widest text-[10px]"
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
                  <span className="text-zinc-500">
                    {symbol} • {details.market}
                  </span>
                  <span className="h-1 w-1 rounded-full bg-zinc-700" />
                  <span className="text-zinc-400 font-medium">
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
              methodologyTitle="Weighted Average Cost Basis"
              methodologyFormula="Avg Cost = Total Cost of All Purchases / Total Quantity"
            />
            <StatCard
              label="Asset Gain"
              value={formatCurrency(details.asset_gain)}
              percentage={details.total_return_pct}
              type="dynamic"
              methodologyTitle="Asset Gain Calculation"
              methodologyFormula="Asset Gain = (Current Price - Avg Cost) × Total Quantity"
            />
            <StatCard
              label="FX Gain"
              value={formatCurrency(details.fx_gain)}
              percentage={0} // Placeholder for now
              type="neutral"
              methodologyTitle="Foreign Exchange Gain"
              methodologyFormula="FX Gain = Currency exchange rate impact on asset value"
            />
            <StatCard
              label="Realized P/L"
              value={formatCurrency(details.realized_pl || 0)}
              subValue="Total realized from sells"
              methodologyTitle="Realized Profit/Loss"
              methodologyFormula="Realized P/L = Sum of (Sell Price - Cost Basis) for all sold assets"
            />
          </div>

          {/* Chart & History Row */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* TradingView Widget Integration */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              <div className="rounded-2xl border border-white/5 bg-zinc-900/50 p-0 shadow-xl relative overflow-hidden h-[500px]">
                <div className="flex items-center justify-between p-6 border-b border-white/5">
                  <h3 className="font-medium text-zinc-300 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-emerald-400" />{" "}
                    Interactive Chart
                  </h3>
                </div>
                <div className="flex-1 w-full h-full pb-[60px]">
                  <TradingViewWidget symbol={symbol!} />
                </div>
              </div>
            </div>

            {/* Transaction History Sidebar */}
            <div className="flex flex-col gap-4">
              <div className="rounded-2xl border border-white/5 bg-zinc-900/50 p-0 shadow-xl overflow-hidden flex flex-col h-[500px]">
                <div className="flex items-center gap-2 p-5 border-b border-white/5 bg-white/[0.02]">
                  <History className="h-5 w-5 text-zinc-400" />
                  <h3 className="font-medium text-white">
                    Recent Transactions
                  </h3>
                </div>
                <ScrollArea className="flex-1">
                  <Table>
                    <TableHeader className="bg-white/[0.01]">
                      <TableRow className="border-white/5 hover:bg-transparent">
                        <TableHead className="text-zinc-500 pl-5">
                          Date
                        </TableHead>
                        <TableHead className="text-zinc-500">Type</TableHead>
                        <TableHead className="text-zinc-500 text-right pr-5">
                          Amount
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((tx) => (
                        <TableRow
                          key={tx.id}
                          className="border-white/5 hover:bg-white/[0.04] transition-colors group"
                        >
                          <TableCell className="pl-5 text-zinc-400 text-xs py-4">
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
                            <div className="text-sm font-medium text-white">
                              {tx.quantity} units
                            </div>
                            <div className="text-[10px] text-zinc-500">
                              @ {formatCurrency(tx.price)}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
                <Link
                  to={`/portfolio/${portfolioId}/transactions`}
                  className="p-4 text-center text-xs font-medium text-zinc-500 hover:text-emerald-400 border-t border-white/5 bg-white/[0.01] transition-colors"
                >
                  View full history{" "}
                  <ChevronRight className="inline h-3 w-3 ml-1" />
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
  methodologyTitle,
  methodologyFormula,
}: {
  label: string;
  value: string;
  percentage?: number;
  subValue?: string;
  type?: "default" | "dynamic" | "neutral";
  methodologyTitle?: string;
  methodologyFormula?: string;
}) {
  const isPositive = percentage !== undefined && percentage >= 0;

  return (
    <div className="relative group rounded-2xl border border-white/5 bg-zinc-900/50 p-5 shadow-lg transition-all hover:bg-zinc-900/80 hover:border-white/10 overflow-hidden">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-zinc-500 uppercase tracking-tight">
          {label}
        </p>
        {methodologyTitle && methodologyFormula && (
          <HoverCard>
            <HoverCardTrigger asChild>
              <button
                aria-label={`View methodology for ${label}`}
                className="inline-flex items-center justify-center text-zinc-500 hover:text-zinc-300 transition-colors"
                tabIndex={0}
              >
                <Info className="h-3.5 w-3.5" />
              </button>
            </HoverCardTrigger>
            <HoverCardContent side="left" className="max-w-xs">
              <div className="space-y-2">
                <p className="text-xs font-medium text-white">
                  {methodologyTitle}
                </p>
                <p className="text-xs text-zinc-400">{methodologyFormula}</p>
              </div>
            </HoverCardContent>
          </HoverCard>
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-white tracking-tight">
          {value}
        </span>
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

      {subValue && (
        <p className="mt-2 text-xs text-zinc-600 font-medium">{subValue}</p>
      )}

      {type === "neutral" && (
        <p className="mt-2 text-xs text-zinc-600 font-medium italic">
          Breakdown of FX impact (FR7)
        </p>
      )}
    </div>
  );
}
