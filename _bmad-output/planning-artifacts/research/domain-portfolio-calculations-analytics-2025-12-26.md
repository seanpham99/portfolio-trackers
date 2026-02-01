---
stepsCompleted: [1, 2, 3, 4, 5]
inputDocuments: []
workflowType: "research"
lastStep: 5
research_type: "domain"
research_topic: "Portfolio calculation methodologies and analytics for multi-asset, multi-currency tracking"
research_goals: "Understand performance calculation methods, cost basis tracking, risk metrics, tax optimization strategies, and multi-currency accounting for transparent portfolio analytics across stocks, crypto, and commodities"
user_name: "Son"
date: "2025-12-26"
web_research_enabled: true
source_verification: true
---

# Domain Research: Portfolio Calculation & Analytics

**Date:** 2025-12-26
**Author:** Son
**Research Type:** domain
**Focus:** Portfolio Calculation Methodologies, Cost Basis, Risk Metrics, Multi-Currency Accounting

---

## Research Overview

This domain research examines the mathematical and methodological foundations for building transparent, accurate portfolio tracking and analytics for multi-asset (stocks, crypto, commodities), multi-currency (USD, VND, USDT), and multi-account portfolios. The research covers:

- **Performance calculation methodologies**: Time-weighted returns (TWR), money-weighted returns (MWR/IRR), simple returns, CAGR
- **Cost basis tracking**: FIFO, LIFO, average cost, specific identification methods for tax and P&L accuracy
- **Risk and correlation metrics**: Volatility, beta, Sharpe ratio, correlation matrices, diversification scores
- **Tax optimization strategies**: Tax-loss harvesting, wash sale rules, qualified dividends, long-term vs short-term gains
- **Multi-currency accounting**: FX conversion timing, realized vs unrealized gains, currency-neutral performance

**Key Context:**  
Portfolios Tracker differentiates on "transparent calculations"—users must understand how every number is calculated. This requires selecting industry-standard methodologies, clearly documenting formulas, and providing drill-down capabilities from aggregated metrics to individual transactions.

**Architectural Implications:**  
Calculation engine design, data model requirements, real-time vs batch computation tradeoffs, auditability and reproducibility requirements.

---

## 1. Performance Calculation Methodologies

### Overview

Portfolio performance can be measured in multiple ways, each serving different use cases. The choice of methodology significantly impacts how returns are perceived and compared.

### 1.1 Time-Weighted Return (TWR)

**Definition**: TWR measures the compound growth rate of a portfolio while eliminating the impact of deposits and withdrawals. It breaks the investment period into sub-periods at each cash flow event, calculates returns for each sub-period, and geometrically links them.

**Formula**:

```
TWR = [(1 + HP₁) × (1 + HP₂) × ... × (1 + HPₙ)] - 1

where:
HP = (End Value - (Initial Value + Cash Flow)) / (Initial Value + Cash Flow)
```

**When to Use**:

- **Comparing fund managers**: TWR is the industry standard for evaluating portfolio manager performance because it isolates investment decisions from investor-driven cash flows
- **Benchmarking against indices**: Comparing portfolio performance to S&P 500 or other market indices
- **Evaluating investment strategies**: Assessing whether a particular strategy (value investing, growth stocks, etc.) outperforms alternatives

**Advantages**:

- Eliminates distortions from deposits/withdrawals
- Standardized metric for professional comparisons
- Reflects manager skill independent of investor behavior
- Required by GIPS (Global Investment Performance Standards)

**Disadvantages**:

- Does NOT reflect actual investor experience (doesn't show actual dollar returns)
- Computationally more complex (requires tracking cash flow dates)
- Can be misleading for individual investors who care about their actual wealth growth

**Calculation Example**:

```
Portfolio starts at $1M
Q1: Grows to $1.2M (20% return), then $400K deposited → $1.6M
Q2: Grows to $1.65M (3.1% return), then $200K withdrawn → $1.45M
Q3: Grows to $1.5M (3.4% return), then $200K deposited → $1.7M
Q4: Grows to $1.9M (12% return)

TWR = [(1.20) × (1.031) × (1.034) × (1.12)] - 1 = 43%
```

### 1.2 Money-Weighted Return (MWR) / Internal Rate of Return (IRR)

**Definition**: MWR calculates the discount rate that sets the Net Present Value (NPV) of all cash flows to zero. It accounts for the timing and size of deposits/withdrawals, reflecting the actual investor experience.

**Formula**:

```
0 = CF₀ + CF₁/(1+IRR)¹ + CF₂/(1+IRR)² + ... + CFₙ/(1+IRR)ⁿ

where:
CF₀ = Initial investment (negative)
CF₁...CFₙ = Subsequent cash flows (positive for inflows, negative for outflows)
```

**When to Use**:

- **Personal portfolio tracking**: Shows actual return on invested capital
- **Evaluating personal investment decisions**: Reflects timing of contributions (e.g., did you buy at market peaks?)
- **Capital budgeting**: Assessing project profitability

**Advantages**:

- Reflects actual dollar-weighted investor experience
- Accounts for contribution timing (buying low vs. buying high)
- Intuitive for individual investors ("What did I actually earn?")

**Disadvantages**:

- Penalizes fund managers for investor behavior (large deposits before downturns)
- Difficult to compare across portfolios with different cash flow patterns
- Requires iterative calculation (no closed-form solution)
- Can produce misleading results with non-standard cash flows

**Calculation Example**:

```
Initial investment: $10,000
Year 1 dividend: $100
Year 2 dividend: $200
Year 3 sale price: $12,000

Excel formula: =IRR({-10000, 100, 200, 12000}) = ~7.5%
```

### 1.3 Compound Annual Growth Rate (CAGR)

**Definition**: CAGR represents the smoothed annualized rate of return over a period, assuming constant growth and reinvested profits.

**Formula**:

```
CAGR = [(Ending Value / Beginning Value)^(1/n) - 1] × 100

where:
n = number of years
```

**When to Use**:

- **Simplified reporting**: Easy-to-understand annualized return for marketing/reporting
- **Long-term comparisons**: Smoothing out year-to-year volatility for multi-year assessments
- **Growth projections**: Estimating future portfolio values

**Advantages**:

- Simple to calculate and understand
- Smooths volatility for clearer long-term perspective
- Useful for forecasting

**Disadvantages**:

- Masks year-to-year volatility and risk
- Assumes steady growth (unrealistic)
- Can be manipulated by choosing favorable time periods
- Ignores intermediate cash flows

**Calculation Example**:

```
Portfolio: $10,000 → $19,000 over 3 years
CAGR = [(19,000 / 10,000)^(1/3) - 1] × 100 = 23.86%
```

### 1.4 Simple Return

**Definition**: Basic percentage change from beginning to end, without annualization or compounding adjustments.

**Formula**:

```
Simple Return = [(Ending Value - Beginning Value) / Beginning Value] × 100
```

**When to Use**:

- **Short-term tracking**: Daily, weekly, monthly returns
- **Quick comparisons**: Immediate performance checks
- **Non-annualized periods**: When period length varies

**Advantages**:

- Extremely simple
- No assumptions about compounding
- Good for short periods

**Disadvantages**:

- Not comparable across different time periods
- Doesn't account for time value of money
- Misleading for multi-year comparisons

---

## 2. Cost Basis Tracking Methods

### Overview

Cost basis determines the original value of an asset for tax purposes. Accurate tracking is essential for calculating capital gains/losses and optimizing tax liabilities.

### 2.1 First In, First Out (FIFO)

**Mechanism**: The first assets purchased are assumed to be the first sold.

**Tax Impact**:

- **Inflationary markets**: Selling oldest (cheapest) shares results in HIGHER capital gains and HIGHER taxes
- **Favorable for**: Demonstrating portfolio value (higher ending inventory balance on balance sheet)

**Example**:

```
Bought: 100 shares @ $10 (Jan), 100 shares @ $15 (Feb), 100 shares @ $8 (Mar)
Sold: 150 shares @ $20

FIFO Cost Basis: (100 × $10) + (50 × $15) = $1,750
Capital Gain: (150 × $20) - $1,750 = $1,250
```

**Requirements**:

- Required under IFRS (International Financial Reporting Standards)
- Most common global standard
- Often matches actual flow of perishable/dated inventory

**Advantages**:

- Easy to understand and implement
- Transparent and auditable
- Follows natural inventory flow
- Required in many jurisdictions

**Disadvantages**:

- Can result in higher taxes during inflation
- Less flexibility for tax optimization

### 2.2 Last In, First Out (LIFO)

**Mechanism**: The most recently purchased assets are assumed to be sold first.

**Tax Impact**:

- **Inflationary markets**: Selling newest (expensive) shares results in LOWER capital gains and LOWER taxes
- **Favorable for**: Minimizing tax liability in rising markets

**Example**:

```
Same purchases as above
Sold: 150 shares @ $20

LIFO Cost Basis: (100 × $8) + (50 × $15) = $1,550
Capital Gain: (150 × $20) - $1,550 = $1,450
```

**Restrictions**:

- **NOT permitted under IFRS**
- Allowed in US under GAAP
- Less commonly used globally

**Advantages**:

- Tax savings during inflation
- Matches recent cost with current revenue

**Disadvantages**:

- Not allowed internationally
- Can understate portfolio value
- Counterintuitive (doesn't match physical flow)

### 2.3 Average Cost Method

**Mechanism**: All shares are averaged together, regardless of purchase date. New cost basis = total cost / total shares.

**Tax Impact**:

- **Moderate**: Results typically between FIFO and LIFO

**Example**:

```
Same purchases: (100×$10) + (100×$15) + (100×$8) = $3,300 for 300 shares
Average Cost = $3,300 / 300 = $11/share

Sold: 150 shares @ $20
Cost Basis: 150 × $11 = $1,650
Capital Gain: (150 × $20) - $1,650 = $1,350
```

**Common Usage**:

- **Mutual funds**: Default method for many brokerages
- **Simplicity**: Easier than tracking individual lots

**Advantages**:

- Simple calculation
- No need to track individual purchase lots
- Smooths out price fluctuations

**Disadvantages**:

- Less tax optimization flexibility
- Once selected for a fund, must continue using it
- Moderate tax impact (not optimized for either direction)

### 2.4 Specific Identification (Spec ID)

**Mechanism**: Investor explicitly chooses which specific shares/lots to sell.

**Tax Impact**:

- **Maximum flexibility**: Can minimize or maximize gains depending on tax strategy
- **Tax-loss harvesting**: Sell losing positions to offset gains

**Example**:

```
Same purchases: 100@$10, 100@$15, 100@$8
Sold: 150 shares @ $20

Strategy 1 (Minimize Gains): Sell 100@$15 + 50@$10 = $2,000 cost basis → $1,000 gain
Strategy 2 (Maximize Gains): Sell 100@$8 + 50@$10 = $1,300 cost basis → $1,700 gain
Strategy 3 (Harvest Loss): If price drops to $6, sell 100@$15 = $900 loss
```

**Requirements**:

- Must specify lots at time of sale
- Requires detailed record-keeping
- Broker confirmation of specific lots

**Advantages**:

- Maximum tax optimization
- Strategic flexibility (harvest losses, defer gains)
- Can manage short-term vs. long-term capital gains

**Disadvantages**:

- Complex record-keeping
- Requires active management
- Easy to make errors
- Not all brokers support it well

### 2.5 Multi-Currency Considerations

**Challenge**: Portfolios with assets in multiple currencies (USD, VND, EUR) require foreign exchange (FX) tracking for accurate cost basis.

**Key Issues**:

1. **Cost basis currency**: What currency is the original purchase recorded in?
2. **FX conversion timing**: When is FX rate applied (purchase date, sale date, or mark-to-market)?
3. **Currency gains/losses**: Separate from asset gains/losses

**Example (US Stock bought by Vietnamese Investor)**:

```
Purchase: 100 shares @ $50 USD when VND/USD = 23,000
Cost Basis (VND): 100 × $50 × 23,000 = 115,000,000 VND
Cost Basis (USD): $5,000

Sale: 100 shares @ $60 USD when VND/USD = 25,000
Proceeds (VND): 100 × $60 × 25,000 = 150,000,000 VND
Proceeds (USD): $6,000

Capital Gain (USD): $6,000 - $5,000 = $1,000 (20% return)
Capital Gain (VND): 150M - 115M = 35M VND (30.4% return)

FX Gain Component: 35M - (1,000 × 23,000) = 12M VND
```

**Strategies**:

- **Base currency approach**: Calculate everything in investor's home currency (VND for Vietnamese users)
- **Dual reporting**: Show gains in both currencies
- **FX-neutral performance**: Separate asset performance from currency movements

---

## 3. Risk Metrics & Portfolio Analytics

### Overview

Risk metrics quantify uncertainty and volatility, enabling investors to assess whether returns justify the risks taken.

### 3.1 Sharpe Ratio

**Definition**: Measures risk-adjusted returns by comparing excess returns (above risk-free rate) to volatility.

**Formula**:

```
Sharpe Ratio = (Rp - Rf) / σp

where:
Rp = Portfolio return
Rf = Risk-free rate (US Treasury, Vietnamese government bonds)
σp = Standard deviation of portfolio returns (volatility)
```

**Interpretation**:

- **Sharpe > 1.0**: Generally considered "good" (excess returns exceed volatility)
- **Sharpe > 2.0**: Excellent risk-adjusted performance
- **Sharpe < 0**: Portfolio underperforming risk-free rate

**Example**:

```
Portfolio Return: 18%
Risk-Free Rate: 3%
Standard Deviation: 12%

Sharpe Ratio = (18% - 3%) / 12% = 1.25 (Good risk-adjusted return)
```

**Use Cases**:

- Comparing portfolios with different volatility profiles
- Evaluating whether high-return strategies justify their risk
- Assessing fund manager performance

**Limitations**:

- Assumes normal distribution (markets have fat tails)
- Can be manipulated by lengthening measurement period
- Treats upside and downside volatility equally (but investors only fear downside)
- Sensitive to benchmark choice

**Sortino Ratio Variation**: Uses downside deviation instead of total standard deviation (only penalizes negative volatility)

### 3.2 Beta (β)

**Definition**: Measures systematic risk by comparing asset volatility to market volatility.

**Formula**:

```
β = Covariance(Re, Rm) / Variance(Rm)

where:
Re = Return on asset
Rm = Return on market (S&P 500, VN-Index, etc.)
```

**Interpretation**:

- **β = 1.0**: Asset moves with market (same volatility)
- **β > 1.0**: More volatile than market (e.g., β=1.5 means 50% more volatile)
- **β < 1.0**: Less volatile than market (defensive stocks, utilities)
- **β < 0**: Inverse correlation (gold, put options during market downturns)

**Example**:

```
Stock XYZ:
- When market rises 10%, XYZ rises 15% on average
- When market falls 10%, XYZ falls 15% on average
- Beta = 1.5

Stock ABC (Utility):
- When market moves 10%, ABC moves 5%
- Beta = 0.5
```

**Use Cases**:

- **Portfolio construction**: Mix high-beta (growth) and low-beta (defensive) stocks
- **Risk assessment**: Understand systematic vs. unsystematic risk
- **CAPM applications**: Expected return = Rf + β × (Rm - Rf)

**Limitations**:

- Based on historical data (beta changes over time)
- Only measures systematic risk (not company-specific risk)
- Assumes linear relationship with market

### 3.3 Correlation Coefficient

**Definition**: Measures strength and direction of linear relationship between two assets.

**Formula**:

```
ρxy = Covariance(x, y) / (σx × σy)

where:
ρxy = Correlation coefficient (-1 to +1)
σx, σy = Standard deviations of assets x and y
```

**Interpretation**:

- **ρ = +1**: Perfect positive correlation (assets move together)
- **ρ = 0**: No linear relationship (independent movements)
- **ρ = -1**: Perfect negative correlation (assets move opposite)
- **|ρ| > 0.7**: Strong correlation
- **|ρ| = 0.3-0.7**: Moderate correlation
- **|ρ| < 0.3**: Weak correlation

**Example**:

```
Portfolio Diversification Analysis:

US Tech Stocks ↔ US Market: ρ = +0.85 (high correlation, limited diversification)
US Stocks ↔ Gold: ρ = -0.15 (low/negative correlation, good diversification)
US Stocks ↔ VN Stocks: ρ = +0.45 (moderate correlation, decent diversification)
Bitcoin ↔ Traditional Assets: ρ = +0.30 (low correlation in past, increasing recently)
```

**Use Cases**:

- **Diversification strategy**: Select assets with low correlation
- **Hedging**: Find negatively correlated assets
- **Risk management**: Avoid concentration in highly correlated assets

**Limitations**:

- Only measures linear relationships (can miss complex patterns)
- Does NOT imply causation
- Changes over time (correlations increase during crises)
- Outliers can distort correlation

### 3.4 Portfolio Variance & Volatility

**Volatility (Standard Deviation)**: Measures dispersion of returns around the mean.

**Formula**:

```
σ = √[Σ(Ri - R̄)² / n]

where:
Ri = Individual period returns
R̄ = Average return
n = Number of periods
```

**Interpretation**:

- **Low volatility (σ < 10%)**: Stable, low-risk assets (bonds, utilities)
- **Moderate volatility (10-20%)**: Typical stock portfolios
- **High volatility (σ > 25%)**: Aggressive growth stocks, crypto

**Multi-Asset Portfolio Variance**:

```
σp² = w1²σ1² + w2²σ2² + 2w1w2ρ12σ1σ2

where:
w = weights
σ = standard deviations
ρ = correlation
```

**Key Insight**: Portfolio volatility is NOT the weighted average of individual volatilities due to correlation effects. Diversification reduces portfolio variance.

---

## 4. Strategic Synthesis: MVP Recommendations

### 4.1 Core Calculation Requirements for Portfolios Tracker MVP

**Performance Metrics (Priority 1)**:

1. **Simple Return**: Display for all time periods (day, week, month, YTD, 1Y, 3Y, All-Time)
2. **CAGR**: For periods > 1 year (easy to understand)
3. **TWR**: For comparing portfolios or benchmarking (advanced toggle)
4. **MWR/IRR**: Optional "Your Actual Return" view (reflects deposit timing)

**Rationale**: Start simple (Simple Return + CAGR) for mass market. Offer TWR/MWR as "Advanced" toggle for sophisticated users. This balances ease-of-use with differentiation on "transparent calculations."

**Cost Basis Tracking (Priority 1)**:

1. **Automatic**: Default to FIFO (most jurisdictions require)
2. **User Selectable**: FIFO, Average Cost, Spec ID
3. **Multi-Currency**: Track cost basis in user's base currency (USD or VND) with FX conversion
4. **Tax Lot Detail**: Show individual lots with purchase date, quantity, price, current value

**Rationale**: FIFO handles 80% of use cases. Average Cost for mutual funds. Spec ID for tax-optimizing power users. Multi-currency is CRITICAL for US+Vietnam positioning.

**Risk Metrics (Priority 2 - Phase 2)**:

1. **Volatility**: Standard deviation of returns (last 30/90/365 days)
2. **Sharpe Ratio**: Portfolio-level (compare to benchmarks)
3. **Beta**: Per-asset (vs. S&P 500, VN-Index, BTC for crypto)
4. **Correlation Matrix**: Show correlation between top holdings

**Rationale**: Risk metrics appeal to sophisticated investors and differentiate from competitors. Start with volatility (easy to understand), add Sharpe/Beta in Phase 2.

### 4.2 Calculation Engine Architecture

**Design Principles**:

1. **Transparency**: Every number clickable → drill-down to transaction-level detail
2. **Auditability**: Store calculation methodology with results (versioned)
3. **Reproducibility**: Given same transactions + dates, always produce same result
4. **Performance**: Pre-calculate daily snapshots; real-time for current day only

**Recommended Architecture**:

```
┌─────────────────────────────────────────────┐
│         Calculation Service Layer           │
├─────────────────────────────────────────────┤
│  Performance Calculator                     │
│  - TWR Engine (sub-period returns)          │
│  - MWR/IRR Engine (Newton-Raphson solver)   │
│  - CAGR Calculator                          │
│  - Simple Return Calculator                 │
├─────────────────────────────────────────────┤
│  Cost Basis Manager                         │
│  - FIFO Tracker                             │
│  - Average Cost Tracker                     │
│  - Spec ID Lot Manager                      │
│  - Multi-Currency Converter (with FX cache) │
├─────────────────────────────────────────────┤
│  Risk Analytics Engine (Phase 2)            │
│  - Volatility Calculator                    │
│  - Sharpe Ratio Calculator                  │
│  - Beta Calculator                          │
│  - Correlation Matrix Builder               │
└─────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────┐
│         Data Storage Layer                  │
├─────────────────────────────────────────────┤
│  Transactions Table                         │
│  - transaction_id, user_id, portfolio_id    │
│  - asset_id, type (buy/sell/dividend)       │
│  - quantity, price, currency                │
│  - date, fee, notes                         │
├─────────────────────────────────────────────┤
│  Tax Lots Table                             │
│  - lot_id, transaction_id, asset_id         │
│  - quantity_remaining, cost_basis           │
│  - purchase_date, currency                  │
├─────────────────────────────────────────────┤
│  Daily Snapshots (Pre-calculated)           │
│  - portfolio_id, date                       │
│  - total_value, returns_1d, returns_ytd     │
│  - volatility_30d, sharpe_90d               │
│  - calculation_version                      │
├─────────────────────────────────────────────┤
│  FX Rates Cache (ClickHouse Time-Series)    │
│  - date, from_currency, to_currency, rate   │
└─────────────────────────────────────────────┘
```

**Calculation Workflow**:

1. **Ingest**: User transactions → Transactions table
2. **Lot Creation**: Buy transactions → Tax Lots table (FIFO/Avg Cost/Spec ID)
3. **Daily Batch** (Airflow DAG):
   - Fetch closing prices
   - Mark-to-market all portfolios
   - Calculate performance metrics (TWR, CAGR, etc.)
   - Calculate risk metrics (volatility, Sharpe)
   - Store in Daily Snapshots
4. **Real-Time**: Current day calculations on-the-fly (not stored until EOD)
5. **On-Demand**: User requests drill-down → recalculate with transaction details

**Technology Stack**:

- **Calculation Engine**: Python (pandas for time-series, numpy for matrix operations)
- **IRR Solver**: scipy.optimize.newton or numpy_financial.irr
- **Storage**: PostgreSQL (transactions, lots) + ClickHouse (snapshots, time-series)
- **Batch Processing**: Airflow DAG (daily/hourly snapshots)
- **Real-Time API**: NestJS → Python microservice (calculation service)

### 4.3 Transparent Calculation UX

**Key Differentiator**: Every metric shows "How is this calculated?" with expandable detail.

**Example UI Flow**:

```
Portfolio Performance: +23.5% (CAGR, 3 years) [ℹ️]
  ↓ Click info icon
  ┌─────────────────────────────────────────┐
  │ CAGR Calculation                        │
  │ Formula: [(End/Start)^(1/years)] - 1    │
  │                                         │
  │ Start Value (Dec 26, 2022): $10,000    │
  │ End Value (Dec 26, 2025): $18,800      │
  │ Years: 3.0                              │
  │                                         │
  │ CAGR = [(18,800/10,000)^(1/3)] - 1     │
  │      = 1.2386 - 1 = 23.86%             │
  │                                         │
  │ [View Transactions] [Switch to TWR]    │
  └─────────────────────────────────────────┘
```

**Drill-Down Capability**:

- Performance metric → Formula → Transaction list → Individual transaction detail
- Cost basis → Tax lot history → Lot selection method → Purchase transaction

### 4.4 Multi-Currency Strategy

**Base Currency Selection**:

- User selects base currency on signup (USD, VND, EUR, etc.)
- All metrics displayed in base currency by default
- Toggle to view asset-native currency

**FX Handling**:

1. **Cost Basis**: Record at purchase-date FX rate
2. **Mark-to-Market**: Convert current value at current FX rate
3. **Performance**: Calculate in base currency (includes FX gains/losses)
4. **FX Gain Breakdown**: Separate view showing "Asset Return vs. FX Impact"

**Example (Vietnamese Investor)**:

```
Asset: Apple (AAPL)
Purchase: 100 shares @ $150 USD (FX: 23,000 VND/USD)
Cost Basis: 345,000,000 VND

Current: 100 shares @ $180 USD (FX: 25,000 VND/USD)
Current Value: 450,000,000 VND

Total Gain: 105,000,000 VND (30.4%)
  - Asset Gain: 30,000,000 VND (20% price increase: $150→$180)
  - FX Gain: 75,000,000 VND (8.7% VND depreciation: 23K→25K)
```

---

## 5. Sources & Citations

### Performance Calculation Methodologies

- **Investopedia - Time-Weighted Return**: Formula, calculation steps, portfolio manager evaluation use cases
- **Investopedia - Money-Weighted Return (MWRR)**: IRR equivalence, investor experience reflection, cash flow impact
- **Investopedia - Internal Rate of Return (IRR)**: NPV calculation, Excel IRR function, capital budgeting applications
- **Investopedia - Compound Annual Growth Rate (CAGR)**: Smoothed return calculation, limitations vs. IRR

### Cost Basis Tracking

- **Investopedia - Cost Basis**: Definition, importance for capital gains tax, reinvested dividend adjustments
- **Investopedia - FIFO Method**: Mechanism, tax implications in inflationary markets, IFRS requirements
- **Investopedia - Average Cost Basis Method**: Mutual fund applications, calculation simplicity, brokerage defaults

### Risk Metrics & Analytics

- **Investopedia - Sharpe Ratio**: William F. Sharpe (Nobel Prize 1990), risk-adjusted return formula, interpretation thresholds (>1.0 good, >2.0 excellent)
- **Investopedia - Beta**: Systematic risk measurement, CAPM applications, market volatility comparison (β=1 market, β>1 volatile, β<1 defensive)
- **Investopedia - Correlation Coefficient**: Pearson correlation formula, diversification applications, range interpretation (-1 to +1)

### Limitations & Caveats

- IRR/MWR can produce misleading results with non-standard cash flow patterns
- Sharpe Ratio assumes normal distribution; markets exhibit fat tails and serial correlation
- Beta changes over time; historical beta may not predict future volatility
- Correlation coefficients do not imply causation; correlations increase during market stress
- LIFO not permitted under IFRS (International Financial Reporting Standards)

---

## 6. Architecture & Implementation Recommendations

### 6.1 Data Model Requirements

**Core Tables**:

1. **Transactions**
   - transaction_id (UUID, PK)
   - user_id, portfolio_id (FKs)
   - asset_id, asset_type (stock/crypto/commodity)
   - transaction_type (buy/sell/dividend/interest/fee)
   - quantity, price, currency
   - date (with timezone for multi-region)
   - fee, fee_currency
   - cost_basis_method (fifo/lifo/avg/spec_id)
   - notes

2. **Tax Lots**
   - lot_id (UUID, PK)
   - transaction_id (FK to buy transaction)
   - asset_id, portfolio_id
   - quantity_original, quantity_remaining
   - cost_basis_per_unit, cost_basis_total
   - purchase_date, purchase_currency
   - status (open/partial/closed)
   - assigned_to_sale_id (NULL if open, FK if closed)

3. **Daily Snapshots** (ClickHouse Time-Series)
   - portfolio_id, date (Composite PK)
   - total_value, cash_balance
   - return_1d, return_wtd, return_mtd, return_ytd, return_1y, return_3y, return_all
   - cagr_1y, cagr_3y, cagr_all
   - twr_ytd, twr_1y, twr_3y
   - mwr_ytd, mwr_1y, mwr_3y
   - volatility_30d, volatility_90d, volatility_365d
   - sharpe_90d, sharpe_365d
   - calculation_version (for auditability)
   - calculation_timestamp

4. **FX Rates Cache** (ClickHouse)
   - date, from_currency, to_currency (Composite PK)
   - rate_close, rate_open, rate_high, rate_low
   - source (fixer.io, exchangerate-api, etc.)

### 6.2 Calculation Service API

**Endpoints**:

```typescript
// Performance Calculations
GET /api/portfolios/:id/performance
  ?method=simple|cagr|twr|mwr
  &period=1d|1w|1m|ytd|1y|3y|all
  &currency=USD|VND

Response: {
  value: 23.5,
  method: "cagr",
  period: "3y",
  startValue: 10000,
  endValue: 18800,
  formula: "[(18800/10000)^(1/3)] - 1",
  breakdown: {
    assetGain: 18.2,
    fxGain: 5.3
  }
}

// Cost Basis Drill-Down
GET /api/portfolios/:id/assets/:assetId/tax-lots
  ?method=fifo|avg|spec_id

Response: {
  asset: "AAPL",
  totalQuantity: 150,
  totalCostBasis: 15500,
  avgCostBasis: 103.33,
  lots: [
    { lotId: "...", quantity: 50, costBasis: 100, date: "2023-01-15" },
    { lotId: "...", quantity: 100, costBasis: 105, date: "2024-06-10" }
  ]
}

// Risk Metrics
GET /api/portfolios/:id/risk-metrics
  ?metrics=volatility|sharpe|beta|correlation
  &period=30d|90d|365d

Response: {
  volatility: {
    "30d": 12.5,
    "90d": 14.2,
    "365d": 16.8
  },
  sharpe: {
    "90d": 1.25,
    "365d": 1.42
  },
  beta: {
    "SPY": 1.15,
    "VN-Index": 0.85
  }
}
```

### 6.3 Airflow DAG: Daily Snapshot Calculation

**DAG Structure**:

```python
# dag: portfolio_daily_snapshot
# schedule: 0 0 * * * (daily at midnight UTC)

1. fetch_closing_prices
   - Pull from market data APIs (yfinance, vnstock, coinbase)
   - Store in market_prices table

2. mark_to_market_portfolios
   - Update portfolio values with latest prices
   - Convert to base currency using FX rates

3. calculate_performance_metrics
   - Simple returns (1d, wtd, mtd, ytd, 1y, 3y, all)
   - CAGR (1y+)
   - TWR (requires sub-period splitting at cash flows)
   - MWR (IRR calculation using scipy)

4. calculate_risk_metrics (Phase 2)
   - Volatility (30d, 90d, 365d rolling windows)
   - Sharpe Ratio (90d, 365d)
   - Beta (vs. benchmarks)
   - Correlation matrices

5. store_snapshot
   - Write to daily_snapshots table in ClickHouse
   - Trigger real-time notification if significant changes

6. cache_fx_rates
   - Fetch latest FX rates
   - Store for cost basis conversions
```

### 6.4 Calculation Versioning Strategy

**Problem**: Calculation methods may change (bug fixes, methodology improvements). How to handle historical data?

**Solution**: Version all calculations

```sql
-- daily_snapshots table includes:
calculation_version VARCHAR(10) -- e.g., "v1.0.2"

-- Changelog:
-- v1.0.0: Initial CAGR, Simple Return
-- v1.0.1: Fixed TWR sub-period date handling
-- v1.0.2: Added MWR/IRR calculation
-- v1.1.0: Added Sharpe Ratio, Beta
```

**Recalculation Strategy**:

- **Never overwrite**: Historical snapshots preserve original calculation
- **Recompute toggle**: UI allows "Recalculate with latest methodology"
- **Comparison view**: Show "v1.0.0 result vs. v1.1.0 result" for transparency

---

## 7. MVP Priorities & Phasing

### Phase 1: Core Performance & Cost Basis (Months 1-3)

**Must-Have**:

- ✅ Simple Return (all time periods)
- ✅ CAGR (1y+)
- ✅ FIFO cost basis tracking
- ✅ Multi-currency support (USD, VND base)
- ✅ Transaction-level drill-down
- ✅ "How is this calculated?" info modals
- ✅ Daily snapshot batch processing

**Outcome**: Users can track portfolio performance and understand cost basis for tax purposes.

### Phase 2: Advanced Performance & Risk (Months 4-6)

**Should-Have**:

- ✅ TWR (for portfolio comparison)
- ✅ MWR/IRR ("Your Actual Return")
- ✅ Volatility metrics (30/90/365 day)
- ✅ Sharpe Ratio
- ✅ Average Cost method
- ✅ Specific Identification (Spec ID) for tax optimization

**Outcome**: Power users can benchmark performance and assess risk-adjusted returns.

### Phase 3: Portfolio Analytics (Months 7-12)

**Nice-to-Have**:

- ✅ Beta calculation (vs. S&P 500, VN-Index, BTC)
- ✅ Correlation matrix
- ✅ Portfolio risk decomposition
- ✅ Tax-loss harvesting recommendations
- ✅ FX gain/loss breakdown
- ✅ Scenario analysis ("What if I had bought earlier?")

**Outcome**: Sophisticated analytics differentiate Portfolios Tracker from competitors.

---

## 8. Key Architectural Decisions

### Decision 1: Batch vs. Real-Time Calculations

**Recommendation**: Hybrid approach

- **Batch (Daily)**: Performance metrics, risk metrics → stored in ClickHouse snapshots
- **Real-Time (Current Day)**: On-the-fly calculation for today's returns → not stored until EOD
- **On-Demand**: Drill-downs, "what-if" scenarios → computed on request

**Rationale**: Balances performance (pre-calculated for historical) with freshness (real-time for today).

### Decision 2: Calculation Engine Language

**Recommendation**: Python (pandas, numpy, scipy)

- **Pros**: Rich financial libraries (pandas_ta, numpy_financial), fast matrix operations (numpy), IRR solvers (scipy)
- **Cons**: Requires microservice (can't run in NestJS)
- **Architecture**: NestJS API → Python calculation microservice (via gRPC or REST)

**Alternative Considered**: TypeScript (mathjs, financial) → Rejected due to weaker financial library ecosystem

### Decision 3: Cost Basis Default

**Recommendation**: FIFO as default (with user override)

- **Rationale**: FIFO required in most jurisdictions (IFRS), transparent, easy to understand
- **Alternatives**: Average Cost (simpler but less tax-optimizable), Spec ID (power users only)

### Decision 4: Risk Metrics Priority

**Recommendation**: Volatility → Sharpe → Beta → Correlation

- **Phase 1**: Skip risk metrics (focus on returns)
- **Phase 2**: Add Volatility + Sharpe (high-value, moderate complexity)
- **Phase 3**: Add Beta + Correlation (sophisticated users)

**Rationale**: Incremental value, increasing complexity.

---

## Research Completed: 2025-12-26

**Next Steps**:

1. Integrate findings into PRD (performance metrics, cost basis, risk features)
2. Use formulas/architecture in Technical Design Document
3. Reference multi-currency strategy in US+Vietnam market positioning
4. Leverage "transparent calculations" as core differentiator in competitive analysis
