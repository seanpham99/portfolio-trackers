// Mock data generator for performance charts
// Temporary solution until Story 3-6 (Real API Integration)

export interface DataPoint {
  date: string;
  value: number;
}

export function generateMockPerformanceData(currentValue: number, days: number): DataPoint[] {
  const data: DataPoint[] = [];
  const now = new Date();
  let value = currentValue;

  // Generate data points working backwards
  for (let i = 0; i < days; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - (days - 1 - i));

    // Add some random volatility (between -2% and +2%)
    const volatility = (Math.random() - 0.5) * 0.04;

    // Trend slightly upwards over time
    // If working backwards, we divide by (1 + volatility)
    // Here we generate the full array then access it

    // Simple approach: Generate random walk ending at currentValue
    if (i === days - 1) {
      // Last point matches current value exactly
      value = currentValue;
    }
  }

  // Proper implementation: Random walk from start to end
  // Let's rewrite: Start with a base value and walk to current

  const startValue = currentValue * (1 - days * 0.0005); // Assume slight drift up
  let runningValue = startValue;

  for (let i = 0; i < days; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - (days - 1 - i));

    // Random daily change
    const change = runningValue * ((Math.random() - 0.48) * 0.03); // Slight positive bias
    runningValue += change;

    data.push({
      date: date.toISOString(),
      value: runningValue,
    });
  }

  // Force last point to match current value for consistency
  if (data.length > 0) {
    data[data.length - 1].value = currentValue;
  }

  return data;
}
