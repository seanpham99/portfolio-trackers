"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Brain,
  TrendingUp,
  PieChart,
  Lightbulb,
  Activity,
  Target,
  BarChart2,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { GlassCard } from "./glass-card";
import type { JSX } from "react/jsx-runtime"; // Import JSX to fix the undeclared variable error

interface AnalyticsOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  stages: Stage[];
  netWorthData: number[];
  insights: string[];
}

function calculateMetrics(data: number[]) {
  const returns = data.slice(1).map((val, i) => (val - data[i]) / data[i]);
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance =
    returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) /
    returns.length;
  const volatility = Math.sqrt(variance) * Math.sqrt(252) * 100;
  const sharpeRatio = (avgReturn * 252) / (volatility / 100);
  const maxDrawdown = calculateMaxDrawdown(data);
  const ytdReturn = ((data[data.length - 1] - data[0]) / data[0]) * 100;

  return { volatility, sharpeRatio, maxDrawdown, ytdReturn };
}

function calculateMaxDrawdown(data: number[]): number {
  let maxDrawdown = 0;
  let peak = data[0];
  for (const value of data) {
    if (value > peak) peak = value;
    const drawdown = ((peak - value) / peak) * 100;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  }
  return maxDrawdown;
}

const benchmarkData = {
  "S&P 500": { return: 18.2, color: "#3b82f6" },
  BTC: { return: 45.3, color: "#f59e0b" },
  Bonds: { return: 4.2, color: "#6b7280" },
};

export function AnalyticsOverlay({
  isOpen,
  onClose,
  stages,
  netWorthData,
  insights,
}: AnalyticsOverlayProps) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "performance" | "allocation"
  >("overview");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const totalValue = stages.reduce((sum, s) => sum + s.totalValue, 0);
  const metrics = calculateMetrics(netWorthData);

  const equityStage = stages.find((s) => s.id === "equities");
  const sectorBreakdown = [
    { name: "Technology", percentage: 65, color: "#10b981" },
    { name: "Consumer", percentage: 20, color: "#6366f1" },
    { name: "Automotive", percentage: 15, color: "#f43f5e" },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 overflow-y-auto bg-black/90 backdrop-blur-md"
        >
          <div className="min-h-screen p-8">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="font-serif text-4xl font-light text-white">
                  Portfolio Intelligence
                </h1>
                <p className="mt-2 text-zinc-500">
                  Real-time analytics and AI-powered insights
                </p>
              </div>
              <button
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 transition-colors hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-6 flex gap-2">
              {[
                { id: "overview", label: "Overview", icon: BarChart2 },
                { id: "performance", label: "Performance", icon: Activity },
                { id: "allocation", label: "Allocation", icon: PieChart },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as typeof activeTab)}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${activeTab === id
                      ? "bg-white/10 text-white"
                      : "text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
                    }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>

            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="grid gap-6 lg:grid-cols-3">
                {/* Net Worth Trajectory */}
                <GlassCard className="p-6 lg:col-span-2" hover={false}>
                  <div className="mb-4 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-emerald-400" />
                    <h3 className="text-lg font-medium text-white">
                      Net Worth Trajectory
                    </h3>
                  </div>
                  <div className="mt-4 flex items-end justify-between">
                    <div>
                      <p className="text-3xl font-semibold tabular-nums text-white">
                        $
                        {totalValue.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                      <p className="text-sm text-zinc-500">
                        Total Portfolio Value
                      </p>
                    </div>
                    <div
                      className={`rounded-full px-3 py-1 text-sm font-medium ${metrics.ytdReturn >= 0
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-rose-500/10 text-rose-400"
                        }`}
                    >
                      {metrics.ytdReturn >= 0 ? "+" : ""}
                      {metrics.ytdReturn.toFixed(1)}% YTD
                    </div>
                  </div>
                </GlassCard>

                {/* Quick Metrics */}
                <GlassCard className="p-6" hover={false}>
                  <div className="mb-4 flex items-center gap-2">
                    <Target className="h-5 w-5 text-indigo-400" />
                    <h3 className="text-lg font-medium text-white">
                      Key Metrics
                    </h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between rounded-xl bg-white/[0.03] p-3">
                      <span className="text-sm text-zinc-400">
                        Sharpe Ratio
                      </span>
                      <span
                        className={`text-lg font-semibold tabular-nums ${metrics.sharpeRatio >= 1
                            ? "text-emerald-400"
                            : "text-amber-400"
                          }`}
                      >
                        {metrics.sharpeRatio.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-white/[0.03] p-3">
                      <span className="text-sm text-zinc-400">Volatility</span>
                      <span className="text-lg font-semibold tabular-nums text-zinc-300">
                        {metrics.volatility.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-white/[0.03] p-3">
                      <span className="text-sm text-zinc-400">
                        Max Drawdown
                      </span>
                      <span className="text-lg font-semibold tabular-nums text-rose-400">
                        -{metrics.maxDrawdown.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </GlassCard>

                {/* AI Insights */}
                <GlassCard className="p-6 lg:col-span-3" hover={false}>
                  <div className="mb-4 flex items-center gap-2">
                    <Brain className="h-5 w-5 text-violet-400" />
                    <h3 className="text-lg font-medium text-white">
                      AI Insights
                    </h3>
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    {insights.map((insight, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex gap-3 rounded-xl bg-white/[0.03] p-4"
                      >
                        <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                        <p className="text-sm leading-relaxed text-zinc-300">
                          {insight}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </GlassCard>
              </div>
            )}

            {/* Performance Tab */}
            {activeTab === "performance" && (
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Benchmark Comparison */}
                <GlassCard className="p-6" hover={false}>
                  <div className="mb-4 flex items-center gap-2">
                    <Activity className="h-5 w-5 text-emerald-400" />
                    <h3 className="text-lg font-medium text-white">
                      vs Benchmarks
                    </h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between rounded-xl bg-emerald-500/10 p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20">
                          <span className="text-lg font-semibold text-emerald-400">
                            F
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-white">
                            Your Portfolio
                          </p>
                          <p className="text-xs text-zinc-500">
                            YTD Performance
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xl font-semibold text-emerald-400">
                        <ArrowUpRight className="h-5 w-5" />+
                        {metrics.ytdReturn.toFixed(1)}%
                      </div>
                    </div>
                    {Object.entries(benchmarkData).map(
                      ([name, { return: ret, color }]) => (
                        <div
                          key={name}
                          className="flex items-center justify-between rounded-xl bg-white/[0.03] p-4"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="flex h-10 w-10 items-center justify-center rounded-xl"
                              style={{ backgroundColor: `${color}20` }}
                            >
                              <span
                                className="text-sm font-semibold"
                                style={{ color }}
                              >
                                {name[0]}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-zinc-300">
                                {name}
                              </p>
                              <p className="text-xs text-zinc-500">Benchmark</p>
                            </div>
                          </div>
                          <div
                            className={`flex items-center gap-1 text-lg font-semibold ${ret >= metrics.ytdReturn
                                ? "text-zinc-400"
                                : "text-zinc-500"
                              }`}
                          >
                            {ret >= 0 ? (
                              <ArrowUpRight className="h-4 w-4" />
                            ) : (
                              <ArrowDownRight className="h-4 w-4" />
                            )}
                            {ret >= 0 ? "+" : ""}
                            {ret}%
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </GlassCard>

                {/* Detailed Metrics */}
                <GlassCard className="p-6" hover={false}>
                  <div className="mb-4 flex items-center gap-2">
                    <BarChart2 className="h-5 w-5 text-indigo-400" />
                    <h3 className="text-lg font-medium text-white">
                      Risk Analysis
                    </h3>
                  </div>
                  <div className="space-y-6">
                    {/* Sharpe Ratio Gauge */}
                    <div>
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="text-zinc-400">Sharpe Ratio</span>
                        <span className="font-medium text-white">
                          {metrics.sharpeRatio.toFixed(2)}
                        </span>
                      </div>
                      <div className="relative h-3 rounded-full bg-white/5">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{
                            width: `${Math.min((metrics.sharpeRatio / 3) * 100, 100)}%`,
                          }}
                          className="h-full rounded-full bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500"
                        />
                        <div className="absolute -top-6 flex w-full justify-between text-[10px] text-zinc-600">
                          <span>Poor</span>
                          <span>Good</span>
                          <span>Excellent</span>
                        </div>
                      </div>
                    </div>

                    {/* Volatility */}
                    <div>
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="text-zinc-400">Annual Volatility</span>
                        <span className="font-medium text-white">
                          {metrics.volatility.toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-3 overflow-hidden rounded-full bg-white/5">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{
                            width: `${Math.min((metrics.volatility / 50) * 100, 100)}%`,
                          }}
                          className="h-full rounded-full bg-amber-500"
                        />
                      </div>
                    </div>

                    {/* Max Drawdown */}
                    <div>
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="text-zinc-400">Maximum Drawdown</span>
                        <span className="font-medium text-rose-400">
                          -{metrics.maxDrawdown.toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-3 overflow-hidden rounded-full bg-white/5">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{
                            width: `${Math.min((metrics.maxDrawdown / 30) * 100, 100)}%`,
                          }}
                          className="h-full rounded-full bg-rose-500"
                        />
                      </div>
                    </div>

                    {/* Beta */}
                    <div className="rounded-xl bg-white/[0.03] p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-zinc-400">
                            Portfolio Beta
                          </p>
                          <p className="text-xs text-zinc-600">vs S&P 500</p>
                        </div>
                        <span className="text-2xl font-semibold tabular-nums text-indigo-400">
                          1.24
                        </span>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </div>
            )}

            {/* Allocation Tab */}
            {activeTab === "allocation" && (
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Asset Class Allocation */}
                <GlassCard className="p-6" hover={false}>
                  <div className="mb-4 flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-indigo-400" />
                    <h3 className="text-lg font-medium text-white">
                      Asset Classes
                    </h3>
                  </div>
                  <div className="space-y-4">
                    {stages.map((stage, i) => {
                      const percentage = (stage.totalValue / totalValue) * 100;
                      const colors = ["#10b981", "#6366f1", "#f59e0b"];
                      return (
                        <div key={stage.id}>
                          <div className="mb-2 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div
                                className="h-3 w-3 rounded-full"
                                style={{ backgroundColor: colors[i] }}
                              />
                              <span className="text-sm text-zinc-300">
                                {stage.name}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-sm font-medium tabular-nums text-white">
                                {percentage.toFixed(1)}%
                              </span>
                              <span className="ml-2 text-xs text-zinc-500">
                                ${(stage.totalValue / 1000).toFixed(1)}K
                              </span>
                            </div>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-white/5">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              transition={{ duration: 0.8, delay: i * 0.1 }}
                              className="h-full rounded-full"
                              style={{ backgroundColor: colors[i] }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Visual Pie */}
                  <div className="mt-8 flex justify-center">
                    <svg width="200" height="200" viewBox="0 0 200 200">
                      {
                        stages.reduce(
                          (acc, stage, i) => {
                            const percentage =
                              (stage.totalValue / totalValue) * 100;
                            const colors = ["#10b981", "#6366f1", "#f59e0b"];
                            const startAngle = acc.angle;
                            const endAngle =
                              startAngle + (percentage / 100) * 360;
                            const largeArc = percentage > 50 ? 1 : 0;
                            const startRad =
                              (startAngle - 90) * (Math.PI / 180);
                            const endRad = (endAngle - 90) * (Math.PI / 180);
                            const x1 = 100 + 80 * Math.cos(startRad);
                            const y1 = 100 + 80 * Math.sin(startRad);
                            const x2 = 100 + 80 * Math.cos(endRad);
                            const y2 = 100 + 80 * Math.sin(endRad);

                            acc.paths.push(
                              <motion.path
                                key={stage.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: i * 0.2 }}
                                d={`M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} Z`}
                                fill={colors[i]}
                                stroke="#0a0a0b"
                                strokeWidth="2"
                              />,
                            );
                            acc.angle = endAngle;
                            return acc;
                          },
                          { paths: [] as JSX.Element[], angle: 0 },
                        ).paths
                      }
                      <circle cx="100" cy="100" r="50" fill="#0a0a0b" />
                      <text
                        x="100"
                        y="95"
                        textAnchor="middle"
                        className="fill-white text-2xl font-medium"
                      >
                        ${(totalValue / 1000).toFixed(0)}K
                      </text>
                      <text
                        x="100"
                        y="115"
                        textAnchor="middle"
                        className="fill-zinc-500 text-xs"
                      >
                        Total Value
                      </text>
                    </svg>
                  </div>
                </GlassCard>

                {/* Sector Breakdown */}
                <GlassCard className="p-6" hover={false}>
                  <div className="mb-4 flex items-center gap-2">
                    <BarChart2 className="h-5 w-5 text-emerald-400" />
                    <h3 className="text-lg font-medium text-white">
                      Equity Sectors
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {sectorBreakdown.map((sector, i) => (
                      <motion.div
                        key={sector.name}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex items-center gap-4"
                      >
                        <div className="w-24 text-sm text-zinc-400">
                          {sector.name}
                        </div>
                        <div className="flex-1 h-8 overflow-hidden rounded-lg bg-white/5">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${sector.percentage}%` }}
                            transition={{ duration: 0.8, delay: i * 0.1 }}
                            className="h-full rounded-lg flex items-center justify-end pr-2"
                            style={{ backgroundColor: sector.color }}
                          >
                            <span className="text-xs font-medium text-white">
                              {sector.percentage}%
                            </span>
                          </motion.div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Top Holdings */}
                  <div className="mt-8">
                    <h4 className="mb-4 text-sm font-medium text-zinc-400">
                      Top Holdings
                    </h4>
                    <div className="space-y-2">
                      {equityStage?.assets.slice(0, 5).map((asset, i) => (
                        <div
                          key={asset.id}
                          className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-zinc-600">
                              {i + 1}
                            </span>
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.05] text-sm font-medium text-zinc-300">
                              {asset.symbol.slice(0, 2)}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-zinc-300">
                                {asset.symbol}
                              </p>
                              <p className="text-xs text-zinc-600">
                                {asset.name}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium tabular-nums text-white">
                              $
                              {asset.value.toLocaleString("en-US", {
                                maximumFractionDigits: 0,
                              })}
                            </p>
                            <p
                              className={`text-xs ${asset.change >= 0 ? "text-emerald-400" : "text-rose-400"}`}
                            >
                              {asset.change >= 0 ? "+" : ""}
                              {asset.change.toFixed(2)}%
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </GlassCard>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
