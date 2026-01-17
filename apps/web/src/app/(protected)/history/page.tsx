"use client";

import { useState } from "react";
import { usePortfolios } from "@/features/portfolio/hooks/use-portfolios";
import {
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Filter,
  Calendar,
  Download,
  Clock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { Badge } from "@workspace/ui/components/badge";

// Mock transaction data - replace with API call when available
const mockTransactions = [
  {
    id: "1",
    date: "2026-01-15",
    type: "BUY",
    symbol: "AAPL",
    name: "Apple Inc.",
    quantity: 10,
    price: 185.5,
    total: 1855,
    portfolio: "Tech Growth",
  },
  {
    id: "2",
    date: "2026-01-14",
    type: "SELL",
    symbol: "GOOGL",
    name: "Alphabet Inc.",
    quantity: 5,
    price: 142.3,
    total: 711.5,
    portfolio: "Tech Growth",
  },
  {
    id: "3",
    date: "2026-01-12",
    type: "BUY",
    symbol: "BTC",
    name: "Bitcoin",
    quantity: 0.5,
    price: 42500,
    total: 21250,
    portfolio: "Crypto",
  },
  {
    id: "4",
    date: "2026-01-10",
    type: "BUY",
    symbol: "MSFT",
    name: "Microsoft Corp.",
    quantity: 15,
    price: 378.9,
    total: 5683.5,
    portfolio: "Tech Growth",
  },
  {
    id: "5",
    date: "2026-01-08",
    type: "SELL",
    symbol: "ETH",
    name: "Ethereum",
    quantity: 2,
    price: 2450,
    total: 4900,
    portfolio: "Crypto",
  },
];

export default function HistoryPage() {
  const { data: portfolios } = usePortfolios();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [portfolioFilter, setPortfolioFilter] = useState<string>("all");

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Filter transactions
  const filteredTransactions = mockTransactions.filter((tx) => {
    const matchesSearch =
      tx.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || tx.type === typeFilter;
    const matchesPortfolio = portfolioFilter === "all" || tx.portfolio === portfolioFilter;
    return matchesSearch && matchesType && matchesPortfolio;
  });

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto max-w-7xl px-6 py-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Icon */}
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-primary/20 to-primary/5 text-primary ring-1 ring-primary/20">
                <Clock className="h-5 w-5" />
              </div>

              {/* Title */}
              <div>
                <h1 className="text-2xl font-bold text-foreground tracking-tight">
                  Transaction History
                </h1>
                <p className="text-sm text-muted-foreground">
                  View and manage all your portfolio transactions
                </p>
              </div>
            </div>

            {/* Export Button */}
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by symbol or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Type Filter */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[130px]">
                <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="BUY">Buy</SelectItem>
                <SelectItem value="SELL">Sell</SelectItem>
              </SelectContent>
            </Select>

            {/* Portfolio Filter */}
            <Select value={portfolioFilter} onValueChange={setPortfolioFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Portfolio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Portfolios</SelectItem>
                {portfolios?.map((p) => (
                  <SelectItem key={p.id} value={p.name}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Date Range (placeholder) */}
            <Button variant="outline" className="gap-2">
              <Calendar className="h-4 w-4" />
              Last 30 days
            </Button>
          </div>

          {/* Transactions Table */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-muted-foreground text-xs font-medium">Date</TableHead>
                  <TableHead className="text-muted-foreground text-xs font-medium">Type</TableHead>
                  <TableHead className="text-muted-foreground text-xs font-medium">Asset</TableHead>
                  <TableHead className="text-muted-foreground text-xs font-medium">
                    Portfolio
                  </TableHead>
                  <TableHead className="text-muted-foreground text-xs font-medium text-right">
                    Quantity
                  </TableHead>
                  <TableHead className="text-muted-foreground text-xs font-medium text-right">
                    Price
                  </TableHead>
                  <TableHead className="text-muted-foreground text-xs font-medium text-right">
                    Total
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                      No transactions found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((tx) => (
                    <TableRow
                      key={tx.id}
                      className="border-border hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(tx.date)}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center gap-1 font-medium text-xs px-2 py-1 rounded-full ${
                            tx.type === "BUY"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {tx.type === "BUY" ? (
                            <ArrowUpRight className="h-3 w-3" />
                          ) : (
                            <ArrowDownRight className="h-3 w-3" />
                          )}
                          {tx.type}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">{tx.symbol}</p>
                          <p className="text-xs text-muted-foreground">{tx.name}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-normal">
                          {tx.portfolio}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {tx.quantity}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground tabular-nums">
                        {formatCurrency(tx.price)}
                      </TableCell>
                      <TableCell className="text-right font-medium text-foreground tabular-nums">
                        {formatCurrency(tx.total)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-border px-4 py-3">
              <p className="text-sm text-muted-foreground">
                Showing <span className="font-medium">{filteredTransactions.length}</span>{" "}
                transactions
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" disabled>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
