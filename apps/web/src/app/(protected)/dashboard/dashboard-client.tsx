"use client";

import { useState } from "react";
import { usePortfolios } from "@/features/portfolio/hooks/use-portfolios";
import { PortfolioCard } from "@/features/portfolio/portfolio-card";
import { CreatePortfolioModal } from "@/features/portfolio/create-portfolio-modal";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  Plus,
  Briefcase,
  TrendingUp,
  PieChart as PieChartIcon,
  Activity,
  Wallet,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  YAxis,
  XAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// Mock data for the chart - to be replaced with real history data later
const MOCK_HISTORY_DATA = [
  { name: "Mon", value: 4000 },
  { name: "Tue", value: 3000 },
  { name: "Wed", value: 5000 },
  { name: "Thu", value: 4500 },
  { name: "Fri", value: 6800 },
  { name: "Sat", value: 6200 },
  { name: "Sun", value: 7490 },
];

const MOCK_ALLOCATION_DATA = [
  { name: "Stocks", value: 45, color: "#10b981" }, // Emerald 500
  { name: "Crypto", value: 35, color: "#6366f1" }, // Indigo 500
  { name: "Cash", value: 20, color: "#f59e0b" }, // Amber 500
];

export function DashboardClient() {
  const { data: portfolios, isLoading } = usePortfolios();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Calculate aggregates
  const totalNetWorth = portfolios?.reduce((acc, p) => acc + p.netWorth, 0) || 0;
  const totalChange24h = portfolios?.reduce((acc, p) => acc + p.change24h, 0) || 0;
  // Weighted average percent change roughly
  const totalChangePercent =
    totalNetWorth > 0 ? (totalChange24h / (totalNetWorth - totalChange24h)) * 100 : 0;

  const isPositive = totalChange24h >= 0;

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8 animate-pulse">
        <div className="h-10 w-48 bg-muted/20 rounded-lg" />
        <div className="h-64 w-full bg-muted/20 rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-muted/20 rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!portfolios?.length) {
    return (
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col h-[60vh] items-center justify-center rounded-3xl border border-border/50 bg-surface/50 backdrop-blur-xl p-8 text-center">
          <div className="bg-indigo-500/10 p-4 rounded-full mb-6">
            <Briefcase className="h-12 w-12 text-indigo-400" />
          </div>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-2xl font-bold text-foreground mb-2">Start Your Wealth Journey</h2>
            <p className="text-muted-foreground max-w-md mb-8">
              Create your first portfolio to begin tracking your assets, analyzing performance, and
              visualizing your net worth.
            </p>
            <Button
              size="lg"
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 px-8 py-6 text-lg rounded-full transition-all hover:scale-105"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Plus className="mr-2 h-5 w-5" /> Create First Portfolio
            </Button>
          </motion.div>
          <CreatePortfolioModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Dark Gradient Background for Premium Feel - managed by Layout now, but keeping container for spacing */}
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8 pb-12 pt-6">
        {/* Header Section */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl font-sans">
              Dashboard
            </h1>
            <p className="text-muted-foreground text-sm font-medium uppercase tracking-wider">
              Overview of your financial performance
            </p>
          </div>
          <Button
            size="lg"
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 transition-all hover:scale-105 rounded-full font-medium"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" /> New Portfolio
          </Button>
        </div>

        {/* Bento Grid - Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Net Worth Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="glass-card col-span-1 md:col-span-2 relative overflow-hidden p-6 md:p-8 group hover:border-indigo-500/30 transition-all duration-500"
          >
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <p className="text-sm font-medium  mb-2 flex items-center gap-2 uppercase tracking-wider">
                  <Wallet className="h-4 w-4" /> Total Net Worth
                </p>
                <div className="mt-2 flex items-baseline gap-2">
                  <h2 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight font-sans">
                    {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
                      totalNetWorth
                    )}
                  </h2>
                  <div
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium backdrop-blur-md border border-white/5 ${isPositive ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}
                  >
                    {isPositive ? (
                      <TrendingUp className="h-3.5 w-3.5" />
                    ) : (
                      <TrendingUp className="h-3.5 w-3.5 rotate-180" />
                    )}
                    {isPositive ? "+" : ""}
                    {new Intl.NumberFormat("en-US", {
                      style: "percent",
                      minimumFractionDigits: 2,
                    }).format(totalChangePercent / 100)}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {isPositive ? "+" : ""}
                  {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
                    totalChange24h
                  )}{" "}
                  <span className="opacity-60">in the last 24 hours</span>
                </p>
              </div>

              {/* Chart */}
              <div className="h-[220px] w-full mt-6 -mb-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={MOCK_HISTORY_DATA}
                    margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.03)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "#6b7280" }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "#6b7280" }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(24, 24, 27, 0.8)",
                        borderColor: "rgba(255,255,255,0.05)",
                        borderRadius: "12px",
                        backdropFilter: "blur(12px)",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                      itemStyle={{ color: "#fff" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#818cf8"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorTotal)"
                      animationDuration={1500}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Background Decoration */}
            <div className="absolute top-0 right-0 h-[400px] w-[400px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />
          </motion.div>

          {/* Side Cards Column */}
          <div className="grid grid-cols-1 gap-6">
            {/* Asset Allocation Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="glass-card p-6 relative overflow-hidden group hover:border-primary/30 transition-colors h-[220px] flex flex-col"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <PieChartIcon className="h-4 w-4 text-emerald-400" /> Allocation
                </h3>
              </div>
              <div className="flex-1 min-h-0 flex items-center gap-4">
                {/* Donut Chart */}
                <div className="w-1/2 h-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={MOCK_ALLOCATION_DATA}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={60}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {MOCK_ALLOCATION_DATA.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center Text */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-xs font-bold text-muted-foreground/50">MIX</span>
                  </div>
                </div>
                {/* Legend */}
                <div className="w-1/2 space-y-2">
                  {MOCK_ALLOCATION_DATA.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-muted-foreground text-sm">{item.name}</span>
                      </div>
                      <span className="font-medium text-foreground">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Performance/Best Performer Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="glass-card p-6 relative overflow-hidden group hover:border-primary/30 transition-colors h-[200px] flex flex-col"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Activity className="h-4 w-4 text-amber-400" /> Top Performer
                </h3>
                <span className="text-xs px-2 py-1 rounded-full bg-white/5 text-muted-foreground border border-white/5">
                  24h
                </span>
              </div>

              {portfolios && portfolios.length > 0 ? (
                (() => {
                  const best = [...portfolios].sort(
                    (a, b) => b.change24hPercent - a.change24hPercent
                  )[0];
                  if (!best) return null;
                  const topPerformer = {
                    name: best.name,
                    change: best.change24hPercent.toFixed(2),
                  };
                  return (
                    <div className="flex-1 flex flex-col justify-center">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-3xl font-bold text-foreground font-sans">
                          {parseFloat(topPerformer.change) > 0 ? "+" : ""}
                          {topPerformer.change}%
                        </span>
                        <Badge
                          variant="outline"
                          className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                        >
                          24h
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        User average: <span className="text-foreground">+4.2%</span>
                      </div>

                      <div className="h-1.5 w-full bg-muted/20 rounded-full mt-2 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: "100%" }}
                          transition={{ duration: 1, delay: 0.5 }}
                          className="h-full bg-linear-to-r from-emerald-500 to-teal-400"
                        />
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                  No data available
                </div>
              )}
            </motion.div>
          </div>
        </div>

        {/* Portfolios Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-semibold text-foreground">Your Portfolios</h2>
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground text-sm">
              View All
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {portfolios.map((p, index) => (
              <div key={p.id} className="h-full">
                <PortfolioCard portfolio={p} index={index} />
              </div>
            ))}
          </div>
        </div>

        <CreatePortfolioModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />
      </div>
    </div>
  );
}
