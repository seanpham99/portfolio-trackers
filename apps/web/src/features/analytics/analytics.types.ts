export type TimeRange = "1M" | "3M" | "6M" | "1Y" | "ALL";

export interface PerformanceDataPoint {
  date: Date;
  value: number;
  changeFromPrevious: number;
}

export interface PerformanceMetrics {
  currentValue: number;
  totalChange: number;
  percentageChange: number;
  startValue: number;
}

export interface PerformanceData {
  dataPoints: PerformanceDataPoint[];
  metrics: PerformanceMetrics;
}
