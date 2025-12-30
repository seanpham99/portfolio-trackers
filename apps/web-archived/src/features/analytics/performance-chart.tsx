import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  type TooltipProps as RechartsTooltipProps,
} from "recharts";
import { format } from "date-fns";
import type { PerformanceDataPoint } from "./analytics.types";

interface PerformanceChartProps {
  data: PerformanceDataPoint[];
  currency: string;
}

function CustomTooltip({
  active,
  payload,
  currency,
}: {
  active?: boolean;
  payload?: any;
  currency: string;
}) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const data = payload[0].payload as PerformanceDataPoint & {
    timestamp: number;
  };
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatChange = (value: number) => {
    const sign = value >= 0 ? "+" : "";
    return `${sign}${formatCurrency(value)}`;
  };

  const isPositive = data.changeFromPrevious >= 0;

  return (
    <div className="rounded-lg border border-white/12 bg-zinc-900 p-3 shadow-xl">
      <div className="mb-2 text-xs font-medium text-zinc-500">
        {format(data.date, "MMM dd, yyyy")}
      </div>
      <div className="mb-1 text-sm font-semibold text-white">
        {formatCurrency(data.value)}
      </div>
      {data.changeFromPrevious !== 0 && (
        <div
          className={`text-xs font-medium ${
            isPositive ? "text-green-600" : "text-red-600"
          }`}
        >
          {formatChange(data.changeFromPrevious)} from previous
        </div>
      )}
    </div>
  );
}

export function PerformanceChart({ data, currency }: PerformanceChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  };

  // Prepare data for Recharts - convert Date to timestamp for X-axis
  const chartData = data.map((point) => ({
    ...point,
    timestamp: point.date.getTime(),
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="rounded-xl border border-white/6 bg-zinc-900/50 p-6"
    >
      <h3 className="mb-4 text-lg font-semibold text-white">
        Portfolio Performance
      </h3>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart
          data={chartData}
          aria-label="Portfolio performance over time"
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" opacity={0.5} />
          <XAxis
            dataKey="timestamp"
            tickFormatter={(timestamp) => format(new Date(timestamp), "MMM dd")}
            stroke="#71717a"
            style={{ fontSize: "12px" }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatCurrency}
            stroke="#71717a"
            style={{ fontSize: "12px" }}
            tickLine={false}
            width={80}
          />
          <Tooltip
            content={(props) => (
              <CustomTooltip {...props} currency={currency} />
            )}
            cursor={{ stroke: "#52525b", strokeWidth: 1 }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="hsl(160, 84%, 39%)"
            strokeWidth={2}
            dot={false}
            animationDuration={500}
            animationEasing="ease-out"
          />
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
