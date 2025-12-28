import { useState } from 'react';
import { useParams, Link } from 'react-router';
import { usePortfolio } from '@/api/hooks/use-portfolios';
import { UnifiedHoldingsTable } from '@/components/dashboard/unified-holdings-table';
import { PortfolioHistoryChart } from '@/components/dashboard/portfolio-history-chart';
import { AllocationDonut } from '@/components/dashboard/allocation-donut';
import { AddAssetModal } from '@/components/add-asset-modal';
import { Button } from '@repo/ui/components/button';
import { ChevronLeft, AlertCircle, Plus } from 'lucide-react';
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyMedia } from '@repo/ui/components/empty';

export default function PortfolioDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: portfolio, isLoading, isError } = usePortfolio(id!);
  const [isAddAssetOpen, setIsAddAssetOpen] = useState(false);

  if (isLoading) {
      return <div className="p-8"><div className="animate-pulse h-64 bg-zinc-900 rounded-xl" /></div>;
  }

  if (isError || !portfolio) {
    return (
        <div className="flex h-full items-center justify-center p-8">
            <Empty>
                <EmptyHeader>
                    <EmptyMedia variant="icon"><AlertCircle className="h-6 w-6 text-red-500" /></EmptyMedia>
                    <EmptyTitle>Portfolio not found</EmptyTitle>
                    <EmptyDescription>The portfolio you are looking for does not exist or you do not have permission to view it.</EmptyDescription>
                </EmptyHeader>
                <div className="mt-6 flex justify-center">
                    <Link to="/dashboard">
                        <Button variant="outline"><ChevronLeft className="mr-2 h-4 w-4" /> Back to Dashboard</Button>
                    </Link>
                </div>
            </Empty>
        </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: portfolio.base_currency,
    }).format(value);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Top Bar: Portfolio Header */}
      <div className="border-b border-white/[0.06] px-8 py-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-4">
             <Link to="/dashboard" className="rounded-full p-2 hover:bg-white/5 transition-colors text-zinc-400 hover:text-white">
                <ChevronLeft className="h-5 w-5" />
             </Link>
             <div>
                <h1 className="text-2xl font-semibold text-white tracking-tight">{portfolio.name}</h1>
                <p className="text-sm text-zinc-500">{portfolio.description || 'No description'}</p>
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
            
            <Button onClick={() => setIsAddAssetOpen(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white">
              <Plus className="mr-2 h-4 w-4" /> Add Asset
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content: Scrollable */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          
          {/* Top Row: Charts */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <PortfolioHistoryChart />
            </div>
            <div>
              <AllocationDonut />
            </div>
          </div>

          {/* Bottom Row: Holdings Table */}
          <div>
            <UnifiedHoldingsTable 
              portfolioId={id} 
              onAddAsset={() => setIsAddAssetOpen(true)} 
            />
          </div>

        </div>
      </div>

      <AddAssetModal 
        isOpen={isAddAssetOpen} 
        onClose={() => setIsAddAssetOpen(false)} 
        stageId="all"
        portfolioId={id!}
      />
    </div>
  );
}
