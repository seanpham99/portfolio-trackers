import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fontSans } from "@/lib/font";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@workspace/ui/components/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
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
        {/* Global Gradient Background - Deep Zinc with Vibrant Highlights (Dark) / Clean Light (Light) */}
        <div className="fixed inset-0 bg-background pointer-events-none -z-50 transition-colors duration-300" />
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))] pointer-events-none -z-40 opacity-50 dark:opacity-100" />
        <div className="fixed top-0 left-0 right-0 h-[500px] bg-linear-to-b from-indigo-500/5 via-background/5 to-background/0 dark:from-indigo-500/10 dark:via-background/5 pointer-events-none -z-40 blur-3xl" />

        {/* Page content */}
        <div className={`flex-1 ${fontSans.variable} font-sans`}>{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
