"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const prefersReducedMotion = useReducedMotion();

  // Reduced motion variants
  const fadeIn = prefersReducedMotion
    ? { initial: { opacity: 1 }, animate: { opacity: 1 } }
    : { initial: { opacity: 0 }, animate: { opacity: 1 } };

  return (
    <div className="flex min-h-screen w-full font-sans selection:bg-emerald-500/30 overflow-hidden">
      {/* Left Panel - Branding & Visuals (Visible on Desktop) */}
      <motion.div
        {...fadeIn}
        transition={{ duration: 0.8 }}
        className="relative hidden w-1/2 flex-col justify-between bg-[#09090b] p-10 lg:flex overflow-hidden border-r border-white/5"
      >
        {/* Animated Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/auth-bg.png"
            alt="Premium Portfolio Analytics"
            fill
            className="object-cover opacity-80 mix-blend-normal"
            priority
            quality={100}
          />
          {/* Gradient Overlay for Text Readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/40 to-[#09090b]/30" />
        </div>

        {/* Content Layer */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 border border-white/10 backdrop-blur-md shadow-lg">
              <span className="text-xl font-bold text-white font-serif">P</span>
            </div>
            <span className="text-xl font-medium tracking-tight text-white font-serif">
              Portfolios Tracker
            </span>
          </div>
        </div>

        <div className="relative z-10 max-w-md">
          <blockquote className="space-y-4">
            <p className="text-3xl font-light leading-snug text-white font-serif tracking-tight drop-shadow-xl">
              &ldquo;Consolidated wealth. Total clarity. The peace of mind needed for bold
              decisions.&rdquo;
            </p>
          </blockquote>
        </div>
      </motion.div>

      {/* Right Panel - Auth Forms */}
      <main className="flex w-full flex-col items-center justify-center bg-[#09090b] px-4 py-8 lg:w-1/2 sm:px-6 lg:px-8 relative overflow-y-auto">
        {/* Mobile Background Elements (So it's not plain black on mobile) */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none lg:hidden">
          <div className="absolute top-[-10%] right-[-10%] h-[400px] w-[400px] rounded-full bg-emerald-500/10 blur-[80px] opacity-30" />
          <div className="absolute bottom-[-10%] left-[-10%] h-[300px] w-[300px] rounded-full bg-teal-500/10 blur-[80px] opacity-20" />
        </div>

        <div className="w-full max-w-[400px] space-y-6 relative z-10">
          {/* Logo only visible on mobile */}
          <div className="flex flex-col items-center gap-2 mb-8 lg:hidden">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-900/20 border border-emerald-500/20 backdrop-blur-sm">
              <span className="text-2xl font-bold text-emerald-400 font-serif">P</span>
            </div>
            <span className="text-xl font-medium tracking-tight text-white font-serif">
              Portfolios Tracker
            </span>
          </div>

          {children}

          <div className="text-center text-xs text-zinc-500 pt-4">
            © {new Date().getFullYear()} Portfolios Tracker. All rights reserved.
          </div>
        </div>
      </main>
    </div>
  );
}
