import { useState } from "react";
import { usePortfolios } from "@/features/portfolio/hooks/use-portfolios";
import { PortfolioCard } from "@/features/portfolio/portfolio-card";
import { CreatePortfolioModal } from "@/features/portfolio/create-portfolio-modal";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
  EmptyMedia,
} from "@workspace/ui/components/empty";
import { Button } from "@workspace/ui/components/button";
import { Plus, Briefcase } from "lucide-react";

export default function Dashboard() {
  const { data: portfolios, isLoading } = usePortfolios();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-12 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="col-span-12 sm:col-span-6 lg:col-span-4">
              <PortfolioCard.Skeleton />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!portfolios?.length) {
    return (
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex h-full items-center justify-center">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Briefcase className="h-6 w-6" />
              </EmptyMedia>
              <EmptyTitle>No portfolios found</EmptyTitle>
              <EmptyDescription>
                Create your first portfolio to start tracking your wealth.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button
                className="w-full sm:w-auto"
                onClick={() => setIsCreateModalOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" /> Create Portfolio
              </Button>
            </EmptyContent>
          </Empty>
          <CreatePortfolioModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-semibold text-foreground sm:text-3xl lg:text-4xl">
            Portfolios
          </h1>
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" /> New Portfolio
          </Button>
        </div>
        <div className="grid grid-cols-12 gap-6">
          {portfolios.map((p) => (
            <div key={p.id} className="col-span-12 sm:col-span-6 lg:col-span-4">
              <PortfolioCard portfolio={p} />
            </div>
          ))}
        </div>
      </div>
      <CreatePortfolioModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}
