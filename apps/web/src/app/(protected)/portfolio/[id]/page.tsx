"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { usePortfolio } from "@/features/portfolio/hooks/use-portfolios";
import { UnifiedHoldingsTable } from "@/features/portfolio/unified-holdings-table";
import { PortfolioHistoryChart } from "@/features/portfolio/portfolio-history-chart";
import { AllocationDonut } from "@/features/portfolio/allocation-donut";
import { AddAssetModal } from "@/features/transactions/add-asset-modal";
import { PerformanceDashboard } from "@/features/analytics/performance-dashboard";
import { Button } from "@workspace/ui/components/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@workspace/ui/components/tabs";
import { ChevronLeft, AlertCircle, Plus } from "lucide-react";
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
  const { data: portfolio, isLoading, isError } = usePortfolio(id);
  const [isAddAssetOpen, setIsAddAssetOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse h-64 bg-zinc-900 rounded-xl" />
      </div>
    );
  }

  if (isError || !portfolio) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <AlertCircle className="h-6 w-6 text-red-500" />
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

  return (
    <div className="flex h-full flex-col">
      {/* Top Bar: Portfolio Header - Glassmorphic */}
      <div className="border-b border-border/50 py-6 bg-background/60 backdrop-blur-md sticky top-0 z-10 transition-colors duration-300">
        <div className="mx-auto max-w-7xl px-4">
          <Breadcrumb className="mb-4">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/dashboard" className="hover:text-foreground transition-colors">
                    Dashboard
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-emerald-400 font-medium">
                  {portfolio.name}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold font-sans tracking-tight text-foreground mb-1">
                  {portfolio.name}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {portfolio.description || "No description"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              {/* Summary Stats */}
              <div className="flex flex-col items-end">
                <span className="mb-px text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Net Worth
                </span>
                <div className="text-right">
                  <span className="font-sans text-3xl font-bold tracking-tight text-foreground">
                    {formatCurrency(portfolio.netWorth)}
                  </span>
                </div>
              </div>

              <Button
                onClick={() => setIsAddAssetOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 rounded-full font-medium"
              >
                <Plus className="mr-2 h-4 w-4" /> Add Asset
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content: Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="mx-auto max-w-7xl">
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="bg-muted/10 border border-border/10 p-1 rounded-xl">
              <TabsTrigger
                value="overview"
                className="rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="performance"
                className="rounded-lg data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=active]:shadow-none"
              >
                Performance
              </TabsTrigger>
              <TabsTrigger
                value="holdings"
                className="rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                Holdings
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value="overview"
              className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500"
            >
              {/* Top Row: Charts */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="glass-card lg:col-span-2 p-1 overflow-hidden">
                  <PortfolioHistoryChart portfolioId={id} />
                </div>
                <div className="glass-card p-4 flex items-center justify-center">
                  <AllocationDonut portfolioId={id} />
                </div>
              </div>

              {/* Bottom Row: Holdings Table */}
              <div className="glass-card overflow-hidden">
                <UnifiedHoldingsTable portfolioId={id} onAddAsset={() => setIsAddAssetOpen(true)} />
              </div>
            </TabsContent>

            <TabsContent
              value="performance"
              className="glass-card p-6 animate-in fade-in slide-in-from-bottom-4 duration-500"
            >
              <PerformanceDashboard portfolioId={id} onAddAsset={() => setIsAddAssetOpen(true)} />
            </TabsContent>

            <TabsContent
              value="holdings"
              className="glass-card overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500"
            >
              <UnifiedHoldingsTable portfolioId={id} onAddAsset={() => setIsAddAssetOpen(true)} />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <AddAssetModal
        isOpen={isAddAssetOpen}
        onClose={() => setIsAddAssetOpen(false)}
        stageId="all"
        portfolioId={id}
      />
    </div>
  );
}
