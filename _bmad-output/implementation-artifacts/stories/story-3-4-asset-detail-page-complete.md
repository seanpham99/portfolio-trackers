# Story 3-4: Asset Detail Page Complete

**Epic:** Epic 3 - Portfolio Intelligence Foundation  
**Status:** Backlog  
**Priority:** P1  
**Story Points:** 5  
**Created:** December 29, 2025  
**Last Updated:** December 29, 2025

---

## Story

**As a** User  
**I want** to see comprehensive performance data for each asset in my portfolio  
**So that** I can make informed decisions about individual holdings

---

## Context

Story 2.6 implemented the basic asset detail page with stat cards and transaction history. This story extends it with performance visualization and price history - addressing the Epic 2 retrospective finding that users need to answer "How has Bitcoin performed in my portfolio?"

**Mock Data Strategy:** Generate sample OHLC (Open-High-Low-Close) data for past 90 days in the UI using realistic price movements around the mock current price. This validates chart UX before Story 3-6 wires real price API.

---

## Acceptance Criteria

### 1. Asset Performance Chart

**Given** a user navigates to an asset detail page  
**When** the page loads  
**Then** they should see:

- A line chart showing asset price over time
- X-axis: Dates (past 90 days)
- Y-axis: Price in appropriate currency
- Chart title: "[Asset Symbol] Performance"
- Current price prominently displayed above chart

### 2. Time Range Selector for Asset Chart

**Given** the asset performance chart is displayed  
**When** the user interacts with time range controls  
**Then** they should be able to select:

- 7D (7 days)
- 1M (1 month)
- 3M (3 months)
- 6M (6 months)
- 1Y (1 year)

**And** the chart should update to show the selected time range

### 3. Price History Table

**Given** the asset performance chart is displayed  
**When** the user scrolls below the chart  
**Then** they should see a table with columns:

- **Date**: Date of price record
- **Open**: Opening price
- **High**: Highest price of the day
- **Low**: Lowest price of the day
- **Close**: Closing price
- **Change (%)**: Daily percentage change

**And** the table should display the most recent 30 days by default

### 4. Total Return Metrics

**Given** the asset detail page is displayed  
**When** the user views the metrics section  
**Then** they should see:

- **Absolute Return**: Total profit/loss in currency (Current Value - Total Invested)
- **Percentage Return**: Percentage gain/loss ((Current Value - Total Invested) / Total Invested × 100)
- **Total Invested**: Sum of all purchase costs
- **Current Value**: Current price × total quantity held

**And** positive returns should be green, negative red

### 5. Updated Transaction History

**Given** the existing transaction history from Story 2.6  
**When** the user views the transaction list  
**Then** each transaction should display:

- Transaction type (Buy/Sell badge)
- Date and time
- Quantity
- Price per unit
- Total cost/proceeds
- **NEW: P/L Impact** - How this transaction affected overall P/L

### 6. Mock OHLC Data Generation

**Given** the need for price history to display charts  
**When** the asset detail page loads  
**Then** the system should:

- Take mock current price from `MOCK_PRICES` constant
- Generate 90 days of OHLC data working backwards
- Apply realistic intraday volatility (High/Low within ±3% of Open/Close)
- Apply realistic daily trends (Close typically within ±5% of previous Close)
- Ensure generated data feels authentic (no extreme gaps or patterns)

**Example calculation:**

```typescript
const currentPrice = MOCK_PRICES[symbol] || 100;
const daysBack = 90;

for (let i = daysBack; i >= 0; i--) {
  const dayVolatility = 0.03; // 3% intraday
  const trendVolatility = 0.05; // 5% day-to-day

  const close =
    currentPrice * Math.pow(1 + (Math.random() - 0.5) * trendVolatility, i);
  const open = close * (1 + (Math.random() - 0.5) * dayVolatility);
  const high = Math.max(open, close) * (1 + Math.random() * dayVolatility);
  const low = Math.min(open, close) * (1 - Math.random() * dayVolatility);

  mockOHLC.push({ date: addDays(today, -i), open, high, low, close });
}
```

### 7. Chart Annotations for User Transactions

**Given** the user has buy/sell transactions for this asset  
**When** the performance chart displays  
**Then** transaction dates should be marked:

- Buy transactions: Green upward arrow on chart
- Sell transactions: Red downward arrow on chart
- Hover tooltip showing transaction details

### 8. Empty State (No Holdings)

**Given** a user views an asset detail page for an asset they don't own  
**When** the page loads  
**Then** they should see:

- Performance chart and price history (informational)
- Message: "You don't own this asset yet"
- "Add Transaction" CTA button
- No total return metrics displayed

---

## Technical Implementation Notes

### Mock OHLC Data Service

```typescript
// services/mockPriceHistory.ts
interface OHLCDataPoint {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  changePercent: number;
}

export const generateMockOHLC = (
  symbol: string,
  days: number,
): OHLCDataPoint[] => {
  const currentPrice = MOCK_PRICES[symbol] || 100;
  const data: OHLCDataPoint[] = [];

  let previousClose = currentPrice;

  for (let i = days; i >= 0; i--) {
    const trendChange = (Math.random() - 0.5) * 0.1; // ±5%
    const close = previousClose * (1 + trendChange);

    const intradayVolatility = 0.03;
    const open = close * (1 + (Math.random() - 0.5) * intradayVolatility);
    const high =
      Math.max(open, close) * (1 + Math.random() * intradayVolatility);
    const low =
      Math.min(open, close) * (1 - Math.random() * intradayVolatility);

    const changePercent = ((close - previousClose) / previousClose) * 100;

    data.push({
      date: subDays(new Date(), i),
      open,
      high,
      low,
      close,
      changePercent,
    });

    previousClose = close;
  }

  return data;
};
```

### Chart Implementation

Use **Recharts** LineChart with Area fill:

```typescript
<AreaChart data={priceHistory} width={800} height={400}>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey="date" />
  <YAxis />
  <Tooltip content={<CustomTooltip />} />
  <Area
    type="monotone"
    dataKey="close"
    stroke="#3B82F6"
    fill="#3B82F680"
  />
  {/* Transaction annotations */}
  {userTransactions.map(tx => (
    <ReferenceLine
      x={tx.date}
      stroke={tx.type === 'buy' ? '#10B981' : '#EF4444'}
      label={<CustomLabel />}
    />
  ))}
</AreaChart>
```

### Total Return Calculation

```typescript
// utils/assetReturns.ts
interface AssetReturns {
  absoluteReturn: number;
  percentageReturn: number;
  totalInvested: number;
  currentValue: number;
}

export const calculateAssetReturns = (
  transactions: Transaction[],
  currentPrice: number,
): AssetReturns => {
  const totalQuantity = transactions.reduce((sum, tx) => {
    return tx.type === "buy" ? sum + tx.quantity : sum - tx.quantity;
  }, 0);

  const totalInvested = transactions
    .filter((tx) => tx.type === "buy")
    .reduce((sum, tx) => sum + tx.quantity * tx.price, 0);

  const currentValue = totalQuantity * currentPrice;
  const absoluteReturn = currentValue - totalInvested;
  const percentageReturn = (absoluteReturn / totalInvested) * 100;

  return { absoluteReturn, percentageReturn, totalInvested, currentValue };
};
```

---

## Design Requirements

### Visual Design

- **Chart Area Fill**: Use semi-transparent brand color
- **Transaction Markers**: Distinct icons (↑ for buy, ↓ for sell)
- **Metrics Cards**: Large, prominent display for key numbers
- **Price History Table**: Compact, scannable design

### Responsive Design

- **Desktop**: Full-width chart, table below
- **Tablet**: Full-width chart, scrollable table
- **Mobile**: Condensed chart, horizontal scroll for table

### Accessibility

- ARIA labels for all chart elements
- Keyboard navigation for time range selector
- High contrast mode support
- Screen reader announces price changes

---

## Definition of Done

- [ ] Asset performance line chart implemented
- [ ] Time range selector (7D, 1M, 3M, 6M, 1Y) functional
- [ ] Price history table with OHLC data
- [ ] Total return metrics card (absolute, %, invested, current value)
- [ ] Transaction markers on chart (buy/sell annotations)
- [ ] Updated transaction history with P/L impact
- [ ] Mock OHLC generation service implemented
- [ ] Empty state for assets user doesn't own
- [ ] Responsive design for mobile/tablet/desktop
- [ ] Unit tests for OHLC generation (realistic data validation)
- [ ] Unit tests for return calculations (>90% coverage)
- [ ] Visual regression tests for chart
- [ ] Accessibility audit passed (WCAG 2.1 AA)
- [ ] Performance: Chart renders in <150ms

---

## Dependencies

- **Story 2.6**: Asset Detail Page (base layout and stat cards)
- **Story 3.3**: Holdings Table Enhancements (shares `MOCK_PRICES`)

---

## Blockers & Risks

**Risk:** Generated OHLC data may look artificial  
**Mitigation:** Use realistic volatility parameters based on actual market behavior; test with multiple assets

**Risk:** Too many transaction annotations clutter chart  
**Mitigation:** Limit annotations to 10 most significant transactions; provide "View All" link

---

## Notes

### Mock Data Realism

- Study actual price patterns for assets (crypto vs stocks have different volatility)
- Bitcoin: Higher volatility (±5-10% daily)
- Stocks: Lower volatility (±2-3% daily)
- Consider weekends (no trading for stocks, continuous for crypto)

### Future Enhancements (Not in this story)

- Candlestick chart view option
- Volume bars below price chart
- Compare asset performance to benchmark (S&P 500)
- Export price history to CSV

### Testing Scenarios

1. **New asset (no holdings)**: Shows chart, no metrics, "Add Transaction" CTA
2. **Single buy transaction**: Shows positive return if price increased
3. **Multiple transactions**: Annotations on chart for each
4. **Asset with high volatility**: Chart handles large price swings
5. **Missing mock price**: Falls back gracefully

---

## Related Stories

- **Story 2.6**: Asset Detail Page (base implementation)
- **Story 3.1**: Performance Dashboard (shares chart patterns)
- **Story 3-6: Basic Price Pipeline** - Replaces mock OHLC with real API data
- **Story 5-3: TradingView Charts** - Advanced charting with indicators
