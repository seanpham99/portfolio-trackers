# Story 3-1: Performance Dashboard Foundation

**Epic:** Epic 3 - Portfolio Intelligence Foundation  
**Status:** Backlog  
**Priority:** P0 (Critical - MVP Gap)  
**Story Points:** 5  
**Created:** December 29, 2025  
**Last Updated:** December 29, 2025

---

## Story

**As a** User  
**I want** to see my portfolio value over time in a line chart  
**So that** I can understand if my investments are growing or declining

---

## Context

Epic 2 retrospective (Dec 29, 2025) revealed a critical gap: users can add holdings but cannot answer "How is my portfolio performing?" - the #1 user need from the PRD. This story addresses the most fundamental analytics need: visualizing portfolio value over time.

**Mock Data Strategy:** This story uses a mock-first approach - generate historical performance data in the UI by calculating from current holdings with realistic volatility. This validates UX quickly before Story 3-6 wires real price API. Benefits: faster iteration, cheaper to change, de-risked implementation.

---

## Acceptance Criteria

### 1. Performance Chart Display

**Given** a user has a portfolio with holdings  
**When** they navigate to the Dashboard and select the "Performance" tab  
**Then** they should see:

- A line chart showing total portfolio value over time
- X-axis: Time periods (dates)
- Y-axis: Portfolio value in user's base currency
- Chart title: "Portfolio Performance"
- Current portfolio value prominently displayed above chart

### 2. Time Range Selector

**Given** the performance chart is displayed  
**When** the user interacts with time range controls  
**Then** they should be able to select:

- 1M (1 month)
- 3M (3 months)
- 6M (6 months)
- 1Y (1 year)
- ALL (since first transaction)

**And** the chart should update to show the selected time range

### 3. Key Performance Metrics

**Given** the performance chart is displayed  
**When** the user views the metrics panel  
**Then** they should see:

- **Current Value**: Total portfolio value as of today
- **Total Change ($)**: Absolute change from start of period
- **Percentage Change (%)**: Percentage return for selected period
- Positive changes displayed in green, negative in red

### 4. Interactive Hover Tooltips

**Given** the user hovers over the performance chart  
**When** the cursor moves along the chart line  
**Then** a tooltip should display:

- Exact date
- Portfolio value on that date
- Change from previous day ($ and %)

### 5. Mocked Historical Data Generation

**Given** the user has current holdings with known quantities and cost basis  
**When** the performance chart loads  
**Then** the system should:

- Take current portfolio value as the endpoint
- Generate historical data points working backwards
- Apply realistic daily volatility (±2-5% variance)
- Ensure generated data aligns roughly with actual cost basis
- Store mocked data in component state (not database)

**Example calculation:**

```typescript
// Pseudocode for mock data generation
const currentValue = 100000; // User's current portfolio value
const daysBack = 90; // For 3M view
const dailyVolatility = 0.03; // ±3% per day

for (let i = daysBack; i >= 0; i--) {
  const randomChange = (Math.random() - 0.5) * 2 * dailyVolatility;
  const previousValue = currentValue / Math.pow(1 + randomChange, i);
  mockData.push({ date: addDays(today, -i), value: previousValue });
}
```

### 6. Empty State Handling

**Given** a user has no transactions yet  
**When** they view the Performance tab  
**Then** they should see:

- Empty state illustration
- Message: "Add your first transaction to start tracking performance"
- "Add Transaction" CTA button

---

## Technical Implementation Notes

### Frontend Components

```typescript
// PerformanceChart.tsx
interface PerformanceChartProps {
  timeRange: "1M" | "3M" | "6M" | "1Y" | "ALL";
  currentValue: number;
  costBasis: number;
}

// Data structure
interface PerformanceDataPoint {
  date: Date;
  value: number;
  changeFromPrevious?: number;
  changePercentage?: number;
}
```

### Chart Library

Use **Recharts** (already in project) or **Chart.js** for line chart:

- Responsive design
- Touch-friendly for mobile
- Smooth animations
- Accessible (ARIA labels)

### Mock Data Generation Service

```typescript
// services/mockPerformanceData.ts
export const generateMockPerformanceData = (
  currentValue: number,
  costBasis: number,
  timeRange: TimeRange,
): PerformanceDataPoint[] => {
  // Implementation here
  // Ensures realistic volatility while maintaining overall trajectory
  // from cost basis to current value
};
```

### State Management

Use React Query for data fetching:

```typescript
const { data: performanceData } = useQuery({
  queryKey: ["performance", portfolioId, timeRange],
  queryFn: () =>
    generateMockPerformanceData(currentValue, costBasis, timeRange),
  staleTime: 1000 * 60 * 5, // 5 minutes
});
```

---

## Design Requirements

### Visual Design

- **Chart Line Color**: Use brand primary color (blue)
- **Positive/Negative Indicators**: Green for gains, red for losses
- **Typography**: Current value should be largest text (2xl font size)
- **Spacing**: Adequate padding around chart for readability

### Responsive Design

- **Desktop (>1024px)**: Full-width chart with sidebar metrics
- **Tablet (640-1024px)**: Full-width chart, metrics below
- **Mobile (<640px)**: Scrollable chart, stacked metrics

### Accessibility

- ARIA labels for chart elements
- Keyboard navigation for time range selector
- High contrast mode support
- Screen reader announcements for metric changes

---

## Definition of Done

- [ ] Performance tab added to dashboard navigation
- [ ] Line chart component implemented with Recharts/Chart.js
- [ ] Time range selector (1M, 3M, 6M, 1Y, ALL) functional
- [ ] Key metrics panel showing current value, change ($), change (%)
- [ ] Hover tooltips displaying date and value
- [ ] Mock data generation function implemented
- [ ] Empty state for users with no transactions
- [ ] Responsive design working on mobile/tablet/desktop
- [ ] Color coding (green/red) for positive/negative changes
- [ ] Unit tests for mock data generation (>80% coverage)
- [ ] Visual regression tests for chart component
- [ ] Accessibility audit passed (WCAG 2.1 AA)
- [ ] Performance metrics: chart renders in <100ms

---

## Dependencies

- **Story 2.1**: Portfolio Management API (current holdings data)
- **Story 2.4**: Holdings list (for calculating current value)

---

## Blockers & Risks

**Risk:** Mocked data may not feel realistic to users  
**Mitigation:** Use actual cost basis as starting point, apply realistic volatility patterns from market data analysis

---

## Notes

### Mock Data Strategy Rationale

1. **Fast UX Validation**: Users can see and interact with the feature immediately
2. **No Backend Dependency**: Decouples frontend work from API development
3. **Easy Iteration**: Can adjust volatility, trends without data pipeline changes
4. **Seamless Transition**: Story 3-6 will replace mock generation with real API calls using same UI components

### Future Enhancements (Not in this story)

- Multiple portfolio comparison
- Benchmark comparison (S&P 500, Bitcoin)
- Annotation of major events (purchases, sales)
- Export chart as PNG/SVG

---

## Related Stories

- **Story 3-6: Basic Price Pipeline** - Replaces mocked data with real price API
- **Story 6-3: Performance Metrics (TWR/MWR)** - Advanced performance calculations
- **Story 5-3: TradingView Charts** - Advanced charting with technical indicators
