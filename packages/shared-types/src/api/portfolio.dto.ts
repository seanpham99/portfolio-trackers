import { type Database } from "../database/index.js";

export type Portfolio = Database["public"]["Tables"]["portfolios"]["Row"];

/**
 * Portfolio summary with calculated metrics and staleness metadata (NFR3)
 */
export interface PortfolioSummaryDto extends Portfolio {
  netWorth: number;
  totalGain: number;       // Unrealized + Realized P&L
  unrealizedPL: number;    // Market Value - Cost Basis
  realizedPL: number;      // Realized P&L from sales
  totalCostBasis?: number; // Sum of cost basis of current holdings (optional)
  change24h: number;
  change24hPercent: number;
  allocation?: {
    label: string;
    value: number;
    color: string;
  }[];
  // NFR3: Staleness Indicators for UI badges
  isStale?: boolean;
  lastUpdated?: string;
  providerStatus?: 'live' | 'cached' | 'fallback';
  provider?: 'Yahoo' | 'CoinGecko' | 'cached' | 'fallback';
}
