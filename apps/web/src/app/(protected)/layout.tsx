import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SidebarProvider, SidebarTrigger } from "@workspace/ui/components/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar user={user} />
      <main className="flex w-full flex-1 flex-col overflow-auto">
        {/* Header with trigger */}
        <div className="sticky top-0 z-10 flex items-center gap-4 border-b bg-background/95 px-4 py-3 backdrop-blur supports-backdrop-filter:bg-background/60">
          <SidebarTrigger className="-ml-1" />
          <span className="font-serif text-lg font-light lg:hidden">FinSight</span>
        </div>

        {/* Page content */}
        <div className="flex-1 py-8">{children}</div>
      </main>
    </SidebarProvider>
  );
}
