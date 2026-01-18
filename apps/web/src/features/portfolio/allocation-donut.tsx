import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

// Data moved to props

interface AllocationItem {
  label: string;
  value: number;
  color: string;
}

interface AllocationDonutProps {
  portfolioId?: string;
  allocation?: AllocationItem[];
}

export function AllocationDonut({ portfolioId, allocation = [] }: AllocationDonutProps) {
  // Use real data if provided, otherwise empty
  const hasData = allocation && allocation.length > 0;

  // Transform for chart if needed, or use directly
  const chartData = hasData
    ? allocation.map((item) => ({ name: item.label, value: item.value, color: item.color }))
    : [];

  if (!hasData) {
    return (
      <div className="h-[400px] w-full rounded-xl border border-white/5 bg-zinc-900/50 p-6 flex items-center justify-center">
        <p className="text-zinc-500">No allocation data available</p>
      </div>
    );
  }

  return (
    <div className="h-[400px] w-full rounded-xl border border-white/5 bg-zinc-900/50 p-6">
      <h3 className="mb-4 font-serif text-lg font-light text-white">Allocation</h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={80}
              outerRadius={100}
              paddingAngle={5}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "#18181b",
                borderColor: "#27272a",
                color: "#fff",
              }}
              itemStyle={{ color: "#fff" }}
              formatter={(value: number) =>
                new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                }).format(value / 25000)
              } // Rough conversion for demo
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-[-20px] flex justify-center gap-4 text-xs flex-wrap">
        {chartData.map((entry, index) => (
          <div key={entry.name} className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-zinc-400">{entry.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
