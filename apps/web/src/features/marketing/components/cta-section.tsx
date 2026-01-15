"use client";

import { Button } from "@workspace/ui/components/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function CTASection() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-4 md:px-6">
        <div className="relative rounded-3xl bg-gradient-to-br from-emerald-900/50 to-zinc-900 border border-emerald-500/20 px-6 py-16 md:px-16 md:py-24 text-center overflow-hidden">
          {/* Background Effects */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-cyan-500/10 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/4 pointer-events-none" />

          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 relative z-10">
            Ready to take control?
          </h2>
          <p className="text-lg text-zinc-300 max-w-2xl mx-auto mb-10 relative z-10">
            Join thousands of investors using Portfolio to track their net worth and make smarter
            financial decisions.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
            <Link href="/signup">
              <Button
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-full px-8 h-14 text-lg"
              >
                Get Started Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>

          <p className="mt-6 text-sm text-zinc-500 relative z-10">
            Free 14-day trial • Cancel anytime • No credit card required
          </p>
        </div>
      </div>
    </section>
  );
}
