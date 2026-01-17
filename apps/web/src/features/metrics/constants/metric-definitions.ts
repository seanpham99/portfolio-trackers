/**
 * Metric definition type for calculation methodology transparency.
 * Used by MetricInfoCard to display formula and data source information.
 */
export interface MetricDefinition {
  /** Unique identifier for the metric */
  key: string;
  /** Human-readable label */
  label: string;
  /** Mathematical formula displayed to user */
  formula: string;
  /** Data source/provider information */
  source: string;
  /** Optional methodology (e.g., FIFO, LIFO) */
  methodology?: string;
}

/**
 * Metric keys enum for type-safe metric references
 */
export const MetricKeys = {
  NET_WORTH: "NET_WORTH",
  COST_BASIS: "COST_BASIS",
  UNREALIZED_PL: "UNREALIZED_PL",
  REALIZED_PL: "REALIZED_PL",
  DAILY_CHANGE: "DAILY_CHANGE",
  FX_GAIN: "FX_GAIN",
  ASSET_GAIN: "ASSET_GAIN",
  ALLOCATION_PCT: "ALLOCATION_PCT",
  TOTAL_GAIN: "TOTAL_GAIN",
  MARKET_VALUE: "MARKET_VALUE",
} as const;

export type MetricKey = (typeof MetricKeys)[keyof typeof MetricKeys];

/**
 * Registry of all metric definitions with formulas and data sources.
 * @see FR3: Transparent Calculations requirement
 */
export const METRIC_DEFINITIONS: Record<MetricKey, MetricDefinition> = {
  [MetricKeys.NET_WORTH]: {
    key: MetricKeys.NET_WORTH,
    label: "Net Worth",
    formula: "Net Worth = ∑(Quantity × Current Price)",
    source: "Holdings from Database, Prices from TradingView/Exchange APIs",
  },
  [MetricKeys.COST_BASIS]: {
    key: MetricKeys.COST_BASIS,
    label: "Cost Basis",
    formula: "Cost Basis = ∑(Purchase Price × Quantity) + Fees",
    source: "Transaction records from Database",
    methodology: "FIFO (First-In, First-Out) lot matching",
  },
  [MetricKeys.UNREALIZED_PL]: {
    key: MetricKeys.UNREALIZED_PL,
    label: "Unrealized P&L",
    formula: "Unrealized P&L = Market Value − Cost Basis",
    source: "Calculated from holdings and current prices",
  },
  [MetricKeys.REALIZED_PL]: {
    key: MetricKeys.REALIZED_PL,
    label: "Realized P&L",
    formula: "Realized P&L = Sale Proceeds − Sold Lot Cost Basis",
    source: "Transaction records from Database",
    methodology: "FIFO (First-In, First-Out) lot matching",
  },
  [MetricKeys.DAILY_CHANGE]: {
    key: MetricKeys.DAILY_CHANGE,
    label: "24h Change",
    formula: "24h Change = (Current Price − Price 24h Ago) ÷ Price 24h Ago × 100",
    source: "Price data from TradingView/Exchange APIs",
  },
  [MetricKeys.FX_GAIN]: {
    key: MetricKeys.FX_GAIN,
    label: "Currency Gain",
    formula: "FX Gain = Cost Basis × (Exchange Rate Today ÷ Exchange Rate at Purchase − 1)",
    source: "Exchange rates from FX Service",
  },
  [MetricKeys.ASSET_GAIN]: {
    key: MetricKeys.ASSET_GAIN,
    label: "Asset Gain",
    formula: "Asset Gain = (Current Price − Cost Price) ÷ Cost Price × 100",
    source: "Calculated from cost basis and current price",
  },
  [MetricKeys.ALLOCATION_PCT]: {
    key: MetricKeys.ALLOCATION_PCT,
    label: "Allocation %",
    formula: "Allocation % = (Asset Market Value ÷ Total Portfolio Value) × 100",
    source: "Calculated from portfolio holdings",
  },
  [MetricKeys.TOTAL_GAIN]: {
    key: MetricKeys.TOTAL_GAIN,
    label: "Total Gain",
    formula: "Total Gain = Unrealized P&L + Realized P&L",
    source: "Calculated from transaction history and current prices",
    methodology: "FIFO (First-In, First-Out) lot matching",
  },
  [MetricKeys.MARKET_VALUE]: {
    key: MetricKeys.MARKET_VALUE,
    label: "Market Value",
    formula: "Market Value = Quantity × Current Price",
    source: "Holdings from Database, Prices from TradingView/Exchange APIs",
  },
};

/**
 * Get a metric definition by its key.
 * @param key - The metric key to look up
 * @returns The metric definition or undefined if not found
 */
export function getMetricDefinition(key: MetricKey): MetricDefinition | undefined {
  return METRIC_DEFINITIONS[key];
}
