import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/get-query-client";
import { getPortfolios } from "@/api/server";
import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage() {
  const queryClient = getQueryClient();

  await queryClient.prefetchQuery({
    queryKey: ["portfolios"],
    queryFn: getPortfolios,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardClient />
    </HydrationBoundary>
  );
}
