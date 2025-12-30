import { Outlet, useLoaderData, useNavigate } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { requireAuth } from "@/lib/auth";
import { SidebarProvider, SidebarTrigger } from "@repo/ui/components/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireAuth(request);
  return { user };
}

export default function Layout() {
  const { user } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  const handleSignOut = () => {
    navigate("/logout");
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar user={user} onSignOut={handleSignOut} />
      <main className="flex w-full flex-1 flex-col overflow-auto">
        {/* Header with trigger */}
        <div className="sticky top-0 z-10 flex items-center gap-4 border-b bg-background/95 px-4 py-3 backdrop-blur supports-backdrop-filter:bg-background/60">
          <SidebarTrigger className="-ml-1" />
          <span className="font-serif text-lg font-light lg:hidden">
            FinSight
          </span>
        </div>

        {/* Page content */}
        <div className="flex-1 py-8">
          <Outlet />
        </div>
      </main>
    </SidebarProvider>
  );
}
