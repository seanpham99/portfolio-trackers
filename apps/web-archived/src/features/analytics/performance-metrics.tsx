import { motion } from "framer-motion";
import type { PerformanceMetrics } from "./analytics.types";
import { TrendingUp, TrendingDown } from "lucide-react";

interface PerformanceMetricsProps {
  metrics: PerformanceMetrics;
  currency: string;
}

export function PerformanceMetricsPanel({
  metrics,
  currency,
}: PerformanceMetricsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
  };

  const isPositive = metrics.totalChange >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="grid grid-cols-1 gap-4 md:grid-cols-3"
    >
      {/* Current Value */}
      <div className="rounded-xl border border-border-subtle bg-surface-glass p-6">
        <div className="mb-2 text-sm font-medium text-muted-foreground">
          Current Value
        </div>
        <div className="font-serif text-3xl font-light tracking-tight text-foreground">
          {formatCurrency(metrics.currentValue)}
        </div>
      </div>

      {/* Total Change */}
      <div className="rounded-xl border border-border-subtle bg-surface-glass p-6">
        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <span>Total Change</span>
          {isPositive ? (
            <TrendingUp className="h-4 w-4 text-green-600" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-600" />
          )}
        </div>
        <div
          className={`font-serif text-3xl font-light tracking-tight ${
            isPositive ? "text-green-600" : "text-red-600"
          }`}
        >
          {formatCurrency(metrics.totalChange)}
        </div>
      </div>

      {/* Percentage Change */}
      <div className="rounded-xl border border-border-subtle bg-surface-glass p-6">
        <div className="mb-2 text-sm font-medium text-muted-foreground">
          Return (%)
        </div>
        <div
          className={`font-serif text-3xl font-light tracking-tight ${
            isPositive ? "text-green-600" : "text-red-600"
          }`}
        >
          {formatPercentage(metrics.percentageChange)}
        </div>
      </div>
    </motion.div>
  );
}
