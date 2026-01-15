# Story 3-2: Asset Allocation Visualization

**Epic:** Epic 3 - Portfolio Intelligence Foundation  
**Status:** Backlog  
**Priority:** P0 (Critical - MVP Gap)  
**Story Points:** 3  
**Created:** December 29, 2025  
**Last Updated:** December 29, 2025

---

## Story

**As a** User  
**I want** to see how my portfolio is distributed across different assets  
**So that** I can identify concentration risk and rebalance if needed

---

## Context

Epic 2 retrospective identified "allocation visualization" as a missing core feature. Users need to answer "What % of my portfolio is in Bitcoin?" to make informed investment decisions. This story uses existing holdings data with mocked current prices to deliver immediate value without waiting for real-time price integration.

**Mock Data Strategy:** Calculate allocation from existing holdings (quantity × mocked current price). Use static price constants initially (Bitcoin=$45K, AAPL=$180). Story 3-6 will wire real API prices.

---

## Acceptance Criteria

### 1. Allocation Chart Display

**Given** a user has a portfolio with multiple holdings  
**When** they navigate to the Dashboard "Allocation" section  
**Then** they should see:

- A donut or pie chart showing asset allocation by current value
- Each asset represented as a colored segment
- Legend with asset symbols and colors
- Chart title: "Portfolio Allocation"

### 2. Allocation Table

**Given** the allocation chart is displayed  
**When** the user scrolls below the chart  
**Then** they should see a table with columns:

- **Asset**: Symbol and name (e.g., "BTC - Bitcoin")
- **Value**: Current value in base currency
- **Percentage**: % of total portfolio
- **Change (24h)**: 24-hour price change (mocked as ±0-5%)

**And** assets should be sorted by value (largest to smallest)

### 3. Interactive Chart Hover

**Given** the allocation chart is displayed  
**When** the user hovers over a chart segment  
**Then** a tooltip should display:

- Asset symbol and name
- Current value
- Percentage of portfolio
- Number of units held

### 4. Allocation Calculation

**Given** the user's holdings from the database  
**When** the allocation view loads  
**Then** the system should:

- Fetch all holdings for the portfolio
- Calculate current value: quantity × mock current price
- Calculate percentage: (asset value / total portfolio value) × 100
- Sort by value descending

### 5. Mock Current Prices

**Given** the need for current prices to calculate allocation  
**When** the component initializes  
**Then** it should use a `MOCK_PRICES` constant:

```typescript
const MOCK_PRICES: Record<string, number> = {
  BTC: 45000,
  ETH: 2500,
  AAPL: 180,
  GOOGL: 140,
  MSFT: 380,
  VNM: 76000, // VND
  VPB: 23500, // VND
  // ... other common assets
};
```

**And** for assets not in the constant, use cost basis price as fallback

### 6. Empty State Handling

**Given** a user has no holdings  
**When** they view the Allocation section  
**Then** they should see:

- Empty state illustration
- Message: "Your portfolio is empty. Add transactions to see allocation."
- "Add Transaction" CTA button

### 7. Single Asset State

**Given** a user holds only one asset  
**When** they view the Allocation section  
**Then** they should see:

- Full circle chart (100% one color)
- Table with single row showing 100%
- Message: "Consider diversifying your portfolio"

---

## Technical Implementation Notes

### Frontend Components

```typescript
// AllocationChart.tsx
interface AllocationData {
  symbol: string;
  name: string;
  value: number;
  percentage: number;
  quantity: number;
  color: string;
}

interface AllocationChartProps {
  holdings: Holding[];
  baseCurrency: string;
}
```

### Chart Library

Use **Recharts** PieChart or DonutChart:

```typescript
<PieChart width={400} height={400}>
  <Pie
    data={allocationData}
    dataKey="value"
    nameKey="symbol"
    cx="50%"
    cy="50%"
    innerRadius={60}  // For donut chart
    outerRadius={80}
    fill="#8884d8"
    label
  >
    {allocationData.map((entry, index) => (
      <Cell key={`cell-${index}`} fill={entry.color} />
    ))}
  </Pie>
  <Tooltip />
</PieChart>
```

### Color Palette

Use consistent, accessible colors:

```typescript
const CHART_COLORS = [
  "#3B82F6", // Blue
  "#10B981", // Green
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#14B8A6", // Teal
  "#F97316", // Orange
];
```

### Allocation Calculation Service

```typescript
// services/allocationCalculation.ts
import { MOCK_PRICES } from "@/constants/mockPrices";

export const calculateAllocation = (holdings: Holding[]): AllocationData[] => {
  const totalValue = holdings.reduce((sum, holding) => {
    const price = MOCK_PRICES[holding.symbol] || holding.averageCost;
    return sum + holding.quantity * price;
  }, 0);

  return holdings
    .map((holding, index) => {
      const price = MOCK_PRICES[holding.symbol] || holding.averageCost;
      const value = holding.quantity * price;
      const percentage = (value / totalValue) * 100;

      return {
        symbol: holding.symbol,
        name: holding.assetName,
        value,
        percentage,
        quantity: holding.quantity,
        color: CHART_COLORS[index % CHART_COLORS.length],
      };
    })
    .sort((a, b) => b.value - a.value);
};
```

---

## Design Requirements

### Visual Design

- **Chart Style**: Donut chart preferred over pie (better visual hierarchy)
- **Legend**: Display below chart on mobile, to the right on desktop
- **Table Style**: Zebra striping for readability
- **Percentage Display**: Round to 2 decimal places (e.g., "23.47%")

### Responsive Design

- **Desktop**: Chart and table side-by-side
- **Tablet**: Chart above, table below
- **Mobile**: Stacked layout, smaller chart size

### Accessibility

- ARIA label for chart: "Portfolio allocation by asset"
- Color should not be the only indicator (use patterns for colorblind users)
- Keyboard navigation for table rows
- Screen reader support for chart data

---

## Definition of Done

- [ ] Allocation donut/pie chart implemented
- [ ] Allocation table with 4 columns (Asset, Value, %, Change 24h)
- [ ] Interactive hover tooltips showing asset details
- [ ] Mock prices constant defined for common assets
- [ ] Allocation calculation service with unit tests (>85% coverage)
- [ ] Sorting by value (largest to smallest)
- [ ] Empty state and single asset state handling
- [ ] Responsive design for mobile/tablet/desktop
- [ ] Color palette applied consistently
- [ ] Accessibility audit passed (WCAG 2.1 AA)
- [ ] Visual regression tests for chart
- [ ] Documentation: Mock price strategy and future wire-up plan

---

## Dependencies

- **Story 2.1**: Portfolio Management API (holdings data)
- **Story 2.4**: Unified Holdings Table (holdings structure)

---

## Blockers & Risks

**Risk:** Mock prices may be significantly outdated  
**Mitigation:** Use recently updated mock prices (review quarterly) and clearly communicate "Estimated allocation" in UI

**Risk:** Users may not understand prices are mocked  
**Mitigation:** Add subtle "Using estimated prices" indicator; Story 3-6 will replace with live prices

---

## Notes

### Mock Price Maintenance

- Update `MOCK_PRICES` constant quarterly or when major price movements occur
- Fallback to cost basis ensures all assets have a price
- Consider adding a "Last updated" timestamp to mock prices constant

### Future Enhancements (Not in this story)

- Allocation by asset class (stocks, crypto, bonds)
- Allocation by sector (tech, finance, energy)
- Comparison to target allocation (set by user)
- Historical allocation changes over time

### Design Inspiration

- Vanguard Portfolio Allocation View
- Coinbase Portfolio Pie Chart
- Fidelity Asset Allocation

---

## Related Stories

- **Story 3-3: Holdings Table Enhancements** - Uses same mock prices for P/L calculation
- **Story 3-6: Basic Price Pipeline** - Replaces mock prices with real API data
- **Story 6-1: Portfolio Valuation Engine** - Advanced allocation with multi-currency support
