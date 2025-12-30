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
} from "@repo/ui/components/empty";
import { Button } from "@repo/ui/components/button";
import { Plus, Briefcase } from "lucide-react";

export default function Dashboard() {
  const { data: portfolios, isLoading } = usePortfolios();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 p-8 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <PortfolioCard.Skeleton key={i} />
        ))}
      </div>
    );
  }

  if (!portfolios?.length) {
    return (
      <div className="flex h-full items-center justify-center p-8">
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
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Create Portfolio
            </Button>
          </EmptyContent>
        </Empty>
        <CreatePortfolioModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white">Portfolios</h1>
        <Button variant="outline" onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> New Portfolio
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {portfolios.map((p) => (
          <PortfolioCard key={p.id} portfolio={p} />
        ))}
      </div>
      <CreatePortfolioModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}
