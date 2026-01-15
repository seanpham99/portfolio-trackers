"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@workspace/ui/components/button";
import { ArrowRight, CheckCircle2, Play, TrendingUp, Wallet, BarChart3 } from "lucide-react";
import { motion, useMotionValue, useTransform, animate, useMotionTemplate } from "framer-motion";
import { useEffect, useState } from "react";

// Animated counter component
function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => {
    if (suffix === "M+") return `$${Math.round(latest)}${suffix}`;
    if (suffix === "K+") return `${Math.round(latest)}${suffix}`;
    if (suffix === "%") return `${latest.toFixed(1)}${suffix}`;
    return Math.round(latest).toLocaleString();
  });
  const [displayValue, setDisplayValue] = useState("0");

  useEffect(() => {
    const controls = animate(count, value, {
      duration: 2,
      ease: "easeOut",
    });

    const unsubscribe = rounded.on("change", (v) => setDisplayValue(v));

    return () => {
      controls.stop();
      unsubscribe();
    };
  }, [count, value, rounded]);

  return <span>{displayValue}</span>;
}

// Stats data
const stats = [
  { label: "Assets Tracked", value: 250, suffix: "M+" },
  { label: "Active Users", value: 50, suffix: "K+" },
  { label: "Avg. Returns", value: 12.4, suffix: "%" },
];

// Feature pills
const featurePills = ["No credit card required", "Bank-level security", "Free forever plan"];

export function HeroSection() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <section
      className="relative pt-32 pb-24 md:pt-44 md:pb-32 overflow-hidden group bg-black"
      onMouseMove={handleMouseMove}
    >
      {/* Background Layer (Z-0) */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Image
          src="/hero-bg.png"
          alt="Fintech Data Background"
          fill
          className="object-cover opacity-100"
          priority
          quality={100}
        />

        {/* Gradient overlay to ensure text contrast while keeping image visible */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black" />

        {/* Mouse Spotlight */}
        <motion.div
          className="absolute -inset-px opacity-0 transition duration-300 group-hover:opacity-100"
          style={{
            background: useMotionTemplate`
              radial-gradient(
                650px circle at ${mouseX}px ${mouseY}px,
                rgba(16, 185, 129, 0.15),
                transparent 80%
              )
            `,
          }}
        />
      </div>

      {/* Content Layer (Z-10) */}
      <div className="container relative z-10 mx-auto px-4 md:px-6">
        <div className="text-center max-w-4xl mx-auto">
          {/* Announcement Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Link
              href="#features"
              className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 text-sm font-medium text-emerald-400 mb-8 backdrop-blur-sm hover:bg-emerald-500/15 transition-colors cursor-pointer group"
            >
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>New: AI-Powered Portfolio Insights</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white mb-6"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Your wealth,{" "}
            <span className="relative">
              <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                one dashboard
              </span>
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-zinc-400 mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            Connect your brokerage, crypto, and bank accounts. Track performance in real-time. Get
            AI-driven insights to grow your wealth faster.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/signup">
              <Button
                size="lg"
                className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white rounded-full px-8 h-14 text-base font-medium shadow-xl shadow-emerald-500/25 transition-all duration-300 hover:shadow-emerald-500/40 hover:scale-[1.02] cursor-pointer"
              >
                Start Tracking for Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="#demo">
              <Button
                variant="outline"
                size="lg"
                className="rounded-full px-8 h-14 text-base border-zinc-700 text-zinc-300 hover:text-white hover:bg-white/5 hover:border-zinc-600 transition-all duration-300 cursor-pointer group"
              >
                <Play className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
                Watch Demo
              </Button>
            </Link>
          </motion.div>

          {/* Trust Badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-zinc-500"
          >
            {featurePills.map((feature, index) => (
              <div key={index} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>{feature}</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Dashboard Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-20 relative mx-auto max-w-5xl"
        >
          {/* Glow effect behind the dashboard */}
          <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/20 via-cyan-500/20 to-purple-500/20 blur-3xl -z-10 rounded-3xl opacity-60" />

          {/* Main dashboard container */}
          <div className="rounded-2xl border border-white/10 bg-zinc-900/80 backdrop-blur-xl p-3 shadow-2xl">
            {/* Browser dots */}
            <div className="flex items-center gap-2 px-2 pb-3 border-b border-white/5">
              <div className="h-3 w-3 rounded-full bg-red-500/80" />
              <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
              <div className="h-3 w-3 rounded-full bg-green-500/80" />
              <div className="ml-4 flex-1 rounded-md bg-zinc-800/50 h-6 flex items-center px-3">
                <span className="text-xs text-zinc-500 font-mono">
                  portfolios-tracker.com/dashboard
                </span>
              </div>
            </div>

            {/* Dashboard content mockup */}
            <div className="rounded-xl bg-gradient-to-br from-zinc-900 to-zinc-950 aspect-[16/9] overflow-hidden relative p-6">
              {/* Mock dashboard grid */}
              <div className="grid grid-cols-12 gap-4 h-full">
                {/* Sidebar mockup */}
                <div className="col-span-2 hidden lg:block">
                  <div className="space-y-2 pt-2">
                    {/* Active Menu Item */}
                    <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <div className="h-4 w-4 rounded md:rounded-md bg-emerald-500/80" />
                      <div className="h-2 w-16 rounded-full bg-emerald-500/50" />
                    </div>
                    {/* Inactive Menu Items */}
                    <div className="flex items-center gap-3 px-3 py-2">
                      <div className="h-4 w-4 rounded md:rounded-md bg-zinc-800" />
                      <div className="h-2 w-12 rounded-full bg-zinc-800" />
                    </div>
                    <div className="flex items-center gap-3 px-3 py-2">
                      <div className="h-4 w-4 rounded md:rounded-md bg-zinc-800" />
                      <div className="h-2 w-20 rounded-full bg-zinc-800" />
                    </div>
                    <div className="flex items-center gap-3 px-3 py-2">
                      <div className="h-4 w-4 rounded md:rounded-md bg-zinc-800" />
                      <div className="h-2 w-14 rounded-full bg-zinc-800" />
                    </div>
                  </div>
                </div>

                {/* Main content */}
                <div className="col-span-12 lg:col-span-10 space-y-4">
                  {/* Top stats row */}
                  <div className="grid grid-cols-3 gap-4">
                    {/* Net Worth Card */}
                    <motion.div
                      className="col-span-3 md:col-span-1 rounded-xl bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 p-4"
                      whileHover={{ scale: 1.02 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <div className="flex items-center gap-2 text-zinc-400 text-xs mb-2">
                        <Wallet className="h-3.5 w-3.5" />
                        Total Net Worth
                      </div>
                      <div
                        className="text-2xl md:text-3xl font-bold text-white"
                        style={{ fontFamily: "var(--font-heading)" }}
                      >
                        $847,392
                      </div>
                      <div className="text-emerald-400 text-sm flex items-center gap-1 mt-1">
                        <TrendingUp className="h-3.5 w-3.5" />
                        +12.4% this month
                      </div>
                    </motion.div>

                    {/* Other stat cards */}
                    <motion.div
                      className="hidden md:block rounded-xl bg-zinc-800/50 border border-zinc-700/50 p-4"
                      whileHover={{ scale: 1.02 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <div className="flex items-center gap-2 text-zinc-400 text-xs mb-2">
                        <BarChart3 className="h-3.5 w-3.5" />
                        Portfolio Value
                      </div>
                      <div className="text-xl font-bold text-white">$523,847</div>
                      <div className="h-2 w-full rounded-full bg-zinc-700 mt-3">
                        <div className="h-2 w-3/4 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500" />
                      </div>
                    </motion.div>

                    <motion.div
                      className="hidden md:block rounded-xl bg-zinc-800/50 border border-zinc-700/50 p-4"
                      whileHover={{ scale: 1.02 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <div className="flex items-center gap-2 text-zinc-400 text-xs mb-2">
                        <TrendingUp className="h-3.5 w-3.5" />
                        Monthly Gain
                      </div>
                      <div className="text-xl font-bold text-emerald-400">+$24,582</div>
                      <div className="text-zinc-500 text-xs mt-1">Best performing: NVDA +42%</div>
                    </motion.div>
                  </div>

                  {/* Chart area mockup */}
                  {/* Chart area mockup */}
                  <div className="grid grid-cols-3 gap-4 h-[280px]">
                    {/* Main Chart (2/3 width) */}
                    <div className="col-span-3 md:col-span-2 rounded-xl bg-zinc-800/30 border border-zinc-700/50 p-4 flex flex-col">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span className="text-xs font-medium text-zinc-300">Performance</span>
                        </div>
                        <div className="flex gap-1 bg-white/5 rounded-lg p-0.5">
                          {["1D", "1W", "1M", "1Y", "ALL"].map((period, i) => (
                            <div
                              key={period}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-medium cursor-pointer transition-colors ${i === 2 ? "bg-zinc-700 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"}`}
                            >
                              {period}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="relative flex-1 w-full overflow-hidden">
                        {/* Grid Lines */}
                        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-5">
                          {[...Array(5)].map((_, i) => (
                            <div key={i} className="w-full h-px bg-white" />
                          ))}
                        </div>

                        <svg
                          className="absolute inset-0 w-full h-full overflow-visible"
                          preserveAspectRatio="none"
                          viewBox="0 0 100 100"
                        >
                          <defs>
                            <linearGradient id="chartGradientNew" x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor="rgb(16, 185, 129)" stopOpacity="0.2" />
                              <stop offset="100%" stopColor="rgb(16, 185, 129)" stopOpacity="0" />
                            </linearGradient>
                          </defs>

                          {/* Portfolio Line */}
                          <motion.path
                            d="M0,85 C15,82 25,60 40,65 S60,40 75,45 S90,20 100,10"
                            fill="none"
                            stroke="rgb(16, 185, 129)"
                            strokeWidth="2"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 2, delay: 0.5 }}
                            filter="drop-shadow(0 2px 4px rgba(16, 185, 129, 0.2))"
                          />

                          {/* Area Fill */}
                          <motion.path
                            d="M0,85 C15,82 25,60 40,65 S60,40 75,45 S90,20 100,10 L100,105 L0,105 Z"
                            fill="url(#chartGradientNew)"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 1, delay: 1 }}
                          />

                          {/* Reference Line (Previous Period) */}
                          <motion.path
                            d="M0,80 C20,75 40,85 60,70 S80,60 100,65"
                            fill="none"
                            stroke="rgb(113, 113, 122)"
                            strokeWidth="1"
                            strokeDasharray="3 3"
                            strokeOpacity="0.5"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.5 }}
                            transition={{ delay: 1.5 }}
                          />
                        </svg>
                      </div>
                    </div>

                    {/* Asset Allocation (1/3 width) */}
                    <div className="hidden md:flex col-span-1 rounded-xl bg-zinc-800/30 border border-zinc-700/50 p-4 flex-col">
                      <h3 className="text-xs font-medium text-zinc-300 mb-2">Asset Split</h3>

                      <div className="flex-1 flex items-center justify-center relative min-h-0">
                        {/* Doughnut Chart */}
                        <div className="relative w-24 h-24 lg:w-28 lg:h-28">
                          <svg viewBox="0 0 100 100" className="-rotate-90 w-full h-full">
                            {/* Background Circle */}
                            <circle
                              cx="50"
                              cy="50"
                              r="40"
                              fill="none"
                              stroke="rgba(255,255,255,0.05)"
                              strokeWidth="12"
                            />

                            {/* Crypto Segment (Purple) - 45% */}
                            <motion.circle
                              cx="50"
                              cy="50"
                              r="40"
                              fill="none"
                              stroke="rgb(168, 85, 247)"
                              strokeWidth="12"
                              strokeDasharray="251.2"
                              strokeDashoffset="251.2" // Full circumference
                              strokeLinecap="round"
                              initial={{ strokeDashoffset: 251.2 }}
                              animate={{ strokeDashoffset: 251.2 * (1 - 0.45) }} // 45% filled
                              transition={{ duration: 1.5, delay: 1, type: "spring" }}
                            />

                            {/* Stocks Segment (Emerald) - 30% */}
                            <motion.circle
                              cx="50"
                              cy="50"
                              r="40"
                              fill="none"
                              stroke="rgb(16, 185, 129)"
                              strokeWidth="12"
                              strokeDasharray="251.2"
                              strokeDashoffset="251.2"
                              strokeLinecap="round"
                              initial={{ strokeDashoffset: 251.2 }}
                              animate={{ strokeDashoffset: 251.2 * (1 - 0.3) }} // 30% filled
                              transition={{ duration: 1.5, delay: 1.2, type: "spring" }}
                              style={{ rotate: 162 }} // Start after 45% (360 * 0.45 = 162deg)
                            />

                            {/* Cash Segment (Cyan) - 25% */}
                            <motion.circle
                              cx="50"
                              cy="50"
                              r="40"
                              fill="none"
                              stroke="rgb(6, 182, 212)"
                              strokeWidth="12"
                              strokeDasharray="251.2"
                              strokeDashoffset="251.2"
                              strokeLinecap="round"
                              initial={{ strokeDashoffset: 251.2 }}
                              animate={{ strokeDashoffset: 251.2 * (1 - 0.25) }} // 25% filled
                              transition={{ duration: 1.5, delay: 1.4, type: "spring" }}
                              style={{ rotate: 270 }} // Start after 45+30=75% (360 * 0.75 = 270deg)
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center flex-col">
                            <span className="text-[10px] text-zinc-500">Total</span>
                            <span className="text-xs font-bold text-white">$847k</span>
                          </div>
                        </div>
                      </div>

                      {/* Legend */}
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                            <span className="text-zinc-400">Crypto</span>
                          </div>
                          <span className="font-medium text-zinc-300">45%</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span className="text-zinc-400">Stocks</span>
                          </div>
                          <span className="font-medium text-zinc-300">30%</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                            <span className="text-zinc-400">Cash</span>
                          </div>
                          <span className="font-medium text-zinc-300">25%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Floating decorative elements */}
          <motion.div
            className="absolute -right-6 top-1/4 w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/80 to-pink-500/80 backdrop-blur-sm border border-white/10 shadow-xl flex items-center justify-center"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <span className="text-2xl font-bold text-white">📈</span>
          </motion.div>

          <motion.div
            className="absolute -left-4 bottom-1/4 w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500/80 to-cyan-500/80 backdrop-blur-sm border border-white/10 shadow-xl flex items-center justify-center"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          >
            <span className="text-xl font-bold text-white">💰</span>
          </motion.div>
        </motion.div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="mt-20 grid grid-cols-3 gap-8 max-w-3xl mx-auto"
        >
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div
                className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent mb-2"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                <AnimatedCounter value={stat.value} suffix={stat.suffix} />
              </div>
              <div className="text-sm text-zinc-500">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* CSS for gradient animation */}
      <style jsx>{`
        @keyframes gradient {
          0%,
          100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        .animate-gradient {
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </section>
  );
}
