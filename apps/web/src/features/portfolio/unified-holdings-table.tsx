import React, { useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
} from "@tanstack/react-table";
import {
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Filter,
  Info,
  Briefcase,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { useHoldings } from "@/features/portfolio/hooks/use-holdings";
import { HoldingDto as Holding, CalculationMethod } from "@workspace/shared-types/api";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@workspace/ui/components/hover-card";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@workspace/ui/components/empty";
import { Button } from "@workspace/ui/components/button";

const columnHelper = createColumnHelper<Holding>();

interface UnifiedHoldingsTableProps {
  portfolioId?: string;
  onAddAsset?: () => void;
}

export function UnifiedHoldingsTable({ portfolioId, onAddAsset }: UnifiedHoldingsTableProps) {
  const { data: allHoldings = [], isLoading, isError } = useHoldings(portfolioId);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [filter, setFilter] = useState<"ALL" | "VN" | "US" | "CRYPTO">("ALL");

  const holdings = useMemo(() => {
    if (filter === "ALL") return allHoldings;
    return allHoldings.filter((h) => {
      const type = (h.asset_class || "").toLowerCase();
      const market = (h.market || "").toUpperCase();

      if (filter === "VN") return market === "VN" || type.includes("stock");
      if (filter === "US") return market === "US" || type.includes("us") || type.includes("equity");
      if (filter === "CRYPTO") return market === "CRYPTO" || type.includes("crypto");
      return true;
    });
  }, [allHoldings, filter]);

  // Methodology content helper
  const getMethodologyContent = (calculationMethod?: CalculationMethod) => {
    const METHODOLOGY_CONTENT: Record<CalculationMethod, { title: string; formula: string }> = {
      [CalculationMethod.WEIGHTED_AVG]: {
        title: "Weighted Average Cost Basis",
        formula: "Avg Cost = Total Cost / Total Quantity",
      },
      [CalculationMethod.FIFO]: {
        title: "First-In, First-Out (FIFO)",
        formula: "Cost Basis = Oldest Purchased Shares Sold First",
      },
    };

    return calculationMethod ? METHODOLOGY_CONTENT[calculationMethod] : null;
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor("symbol", {
        header: "Asset",
        cell: (info) => (
          <Link
            href={`/portfolio/${portfolioId || "all"}/asset/${info.getValue()}`}
            className="flex items-center gap-3 transition-colors hover:opacity-80 group"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-xs font-medium text-white group-hover:bg-white/10 transition-colors">
              {info.getValue()[0]}
            </div>
            <div>
              <div className="font-medium text-white group-hover:text-emerald-400 transition-colors">
                {info.getValue()}
              </div>
              <div className="text-xs text-zinc-500">{info.row.original.name}</div>
            </div>
          </Link>
        ),
      }),
      columnHelper.accessor("asset_class", {
        header: "Type",
        cell: (info) => {
          const type = info.getValue();
          const market = info.row.original.market;
          let badgeClass = "bg-zinc-500/10 text-zinc-400";
          let label = type || "Unknown";

          // Badge logic (AC 4)
          if (market === "VN" || type?.includes("Stock")) {
            badgeClass = "bg-red-500/10 text-red-400";
            label = "VN Stock";
          } else if (market === "US" || type?.includes("Equity")) {
            badgeClass = "bg-blue-500/10 text-blue-400";
            label = "US Equity";
          } else if (market === "CRYPTO" || type === "Crypto") {
            badgeClass = "bg-amber-500/10 text-amber-400";
            label = "Crypto";
          }

          return (
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${badgeClass}`}
            >
              {label}
            </span>
          );
        },
      }),
      columnHelper.accessor("price", {
        header: () => <div className="text-right">Price</div>,
        cell: (info) => (
          <div className="text-right tabular-nums text-zinc-300">
            {info.getValue()
              ? new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                }).format(info.getValue()!)
              : "-"}
          </div>
        ),
      }),
      columnHelper.accessor("pl_percent", {
        // 24h %
        header: () => <div className="text-right">24h Change</div>,
        cell: (info) => {
          const val = info.getValue();
          if (val === undefined) return <div className="text-right text-zinc-500">-</div>;
          return (
            <div
              className={`flex items-center justify-end gap-1 ${val >= 0 ? "text-emerald-400" : "text-rose-400"}`}
            >
              {val >= 0 ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : (
                <ArrowDownRight className="h-3 w-3" />
              )}
              {Math.abs(val).toFixed(2)}%
            </div>
          );
        },
      }),
      columnHelper.accessor("value", {
        header: () => <div className="text-right">Value (USD)</div>,
        cell: (info) => {
          const val = info.getValue();
          const qty = info.row.original.total_quantity;
          const px = info.row.original.price;
          const computed = val ?? (qty && px ? qty * px : undefined);
          return (
            <div className="text-right font-medium tabular-nums text-white">
              {computed
                ? new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                  }).format(computed)
                : "-"}
            </div>
          );
        },
      }),
      columnHelper.accessor("pl", {
        header: () => (
          <div className="flex items-center justify-end gap-1.5">
            <span>P/L</span>
            <HoverCard>
              <HoverCardTrigger asChild>
                <button
                  aria-label="View methodology for P/L calculation"
                  className="inline-flex items-center justify-center text-zinc-500 hover:text-zinc-300 transition-colors"
                  tabIndex={0}
                >
                  <Info className="h-3.5 w-3.5" />
                </button>
              </HoverCardTrigger>
              <HoverCardContent side="top" className="max-w-xs">
                <div className="space-y-1.5">
                  <p className="text-xs font-medium">Cost Basis Calculation</p>
                  <p className="text-xs text-zinc-400">
                    Hover over a row to see specific methodology and data source for that asset.
                  </p>
                </div>
              </HoverCardContent>
            </HoverCard>
          </div>
        ),
        cell: (info) => {
          const val = info.getValue();
          const holding = info.row.original;
          const methodologyContent = getMethodologyContent(holding.calculationMethod);

          if (val === undefined) return <div className="text-right text-zinc-500">-</div>;

          return (
            <div className="flex items-center justify-end gap-1.5">
              <div
                className={`text-right tabular-nums ${val >= 0 ? "text-emerald-400" : "text-rose-400"}`}
              >
                {val >= 0 ? "+" : ""}
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                }).format(val)}
              </div>
              {methodologyContent && (
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <button
                      aria-label="View methodology for this asset"
                      className="inline-flex items-center justify-center text-zinc-500 hover:text-zinc-300 transition-colors"
                      tabIndex={0}
                    >
                      <Info className="h-3.5 w-3.5" />
                    </button>
                  </HoverCardTrigger>
                  <HoverCardContent side="left" className="max-w-xs">
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs font-medium text-white">{methodologyContent.title}</p>
                        <p className="text-xs text-zinc-400 mt-1">
                          Formula: {methodologyContent.formula}
                        </p>
                      </div>
                      {holding.dataSource && (
                        <div className="pt-2 border-t border-white/10">
                          <p className="text-xs text-zinc-500">
                            <span className="font-medium">Data Source:</span> {holding.dataSource}
                          </p>
                        </div>
                      )}
                    </div>
                  </HoverCardContent>
                </HoverCard>
              )}
            </div>
          );
        },
      }),
    ],
    []
  );

  const table = useReactTable({
    data: holdings,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="w-full rounded-xl border border-white/5 bg-zinc-900/50">
      <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
        <h3 className="font-serif text-lg font-light text-white">Holdings</h3>
        <div className="flex items-center gap-3">
          {onAddAsset && (
            <Button
              variant="outline"
              size="sm"
              onClick={onAddAsset}
              className="h-8 gap-1.5 border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Asset
            </Button>
          )}
          <button className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-white/10">
            <TrendingUp className="h-3.5 w-3.5" />
            Analytics
          </button>
        </div>
      </div>

      {/* Filters (AC 5) */}
      <div className="flex items-center gap-2 border-b border-white/5 px-6 py-3 bg-white/2">
        <Filter className="w-3.5 h-3.5 text-zinc-500" />
        <span className="text-xs font-medium text-zinc-500 mr-2">Filter by:</span>
        {(["ALL", "VN", "US", "CRYPTO"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors ${
              filter === f ? "bg-white/10 text-white" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {f === "ALL" ? "All Assets" : f === "VN" ? "🇻🇳 VN" : f === "US" ? "🇺🇸 US" : "₿ Crypto"}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-white/5 text-xs text-zinc-500">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-6 py-3 font-medium cursor-pointer hover:text-zinc-300"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-white/5">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="p-0">
                  <div className="flex items-center justify-center py-12 text-zinc-500">
                    <div className="animate-pulse flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-zinc-500"></div>
                      <div className="h-2 w-2 rounded-full bg-zinc-500 animation-delay-150"></div>
                      <div className="h-2 w-2 rounded-full bg-zinc-500 animation-delay-300"></div>
                    </div>
                    <span className="ml-3">Loading holdings...</span>
                  </div>
                </td>
              </tr>
            ) : isError || holdings.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-0">
                  <Empty className="py-12">
                    <EmptyHeader>
                      <EmptyMedia variant="icon" className="bg-zinc-800 text-zinc-400">
                        <Briefcase className="h-5 w-5" />
                      </EmptyMedia>
                      <EmptyTitle className="text-white">No holdings yet</EmptyTitle>
                      <EmptyDescription>
                        Start building your portfolio by adding your first transaction.
                      </EmptyDescription>
                    </EmptyHeader>
                    <EmptyContent>
                      {onAddAsset ? (
                        <Button size="sm" className="gap-1.5" onClick={onAddAsset}>
                          <Plus className="h-4 w-4" />
                          Add Transaction
                        </Button>
                      ) : (
                        <Button asChild size="sm" className="gap-1.5">
                          <Link href="/transactions/new">
                            <Plus className="h-4 w-4" />
                            Add Transaction
                          </Link>
                        </Button>
                      )}
                    </EmptyContent>
                  </Empty>
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="group hover:bg-white/5 transition-colors">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-6 py-4">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
