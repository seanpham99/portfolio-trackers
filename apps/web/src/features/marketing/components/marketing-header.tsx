"use client";

import Link from "next/link";
import { Button } from "@workspace/ui/components/button";
import { Briefcase } from "lucide-react";
import { useScroll } from "framer-motion";
import { useEffect, useState } from "react";
import { cn } from "@workspace/ui/lib/utils";

export function MarketingHeader() {
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    return scrollY.onChange((latest) => {
      setIsScrolled(latest > 50);
    });
  }, [scrollY]);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled
          ? "bg-black/50 backdrop-blur-md border-b border-white/10 py-4"
          : "bg-transparent py-6"
      )}
    >
      <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="rounded-lg bg-emerald-500/10 p-2">
            <Briefcase className="h-6 w-6 text-emerald-500" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            Portfolio
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <Link href="#features" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
            Features
          </Link>
          <Link href="#testimonials" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
            Testimonials
          </Link>
          <Link href="#pricing" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
            Pricing
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <Link href="/login">
            <Button variant="ghost" className="text-zinc-300 hover:text-white">
              Log in
            </Button>
          </Link>
          <Link href="/signup">
            <Button className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-full px-6">
              Get Started
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
