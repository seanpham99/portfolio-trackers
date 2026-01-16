import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@workspace/ui/components/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@workspace/ui/components/separator";

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
      <SidebarInset>
        {/* Premium Background for all protected pages */}
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/20 via-background to-background pointer-events-none -z-20" />

        {/* Header with Sidebar Trigger */}
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-white/5 px-4 sticky top-0 z-10 bg-background/80 backdrop-blur-sm">
          <SidebarTrigger className="-ml-1 size-8 text-muted-foreground hover:text-white hover:bg-white/10 rounded-lg transition-colors" />
          <Separator orientation="vertical" className="h-4 bg-white/10" />
          <span className="text-sm font-medium text-muted-foreground">Menu</span>
        </header>

        {/* Page content */}
        <div className="flex-1 py-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
