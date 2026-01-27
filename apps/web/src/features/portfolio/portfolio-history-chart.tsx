import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { useState } from "react";
import { usePortfolioHistory } from "./hooks/use-history";
import { format } from "date-fns";

type Range = "1D" | "1W" | "1M" | "3M" | "1Y" | "ALL";

interface PortfolioHistoryChartProps {
  portfolioId?: string;
}

export function PortfolioHistoryChart({ portfolioId }: PortfolioHistoryChartProps) {
  const [range, setRange] = useState<Range>("1M");
  const { data: history, isPending, isLoading } = usePortfolioHistory(portfolioId, { range });

  const gradientId = `colorValue-${portfolioId || "default"}`;

  // Format data for chart
  const chartData =
    history?.map((snapshot) => ({
      date: snapshot.timestamp,
      value: snapshot.net_worth,
    })) || [];

  const handleRangeChange = (newRange: Range) => {
    setRange(newRange);
  };

  const hasData = chartData.length > 0;

  return (
    <div className="h-[400px] w-full rounded-xl border border-white/5 bg-zinc-900/50 p-6 backdrop-blur-sm">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="font-serif text-lg font-light text-white">Net Worth History</h3>
          <p className="text-sm text-zinc-500">
            {isLoading
              ? "Loading..."
              : hasData
                ? "Portfolio performance over time"
                : "No history available yet"}
          </p>
        </div>
        <div className="flex gap-2 rounded-lg bg-zinc-900/50 p-1">
          {(["1D", "1W", "1M", "3M", "1Y", "ALL"] as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => handleRangeChange(r)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
                range === r
                  ? "bg-white/10 text-white shadow-sm"
                  : "text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[300px] w-full">
        {isLoading ? (
          <div className="flex h-full w-full items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          </div>
        ) : !hasData ? (
          <div className="flex h-full w-full flex-col items-center justify-center text-zinc-500">
            <p>No snapshots recorded yet.</p>
            <p className="text-xs">History builds up over time.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="#52525b"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(date) => {
                  if (!date) return "";
                  // Handle potential space in date string from DB
                  const d = new Date(typeof date === "string" ? date.replace(" ", "T") : date);
                  if (isNaN(d.getTime())) return "";

                  if (range === "1D") return format(d, "HH:mm");
                  if (range === "1W" || range === "1M") return format(d, "MMM dd");
                  return format(d, "MMM yyyy");
                }}
                minTickGap={30}
              />
              <YAxis
                stroke="#52525b"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) =>
                  `$${value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}`
                }
                width={60}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#18181b",
                  borderColor: "#27272a",
                  color: "#fff",
                  borderRadius: "0.5rem",
                  padding: "0.5rem",
                }}
                itemStyle={{ color: "#fff" }}
                formatter={(value: number) => [
                  `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                  "Net Worth",
                ]}
                labelFormatter={(label) => {
                  if (!label) return "";
                  const d = new Date(typeof label === "string" ? label.replace(" ", "T") : label);
                  return isNaN(d.getTime()) ? "" : format(d, "PPpp");
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill={`url(#${gradientId})`}
                animationDuration={500}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
