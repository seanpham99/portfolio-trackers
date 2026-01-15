import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

// TODO: Replace with real allocation data from API in future story
const data = [
  { name: "VN Stocks", value: 450000000 }, // Placeholder
  { name: "US Equities", value: 1250000000 }, // Placeholder
  { name: "Crypto", value: 200000000 }, // Placeholder
];

const COLORS = ["#10b981", "#3b82f6", "#f59e0b"]; // Emerald, Blue, Amber

interface AllocationDonutProps {
  portfolioId?: string;
}

export function AllocationDonut({ portfolioId }: AllocationDonutProps) {
  return (
    <div className="h-[400px] w-full rounded-xl border border-white/5 bg-zinc-900/50 p-6">
      <h3 className="mb-4 font-serif text-lg font-light text-white">Allocation</h3>
      <p className="mb-2 text-xs text-zinc-500">Placeholder data - real allocation coming soon</p>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={80}
              outerRadius={100}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
      <div className="mt-[-20px] flex justify-center gap-4 text-xs">
        {data.map((entry, index) => (
          <div key={entry.name} className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[index] }} />
            <span className="text-zinc-400">{entry.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
