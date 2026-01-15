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
      {/* Top Bar: Portfolio Header */}
      <div className="border-b border-white/6 py-6">
        <div className="mx-auto max-w-7xl px-4">
          <Breadcrumb className="mb-4">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/dashboard">Dashboard</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-emerald-400">{portfolio.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl font-semibold text-white tracking-tight">
                  {portfolio.name}
                </h1>
                <p className="text-sm text-zinc-500">{portfolio.description || "No description"}</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              {/* Summary Stats */}
              <div className="flex flex-col items-end">
                <span className="mb-px text-xs font-medium text-zinc-500">Net Worth</span>
                <span className="font-serif text-3xl font-light tracking-tight text-white">
                  {formatCurrency(portfolio.netWorth)}
                </span>
              </div>

              <Button
                onClick={() => setIsAddAssetOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                <Plus className="mr-2 h-4 w-4" /> Add Asset
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content: Scrollable */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="mx-auto max-w-7xl">
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="holdings">Holdings</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Top Row: Charts */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <PortfolioHistoryChart portfolioId={id} />
                </div>
                <div>
                  <AllocationDonut portfolioId={id} />
                </div>
              </div>

              {/* Bottom Row: Holdings Table */}
              <div>
                <UnifiedHoldingsTable portfolioId={id} onAddAsset={() => setIsAddAssetOpen(true)} />
              </div>
            </TabsContent>

            <TabsContent value="performance">
              <PerformanceDashboard portfolioId={id} onAddAsset={() => setIsAddAssetOpen(true)} />
            </TabsContent>

            <TabsContent value="holdings">
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
