# Story 3-3: Holdings Table Enhancements

**Epic:** Epic 3 - Portfolio Intelligence Foundation  
**Status:** Backlog  
**Priority:** P0 (Critical - MVP Gap)  
**Story Points:** 3  
**Created:** December 29, 2025  
**Last Updated:** December 29, 2025

---

## Story

**As a** User  
**I want** to see current prices and real-time profit/loss in my holdings table  
**So that** I can quickly identify winners and losers in my portfolio

---

## Context

The unified holdings table from Story 2.4 displays quantity and cost basis but lacks current prices and P/L calculations - making it impossible to answer "Is Bitcoin up or down?" This story enhances the table with critical financial metrics using mocked prices initially (Story 3-6 wires real API).

**Mock Data Strategy:** Use `MOCK_PRICES` constant (shared with Story 3-2) for current prices. This enables immediate P/L display while maintaining clean separation for future API integration.

---

## Acceptance Criteria

### 1. Current Price Column

**Given** the unified holdings table from Story 2.4  
**When** a user views their holdings  
**Then** a new "Current Price" column should display:

- Current market price per unit
- Currency symbol appropriate to asset (USD for stocks, VND for Vietnamese stocks)
- Formatted with 2 decimal places for fiat, 6-8 decimals for crypto
- Source indicator: small "~" symbol indicating estimated price

### 2. Profit/Loss Columns

**Given** the holdings table with current prices  
**When** a user views their holdings  
**Then** two new P/L columns should display:

**P/L ($)** column:

- Calculated as: (Current Price × Quantity) - Cost Basis Total
- Formatted with currency symbol and 2 decimals
- Positive values in green, negative in red
- Zero values in neutral gray

**P/L (%)** column:

- Calculated as: ((Current Price - Avg Cost) / Avg Cost) × 100
- Formatted with "%" symbol and 2 decimals
- Positive values in green with "+" prefix
- Negative values in red with "-" prefix
- Zero values as "0.00%" in neutral gray

### 3. Sort by P/L Functionality

**Given** the enhanced holdings table  
**When** a user clicks on the P/L (%) column header  
**Then** the table should sort:

- First click: Descending (top gainers first)
- Second click: Ascending (top losers first)
- Third click: Back to default sort (by value)

**And** a sort indicator (↑/↓) should display next to the column header

### 4. Color Coding for Visual Clarity

**Given** the P/L columns display values  
**When** a user scans the table  
**Then** the color scheme should be:

- **Green** (#10B981): Positive P/L (gains)
- **Red** (#EF4444): Negative P/L (losses)
- **Gray** (#6B7280): Zero P/L or no change

**And** colors should meet WCAG AA contrast requirements (4.5:1 minimum)

### 5. Mock Price Integration

**Given** the component needs current prices  
**When** the holdings table loads  
**Then** it should:

- Import `MOCK_PRICES` from shared constants
- Look up each asset symbol in the constant
- Fallback to average cost if symbol not found
- Log warning if using fallback (for monitoring)

```typescript
const currentPrice = MOCK_PRICES[holding.symbol] || holding.averageCost;
```

### 6. Updated Table Column Order

**Given** the enhanced holdings table  
**When** a user views the table  
**Then** columns should appear in this order:

1. Asset (symbol + name)
2. Quantity
3. Average Cost
4. Current Price (NEW)
5. Cost Basis Total
6. Current Value
7. P/L ($) (NEW)
8. P/L (%) (NEW)
9. Actions (view detail, edit)

### 7. Mobile Responsive Layout

**Given** a user views the table on mobile (<640px)  
**When** the screen width is constrained  
**Then** the table should:

- Show Asset, Current Price, P/L (%) only
- Hide Average Cost, Cost Basis, Current Value columns
- Provide "Expand" button to reveal full details
- Maintain sort functionality

### 8. Loading State

**Given** the table is fetching holdings data  
**When** the component is loading  
**Then** it should display:

- Skeleton loaders for table rows
- Shimmer animation effect
- Maintain table structure during load

---

## Technical Implementation Notes

### P/L Calculation Logic

```typescript
// utils/calculateProfitLoss.ts
interface ProfitLoss {
  absolute: number; // P/L in currency
  percentage: number; // P/L as percentage
}

export const calculateProfitLoss = (
  quantity: number,
  averageCost: number,
  currentPrice: number,
): ProfitLoss => {
  const costBasisTotal = quantity * averageCost;
  const currentValue = quantity * currentPrice;
  const absolute = currentValue - costBasisTotal;
  const percentage = ((currentPrice - averageCost) / averageCost) * 100;

  return { absolute, percentage };
};
```

### Table Component Update

```typescript
// components/UnifiedHoldingsTable.tsx
interface EnhancedHolding extends Holding {
  currentPrice: number;
  profitLossAbsolute: number;
  profitLossPercentage: number;
}

const EnhancedHoldingsTable: React.FC<Props> = ({ holdings }) => {
  const enhancedHoldings = holdings.map((holding) => {
    const currentPrice = MOCK_PRICES[holding.symbol] || holding.averageCost;
    const { absolute, percentage } = calculateProfitLoss(
      holding.quantity,
      holding.averageCost,
      currentPrice,
    );

    return {
      ...holding,
      currentPrice,
      profitLossAbsolute: absolute,
      profitLossPercentage: percentage,
    };
  });

  // Render table...
};
```

### Sort Implementation

```typescript
const [sortConfig, setSortConfig] = useState<{
  key: string;
  direction: "asc" | "desc" | null;
}>({ key: "value", direction: "desc" });

const handleSort = (key: string) => {
  let direction: "asc" | "desc" | null = "desc";
  if (sortConfig.key === key) {
    direction =
      sortConfig.direction === "desc"
        ? "asc"
        : sortConfig.direction === "asc"
          ? null
          : "desc";
  }
  setSortConfig({ key, direction });
};
```

---

## Design Requirements

### Visual Design

- **Column Headers**: Bold, clickable for sort
- **P/L Values**: Slightly larger font size for emphasis
- **Green/Red Colors**: Use semantic color tokens from design system
- **Price Source Indicator**: Subtle "~" or "est." text in gray-400

### Number Formatting

```typescript
// utils/formatters.ts
export const formatCurrency = (
  value: number,
  currency: string = "USD",
): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export const formatPercentage = (value: number): string => {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
};

export const formatCryptoPrice = (value: number): string => {
  return value < 1 ? value.toFixed(8) : value.toFixed(2);
};
```

### Accessibility

- Sort buttons have ARIA labels: "Sort by profit/loss percentage"
- Color is not the only indicator (use icons: ↑ for positive, ↓ for negative)
- Screen reader announces sort direction changes
- Table has proper ARIA roles and labels

---

## Definition of Done

- [ ] Current Price column added to holdings table
- [ ] P/L ($) and P/L (%) columns implemented
- [ ] Color coding (green/red) applied to P/L values
- [ ] Sort by P/L % functionality working
- [ ] Mock prices integrated from shared constant
- [ ] Column order updated as specified
- [ ] Mobile responsive layout (condensed columns)
- [ ] Loading skeleton states implemented
- [ ] Unit tests for P/L calculation logic (100% coverage)
- [ ] Unit tests for sort functionality
- [ ] Visual regression tests for color coding
- [ ] Accessibility audit passed (WCAG 2.1 AA)
- [ ] Performance: Table renders 100 rows in <200ms

---

## Dependencies

- **Story 2.4**: Unified Holdings Table (base component)
- **Story 3.2**: Asset Allocation (shares `MOCK_PRICES` constant)

---

## Blockers & Risks

**Risk:** Users may not realize prices are estimated  
**Mitigation:** Add "~" indicator and tooltip: "Estimated prices. Live prices coming soon."

**Risk:** Color-only indicators fail accessibility  
**Mitigation:** Add symbols (↑/↓) alongside colors

---

## Notes

### Mock Prices Constant Location

```typescript
// constants/mockPrices.ts
export const MOCK_PRICES: Record<string, number> = {
  BTC: 45000,
  ETH: 2500,
  AAPL: 180,
  GOOGL: 140,
  // ... shared with Story 3.2
};
```

### Future Enhancements (Not in this story)

- Real-time price updates (WebSocket)
- Price change sparkline (mini chart)
- Customizable column visibility
- Export table to CSV

### Testing Scenarios

1. **All gains portfolio**: All holdings green
2. **All losses portfolio**: All holdings red
3. **Mixed portfolio**: Green and red mixed
4. **Zero P/L**: Holdings at break-even
5. **Missing mock price**: Falls back to cost basis

---

## Related Stories

- **Story 3-2: Asset Allocation** - Shares mock prices constant
- **Story 3-6: Basic Price Pipeline** - Replaces mock prices with real API
- **Story 6-1: Portfolio Valuation Engine** - Advanced P/L calculations with FX
