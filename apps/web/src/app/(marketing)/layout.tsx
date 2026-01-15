import { MarketingHeader } from "@/features/marketing/components/marketing-header";
import { MarketingFooter } from "@/features/marketing/components/marketing-footer";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-black text-foreground">
      <MarketingHeader />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
    </div>
  );
}
