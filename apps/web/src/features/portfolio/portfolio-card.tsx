import { Link } from "react-router";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@repo/ui/components/card";
import { Skeleton } from "@repo/ui/components/skeleton";
import { PortfolioSummaryDto } from "@repo/api-types";
import { ArrowUpRight, ArrowDownRight, Briefcase } from "lucide-react";
import { cn } from "@repo/ui/lib/utils";

interface PortfolioCardProps {
  portfolio: PortfolioSummaryDto;
}

export function PortfolioCard({ portfolio }: PortfolioCardProps) {
  const isPositive = portfolio.change24h >= 0;

  const formatCurrency = (value: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "percent",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value / 100);
  };

  return (
    <Link
      to={`/portfolio/${portfolio.id}`}
      className="block h-full transition-transform hover:translate-y-[-2px]"
    >
      <Card className="h-full bg-zinc-900 border-zinc-800 hover:border-zinc-700 hover:shadow-lg transition-all">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-zinc-400">
            {portfolio.name}
          </CardTitle>
          <Briefcase className="h-4 w-4 text-zinc-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">
            {formatCurrency(portfolio.netWorth, portfolio.base_currency)}
          </div>
          <div className="flex items-center space-x-2 mt-1">
            <div
              className={cn(
                "flex items-center text-xs font-medium",
                isPositive ? "text-emerald-500" : "text-red-500",
              )}
            >
              {isPositive ? (
                <ArrowUpRight className="h-3 w-3 mr-1" />
              ) : (
                <ArrowDownRight className="h-3 w-3 mr-1" />
              )}
              {isPositive ? "+" : ""}
              {formatPercent(portfolio.change24hPercent)}
            </div>
            <div className="text-xs text-zinc-500">
              ({isPositive ? "+" : ""}
              {formatCurrency(
                portfolio.change24h,
                portfolio.base_currency,
              )}{" "}
              today)
            </div>
          </div>

          {/* Micro Allocation Indicator (simplified for now) */}
          <div className="mt-4 flex h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
            {/* Placeholder allocation bar - will be replaced with real data in future stories */}
            <div className="h-full bg-gradient-to-r from-emerald-500 via-blue-500 to-amber-500 w-full" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

PortfolioCard.Skeleton = function PortfolioCardSkeleton() {
  return (
    <Card className="h-full bg-zinc-900 border-zinc-800 animate-pulse">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-[100px] bg-zinc-800" />
        <Skeleton className="h-4 w-4 rounded-full bg-zinc-800" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-[150px] bg-zinc-800 mb-2" />
        <Skeleton className="h-4 w-[200px] bg-zinc-800" />
      </CardContent>
    </Card>
  );
};
