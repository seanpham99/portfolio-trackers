import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

// TODO: Replace with real API data in future story
const data = [
  { date: "2024-01", value: 45000 },
  { date: "2024-02", value: 47000 },
  { date: "2024-03", value: 46500 },
  { date: "2024-04", value: 52000 },
  { date: "2024-05", value: 58000 },
  { date: "2024-06", value: 56000 },
  { date: "2024-07", value: 61000 },
];

interface PortfolioHistoryChartProps {
  portfolioId?: string;
}

export function PortfolioHistoryChart({ portfolioId }: PortfolioHistoryChartProps) {
  // Generate unique gradient ID to avoid conflicts when multiple charts are rendered
  const gradientId = `colorValue-${portfolioId || "default"}`;

  return (
    <div className="h-[400px] w-full rounded-xl border border-white/5 bg-zinc-900/50 p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="font-serif text-lg font-light text-white">Net Worth History</h3>
          <p className="text-sm text-zinc-500">Placeholder data - real history coming soon</p>
        </div>
        <div className="flex gap-2">
          {["1D", "1W", "1M", "3M", "1Y", "ALL"].map((range) => (
            <button
              key={range}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                range === "1Y" ? "bg-white/10 text-white" : "text-zinc-500 hover:text-white"
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
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
            />
            <YAxis
              stroke="#52525b"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${value / 1000}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#18181b",
                borderColor: "#27272a",
                color: "#fff",
              }}
              itemStyle={{ color: "#fff" }}
              formatter={(value: number) => [`$${value.toLocaleString()}`, "Net Worth"]}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#10b981"
              strokeWidth={2}
              fillOpacity={1}
              fill={`url(#${gradientId})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
