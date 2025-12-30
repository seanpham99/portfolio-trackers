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

**Given** the user has current holdings  
**When** the performance chart loads  
**Then** the system should:

- Calculate current portfolio value from holdings
- Generate historical data points using `generateMockPerformanceData()` from `src/lib/mockPrices.ts`
- Apply realistic daily volatility (±3% variance)
- Return data for selected time range (30, 90, 180, 365 days)

**Implementation:** See `generateMockPerformanceData()` function in Implementation Guide section

### 6. Empty State Handling

**Given** a user has no transactions yet  
**When** they view the Performance tab  
**Then** they should see:

- Empty state illustration
- Message: "Add your first transaction to start tracking performance"
- "Add Transaction" CTA button

---

## Implementation Guide

### File Structure & Organization

**CRITICAL:** Follow feature-based organization to prevent build errors:

```
apps/web/src/
├── features/
│   └── analytics/                        # NEW for this story
│       ├── performance-dashboard.tsx      # Main container
│       ├── performance-chart.tsx          # Recharts line chart
│       ├── performance-metrics.tsx        # Metric cards
│       ├── time-range-selector.tsx        # Period buttons
│       ├── use-performance-data.ts        # React Query hook
│       └── analytics.types.ts             # TypeScript types
│
├── lib/
│   └── mockPrices.ts                      # NEW: Centralized mock data
│
└── routes/
    └── portfolio.$portfolioId.tsx         # Add Performance tab here
```

**⚠️ DO NOT place test files in `src/routes/` - breaks React Router 7 file-based routing**

---

### Technical Stack Requirements

**Charting Library:**

- Recharts 2.15.4 (✅ already installed in package.json)
- Use `<ResponsiveContainer>`, `<LineChart>`, `<Tooltip>` components

**Animation:**

- Framer Motion 12.23.26 (✅ already installed)
- REQUIRED: Support `prefers-reduced-motion` for WCAG 2.1 AA compliance (NFR6)
- Example: `<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, ease: 'easeOut' }} />`

**State Management:**

- TanStack React Query 5.90.12 (✅ already installed)
- CRITICAL configuration matching backend cache timing:

```typescript
// apps/web/src/features/analytics/use-performance-data.ts
import { useQuery } from "@tanstack/react-query";
import type { PerformanceDataPoint } from "./analytics.types";

export function usePerformanceData(portfolioId: string, timeRange: TimeRange) {
  return useQuery({
    queryKey: ["portfolio", portfolioId, "performance", timeRange],
    queryFn: () => generateMockPerformanceData(portfolioId, timeRange),
    staleTime: 30 * 1000, // 30s - matches backend Redis cache TTL
    refetchInterval: 60 * 1000, // 60s - matches NFR polling requirement
    retry: 3,
  });
}
```

**TypeScript:**

- Strict mode enabled (project default)
- Use `import type` for type-only imports
- Run `pnpm run type-check` before committing (runs `react-router typegen && tsc --noEmit`)

---

### Mock Data Strategy (Stories 3-1 through 3-5)

**Create centralized mock prices file:**

```typescript
// apps/web/src/lib/mockPrices.ts
export const MOCK_PRICES: Record<string, number> = {
  // Crypto (USD)
  BTC: 45000,
  ETH: 2500,
  BNB: 320,

  // US Stocks (USD)
  AAPL: 180,
  GOOGL: 140,
  MSFT: 380,
  TSLA: 240,

  // VN Stocks (VND)
  VNM: 76000,
  VIC: 85000,
  FPT: 110000,
};

// Generate mock historical performance data
export function generateMockPerformanceData(
  currentValue: number,
  days: number,
): PerformanceDataPoint[] {
  const points: PerformanceDataPoint[] = [];
  const dailyVolatility = 0.03; // ±3% daily variance

  for (let i = days; i >= 0; i--) {
    const date = subDays(new Date(), i);
    const randomChange = (Math.random() - 0.5) * 2 * dailyVolatility;
    const value = currentValue / Math.pow(1 + randomChange, i);

    points.push({
      date,
      value: Math.max(0, value),
      changeFromPrevious: i > 0 ? value - points[points.length - 1]?.value : 0,
    });
  }

  return points;
}
```

**Story 3-6 will replace this mock data with real API integration.**

---

### React Router 7 Integration

**Add Performance tab to portfolio route:**

```typescript
// apps/web/src/routes/portfolio.$portfolioId.tsx
import { PerformanceDashboard } from '@/features/analytics/performance-dashboard';

export default function PortfolioRoute() {
  const { portfolioId } = useParams();

  return (
    <Tabs defaultValue="overview">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="performance">Performance</TabsTrigger>
        <TabsTrigger value="holdings">Holdings</TabsTrigger>
      </TabsList>

      <TabsContent value="performance">
        <PerformanceDashboard portfolioId={portfolioId} />
      </TabsContent>
    </Tabs>
  );
}
```

---

### Error Handling & Loading States

**Pattern from architecture:**

```typescript
const { data, isLoading, isFetching, isError, error } = usePerformanceData(portfolioId, timeRange);

if (isLoading) {
  return <PerformanceChartSkeleton />; // Full skeleton loader for initial load
}

if (isError) {
  return (
    <ErrorCard>
      <p>Failed to load performance data</p>
      <Button onClick={() => queryClient.invalidateQueries(['portfolio', portfolioId, 'performance'])}>
        Retry
      </Button>
    </ErrorCard>
  );
}

return (
  <>
    {isFetching && <RefreshIndicator />} {/* Subtle indicator for background refetch */}
    <PerformanceChart data={data} />
  </>
);
```

---

### Chart Implementation (Recharts)

```typescript
// apps/web/src/features/analytics/performance-chart.tsx
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { motion } from 'framer-motion';
import type { PerformanceDataPoint } from './analytics.types';

interface PerformanceChartProps {
  data: PerformanceDataPoint[];
  timeRange: '1M' | '3M' | '6M' | '1Y' | 'ALL';
}

export function PerformanceChart({ data, timeRange }: PerformanceChartProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          <XAxis
            dataKey="date"
            tickFormatter={(date) => format(date, 'MMM dd')}
          />
          <YAxis
            tickFormatter={(value) => formatCurrency(value)}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="value"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={false}
            animationDuration={500}
          />
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
```

---

### Visual Design & Accessibility

**Color System:**

- Positive changes: `text-green-600` (gains)
- Negative changes: `text-red-600` (losses)
- Chart line: `hsl(var(--primary))` (brand color)

**Typography:**

- Current value: `text-3xl font-bold` (largest text)
- Metrics: `text-lg font-semibold`

**Responsive Breakpoints:**

- Mobile (<640px): Stacked layout, compact chart
- Tablet (640-1024px): Two-column metrics
- Desktop (>1024px): Full-width chart with sidebar metrics

**WCAG 2.1 AA Compliance (NFR6):**

- ✅ ARIA labels: `<LineChart aria-label="Portfolio performance over time">`
- ✅ Keyboard navigation: All time range buttons keyboard accessible
- ✅ Color contrast: ≥4.5:1 ratio verified
- ✅ Reduced motion: Framer Motion respects `prefers-reduced-motion`
- ✅ Screen reader support: Provide data table alternative below chart

---

## Definition of Done

### Functionality

- [ ] Performance tab added to portfolio route (`/portfolio/:id`)
- [ ] Line chart component implemented with Recharts 2.15.4
- [ ] Time range selector (1M, 3M, 6M, 1Y, ALL) functional
- [ ] Key metrics panel showing current value, change ($), change (%)
- [ ] Interactive hover tooltips displaying date and value
- [ ] Mock data generation function in `src/lib/mockPrices.ts`
- [ ] Empty state for users with no transactions
- [ ] Responsive design verified on mobile/tablet/desktop
- [ ] Color coding (green/red) for positive/negative changes

### Testing (E2E Focus per Architecture)

- [ ] E2E test: Dashboard loads and displays chart (`test/e2e/analytics-flows.spec.ts`)
- [ ] E2E test: Time range switching works correctly
- [ ] E2E test: Hover tooltips display and format correctly
- [ ] E2E test: Empty state shown when no holdings exist
- [ ] Manual verification: Loading states (skeleton, refetch indicator)
- [ ] Manual verification: Error handling with retry button

### Accessibility & Performance

- [ ] WCAG 2.1 AA audit passed (keyboard nav, ARIA labels, color contrast)
- [ ] Reduced motion support verified (`prefers-reduced-motion`)
- [ ] Performance verified:
  - [ ] TTI (Time to Interactive) ≤2s
  - [ ] INP (Interaction to Next Paint) P75 ≤200ms
  - [ ] CLS (Cumulative Layout Shift) ≤0.1
  - [ ] Chart render <100ms (measured with Chrome DevTools Performance tab)

### Code Quality

- [ ] TypeScript strict mode passes (`pnpm run type-check`)
- [ ] ESLint passes with no warnings
- [ ] React Query cache configuration matches backend (30s staleTime, 60s polling)
- [ ] Framer Motion animations respect reduced motion preference

---

## Dependencies

### Prerequisites (Must Be Complete)

- **Story 2.1**: Portfolio Management API - provides current holdings data via REST endpoints
- **Story 2.2**: Enhanced Tabbed Dashboard Shell - provides tab navigation infrastructure for Performance tab
- **Story 2.4**: Holdings list - provides current portfolio value calculation logic

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

---

## Related Stories

- **Story 3-6: Basic Price Pipeline** - Replaces mocked data with real price API (seamless UI component reuse)
- **Story 3-2, 3-3, 3-4, 3-5** - Share `MOCK_PRICES` constant and mock data generation patterns
