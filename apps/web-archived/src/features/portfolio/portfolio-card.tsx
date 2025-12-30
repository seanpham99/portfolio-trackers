import { Link } from "react-router";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@workspace/ui/components/card";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { PortfolioSummaryDto } from "@workspace/api-types";
import { ArrowUpRight, ArrowDownRight, Briefcase } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";

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
      className="block h-full transition-transform hover:-translate-y-0.5"
    >
      <Card className="h-full surface-elevated-hover">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {portfolio.name}
          </CardTitle>
          <Briefcase className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">
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
          <div className="mt-4 flex h-1.5 w-full overflow-hidden rounded-full bg-muted">
            {/* Placeholder allocation bar - will be replaced with real data in future stories */}
            <div className="h-full bg-linear-to-r from-emerald-500 via-blue-500 to-amber-500 w-full" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

PortfolioCard.Skeleton = function PortfolioCardSkeleton() {
  return (
    <Card className="h-full surface-primary animate-pulse">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-[100px] skeleton-surface" />
        <Skeleton className="h-4 w-4 rounded-full skeleton-surface" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-[150px] skeleton-surface mb-2" />
        <Skeleton className="h-4 w-[200px] skeleton-surface" />
      </CardContent>
    </Card>
  );
};
