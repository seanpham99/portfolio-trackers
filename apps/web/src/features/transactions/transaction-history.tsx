"use client";

import { History, ArrowUpRight, ArrowDownRight } from "lucide-react";

import { usePortfolioStore } from "@/stores/portfolio-store";
import { GlassCard } from "@/components/glass-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/table";
import { ScrollArea } from "@repo/ui/components/scroll-area";
import { cn } from "@repo/ui/lib/utils";

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function TransactionHistory() {
  const { transactions } = usePortfolioStore();

  if (transactions.length === 0) {
    return (
      <GlassCard className="p-6" hover={false}>
        <div className="flex items-center gap-2 mb-4">
          <History className="h-5 w-5 text-zinc-500" />
          <h3 className="text-lg font-medium text-white">
            Transaction History
          </h3>
        </div>
        <div className="py-8 text-center text-sm text-zinc-500">
          No transactions yet. Buy or sell assets to see your history.
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-0 overflow-hidden" hover={false}>
      <div className="flex items-center gap-2 p-6 pb-4 border-b border-white/[0.08]">
        <History className="h-5 w-5 text-zinc-500" />
        <h3 className="text-lg font-medium text-white">Transaction History</h3>
      </div>
      <ScrollArea className="h-[300px]">
        <Table>
          <TableHeader className="bg-white/[0.02]">
            <TableRow className="border-white/[0.08] hover:bg-transparent">
              <TableHead className="text-zinc-500 w-[100px]">Type</TableHead>
              <TableHead className="text-zinc-500">Asset</TableHead>
              <TableHead className="text-zinc-500 text-right">Price</TableHead>
              <TableHead className="text-zinc-500 text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((tx) => {
              const isBuy = tx.type === "buy";
              return (
                <TableRow
                  key={tx.id}
                  className="border-white/[0.05] hover:bg-white/[0.04] transition-colors"
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "flex h-6 w-6 items-center justify-center rounded-md",
                          isBuy
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-rose-500/10 text-rose-400",
                        )}
                      >
                        {isBuy ? (
                          <ArrowUpRight className="h-3 w-3" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3" />
                        )}
                      </div>
                      <span
                        className={cn(
                          "text-xs font-medium uppercase",
                          isBuy ? "text-emerald-400" : "text-rose-400",
                        )}
                      >
                        {tx.type}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium text-white">{tx.symbol}</div>
                      <div className="text-xs text-zinc-500">
                        {formatDate(tx.timestamp)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="text-sm text-white">
                      {tx.quantity} <span className="text-zinc-500">@</span> $
                      {tx.price.toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div
                      className={cn(
                        "font-medium",
                        isBuy ? "text-emerald-400" : "text-rose-400",
                      )}
                    >
                      {isBuy ? "-" : "+"}$
                      {tx.total.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </ScrollArea>
    </GlassCard>
  );
}
