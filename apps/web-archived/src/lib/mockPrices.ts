import { subDays } from "date-fns";

export interface PerformanceDataPoint {
  date: Date;
  value: number;
  changeFromPrevious: number;
}

export const MOCK_PRICES: Record<string, number> = {
  // Crypto (USD)
  BTC: 45000,
  ETH: 2500,
  BNB: 320,
  SOL: 120,
  ADA: 0.65,
  DOT: 8.5,
  MATIC: 0.95,
  LINK: 18,
  UNI: 7.5,
  AVAX: 42,

  // US Stocks (USD)
  AAPL: 180,
  GOOGL: 140,
  MSFT: 380,
  TSLA: 240,
  AMZN: 155,
  NVDA: 495,
  META: 475,
  NFLX: 485,
  AMD: 165,
  INTC: 48,

  // VN Stocks (VND)
  VNM: 76000,
  VIC: 85000,
  FPT: 110000,
  HPG: 28000,
  VHM: 72000,
  MWG: 54000,
  VCB: 98000,
  TCB: 24000,
  ACB: 21000,
  MBB: 23000,
};

/**
 * Generate mock historical performance data for a portfolio
 * Uses realistic daily volatility to create a time series ending at current value
 *
 * @param currentValue - The current portfolio value (end point)
 * @param days - Number of historical days to generate (e.g., 30, 90, 180, 365)
 * @returns Array of performance data points with date, value, and change from previous
 */
export function generateMockPerformanceData(
  currentValue: number,
  days: number,
): PerformanceDataPoint[] {
  const points: PerformanceDataPoint[] = [];
  const dailyVolatility = 0.03; // ±3% daily variance

  // Start with a value slightly different from current (±10% for overall trend)
  const overallTrend = (Math.random() - 0.5) * 0.2; // ±10% overall change
  let value = currentValue / (1 + overallTrend);

  // Generate forward from oldest date to today
  for (let i = days; i >= 0; i--) {
    const date = subDays(new Date(), i);
    const randomChange = (Math.random() - 0.5) * 2 * dailyVolatility;

    const changeFromPrevious = points.length > 0 ? value * randomChange : 0;
    value = Math.max(0, value + changeFromPrevious);

    points.push({
      date,
      value,
      changeFromPrevious,
    });
  }

  // Adjust last value to match current value exactly
  const lastPoint = points[points.length - 1];
  if (lastPoint) {
    const adjustment = currentValue - lastPoint.value;
    lastPoint.value = currentValue;
    lastPoint.changeFromPrevious += adjustment;
  }

  return points;
}
