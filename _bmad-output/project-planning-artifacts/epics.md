---
stepsCompleted: [1, 2, 3, 4]
inputDocuments:
  - "_bmad-output/prd.md"
  - "_bmad-output/architecture.md"
  - "_bmad-output/project-planning-artifacts/ux/ux-design-specification.md"
---

# fin-sight - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for fin-sight, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: Authentication & User Management. Support signup/login via Google OAuth and email/password using Supabase.
FR2: Multi-Asset Portfolio Creation. Create/edit/delete portfolios with multi-currency support (VND/USD/USDT).
FR3: Manual Transaction Entry. Support manual entry for VN stocks, US equities, and crypto with autocomplete (symbol search) and keyboard shortcuts.
FR4: Crypto Exchange Integration. OAuth flow for Binance and OKX via CCXT, read-only access to spot balances, real-time sync (target 5s).
FR5: Asset Price Data Ingestion. Multi-source ingestion (vnstock, yfinance, CoinGecko) into ClickHouse with staleness detection.
FR6: Portfolio Analytics Engine. Calculate net worth, allocations, and performance metrics (TWR/MWR) with drill-down from net worth → portfolio → asset → transaction.
FR7: Multi-Currency Conversion. Real-time FX rates (VND/USD/USDT) with separation of asset gains vs currency gains.
FR8: Enhanced Tabbed Navigation Dashboard. Tabbed view for VN Stocks, US Equities, and Crypto with badges (count/value) and smooth transitions.
FR9: Charts & Visualization. Embed TradingView widgets for technical indicators (RSI, MACD, MA) with lazy loading and reduced motion support.
FR10: Methodology Transparency. Inline "show methodology" panels with formulas for cost basis (FIFO/Avg), returns, and allocations.
FR11: Payments & Subscriptions. Freemium model with limit of 20 assets. Paid tier ($9-12/mo) via SePay (VND) and Polar (USD) with webhook verification.
FR12: Notifications & Alerts. Holdings snapshots, price alerts (existing Telegram integration fallback).
FR13: Admin & Operations. Reconciliation dashboard for payments, audit log export, and user management.

### NonFunctional Requirements

NFR1: Performance. P95 API <200ms (cached), <500ms (analytics); TTI ≤2s; INP P75 ≤200ms; CLS ≤0.1.
NFR2: Polling & Caching. Frontend polling ≈ 60s; Redis TTL ≈ 30s; staleness badge for data > 5 mins.
NFR3: Reliability. 99.9% uptime; payment success ≥98%; idempotent webhooks with exponential backoff.
NFR4: Security. TLS/HSTS/CSP; Supabase OAuth/JWT; RBAC/RLS; secrets rotation; webhook signature verification.
NFR5: Privacy & Compliance. PDPA (Vietnam) and GDPR compliance; consent registry; data subject rights (export/delete/correct).
NFR6: Accessibility. WCAG 2.1 AA; keyboard navigation; ARIA landmarks; color contrast ≥4.5:1; reduced motion support.
NFR7: Scalability. Support hundreds of users at launch; horizontal scaling for API/Redis; ClickHouse materialized views.
NFR8: Data Integrity. Append-only event store for audit trails; versioned calculations (`calculation_version`).

### Additional Requirements

- **Starter Template:** Minimal NestJS API + Extend existing React 19 web app in `apps/web/`.
- **Infrastructure:** Turborepo + pnpm monorepo; Docker Compose for dev; self-hosted Docker for production (except Supabase Cloud).
- **Data Strategy:** Star Schema (Facts: `Fact_Trades`, `Fact_Holdings_Daily`, `Fact_Portfolio_Valuation_Daily`).
- **Integration:** CCXT library for crypto; SePay/Polar for payments.
- **Calculating fallback:** Airflow calculates indicators only when external data is absent.
- **Enhanced Tabs:** Smooth transitions (fade + 30px slide); Cmd+1/2/3/4 shortcuts.
- **Responsive:** Bottom tab bar on mobile (≤640px); scrollable tabs on tablet.
- **Calm Experience:** Red/green colors designed for low stress; staleness badges color-neutral (amber).
- **Drill-down:** ≤3 clicks to detail; ≤15 mins to first portfolio.

### FR Coverage Map

FR1 (Auth): Epic 1 - Secure Account Foundation
FR2 (Portfolios): Epic 2 - Multi-Asset Portfolio & Manual Tracking
FR3 (Manual Entry): Epic 2 - Multi-Asset Portfolio & Manual Tracking
FR4 (Crypto Sync): Epic 4 - Professional Crypto Automation (Deferred from Epic 3)
FR5 (Price Data): Epic 3 - Portfolio Intelligence Foundation (Basic), Epic 5 - Institutional Market Intelligence (Advanced)
FR6 (Analytics Engine): Epic 3 - Portfolio Intelligence Foundation (Basic), Epic 6 - Transparent Analytics & FX Intelligence (Advanced)
FR7 (Currency Conv): Epic 6 - Transparent Analytics & FX Intelligence
FR8 (Dashboard UX): Epic 2 - Multi-Asset Portfolio & Manual Tracking
FR9 (Charts): Epic 3 - Portfolio Intelligence Foundation (Basic), Epic 5 - Institutional Market Intelligence (Advanced)
FR10 (Methodology): Epic 2 & Epic 6 - Methodology Transparency
FR11 (Payments): Epic 7 - Premium Subscriptions & Billing
FR12 (Notifications): Epic 8 - Intelligent Alerts & Engagement
FR13 (Admin/Recon): Epic 7 - Premium Subscriptions & Billing

## Epic List

### Epic 1: Secure Account Foundation

Users can securely join the platform via Google/Email and manage their identity under PDPA/GDPR compliance.
**FRs covered:** FR1, NFR4, NFR5, NFR6

### Epic 2: Multi-Asset Portfolio & Manual Tracking

Users can build a unified view of their wealth by manually logging VN/US/Crypto transactions on a premium tabbed dashboard.
**FRs covered:** FR2, FR3, FR8, FR10, NFR8

### Epic 3: Portfolio Intelligence Foundation

Users can understand their portfolio performance with analytics, visualizations, and current market data before scaling to automation.
**FRs covered:** FR5 (Basic), FR6 (Basic), FR9 (Basic)
**Status:** ACTIVE - Replaces original Epic 3 following Epic 2 retrospective (Dec 29, 2025)

### Epic 4: Professional Crypto Automation

Users can achieve "magic moment" tracking by syncing Binance and OKX balances effortlessly via read-only API access.
**FRs covered:** FR4
**Status:** DEFERRED - Was original Epic 3, moved to Epic 4 to prioritize portfolio intelligence

### Epic 5: Institutional Market Intelligence

Users can analyze assets with high-freshness price data and TradingView charts featuring professional indicators (RSI/MACD).
**FRs covered:** FR5, FR9, NFR1, NFR2, NFR7

### Epic 6: Transparent Analytics & FX Intelligence

Users can audit their performance with drill-down P&L and separate asset gains from currency fluctuations (VND/USD).
**FRs covered:** FR6, FR7, FR10

### Epic 7: Premium Subscriptions & Billing

Users can unlock unlimited assets and AI insights by subscribing via SePay (VND) or Polar (USD).
**FRs covered:** FR11, FR13, NFR3

### Epic 8: Intelligent Alerts & Engagement

Users stay informed with automated holdings snapshots and price alerts via Telegram.
**FRs covered:** FR12

### Prep Sprint 4: Repository Quality & Automation

Developers can maintain code quality and streamline releases with automated tooling.
**Goal:** Establish changesets, pre-commit hooks, and conventional commits for professional repo management.

### Prep Sprint 5: Security Hardening & Compliance Review

Platform is hardened against common web attacks and follows security best practices.
**Goal:** Implement CSRF protection, rate limiting, input validation, and secrets management.

## Epic 1: Secure Account Foundation

Users can securely join the platform via Google/Email and manage their identity under PDPA/GDPR compliance.

### Story 1.1: Initialize NestJS API & Shared Packages

As a Developer,
I want a standardized NestJS API and shared package structure,
So that I can build the backend services with type-safety and consistency across the monorepo.

**Acceptance Criteria:**

**Given** the current Turborepo structure
**When** I initialize the NestJS API using `nest new api --package-manager pnpm` in the `services/` directory
**Then** the project should be created with strict TypeScript mode enabled
**And** the `packages/database-types` (Supabase auto-gen) and `packages/api-types` (DTOs/Shared) packages should be present and linked in `pnpm-workspace.yaml`
**And** a basic health check endpoint `GET /` should return a 200 OK status.

### Story 1.2: Configure Supabase Auth & Google OAuth

As a User,
I want to authenticate via Google OAuth or Email/Password,
So that I can securely access my portfolio data.

**Acceptance Criteria:**

**Given** a Supabase project
**When** I configure Google OAuth and Email/Password providers in the Supabase dashboard
**Then** a user should be able to sign up or log in using either method
**And** the user's profile should be automatically created in the `users` table upon first login
**And** a secure JWT should be returned to the client.

### Story 1.3: Implement Login & Signup UI

As a User,
I want a premium and accessible login/signup page,
So that I can enter the app with a sense of security and trust.

**Acceptance Criteria:**

**Given** the React 19 frontend
**When** I navigate to the `/login` or `/signup` routes
**Then** I should see a polished UI with clear Google and Email options
**And** the forms must meet WCAG 2.1 AA accessibility standards (labels, focus states)
**And** validation errors (e.g., invalid email) must be displayed clearly.

### Story 1.4: Privacy Consent & PDPA Compliance

As a User,
I want to be asked for my privacy consent,
So that I know my data is handled according to PDPA and GDPR standards.

**Acceptance Criteria:**

**Given** a new user who just signed up
**When** they first enter the app
**Then** a mandatory consent modal should appear explaining data usage
**And** the user's approval must be recorded in the `user_preferences` table
**And** the user should not be able to bypass this modal to access the app functionality.

## Epic 2: Multi-Asset Portfolio & Manual Tracking

Users can build a unified view of their wealth by manually logging VN/US/Crypto transactions on a premium tabbed dashboard.

### Story 2.1: Portfolio Management Logic (API & Database)

As a User,
I want to create and manage multiple portfolios across different asset classes,
So that I can organize my investments according to my strategy.

**Acceptance Criteria:**

**Given** the NestJS API and Supabase setup
**When** I create, read, update, or delete a portfolio via the API
**Then** the changes should be reflected in the Supabase PostgreSQL database
**And** Row Level Security (RLS) must ensure I can only access my own portfolios
**And** the API should support setting a base currency (VND/USD/USDT) for each portfolio.

### Story 2.2: Enhanced Tabbed Dashboard Shell

As a User,
I want a smooth, premium tabbed interface to switch between asset classes,
So that I can explore my portfolio without cognitive overload during market volatility.

**Acceptance Criteria:**

**Given** the dashboard page in the React 19 frontend
**When** I switch between "VN Stocks", "US Equities", and "Crypto" tabs
**Then** the transition should be smooth using Framer Motion (200ms fade + 30px slide)
**And** each tab should display a badge showing the asset count and total value
**And** I can use `Cmd/Ctrl + 1/2/3` shortcuts to switch tabs on desktop.

### Story 2.3: Manual Transaction Entry with Autocomplete

As a User,
I want to quickly add buy/sell transactions with asset autocomplete,
So that I spend less than 30 seconds per entry.

**Acceptance Criteria:**

**Given** the transaction entry form
**When** I start typing an asset symbol or name
**Then** I should see a list of matching assets from a seeded `Dim_Asset` table (top 100 VN/US/Crypto symbols) to ensure functionality before the full ETL pipeline is live
**And** I should be able to specify quantity, price, and transaction fees
**And** after submission, the transaction is saved and the UI updates optimistically using React 19 Actions.

### Story 2.4: Basic Net Worth & Holdings List

As a User,
I want to see my total net worth and a list of my current holdings,
So that I can understand my current financial state at a glance.

**Acceptance Criteria:**

**Given** the dashboard view
**When** I view an asset class tab
**Then** I should see my total net worth for that category in the top summary card
**And** I should see a virtualized list of individual holdings showing quantity and average cost
**And** the UI must stack gracefully on mobile devices (bottom bar navigation).

### Story 2.5: Transparent Methodology Basic Panels

As a User,
I want to see how my cost basis is calculated,
So that I can trust the accuracy of the platform.

**Acceptance Criteria:**

**Given** a holding in the list
**When** I click the "Show Methodology" toggle
**Then** a collapsible panel should appear explaining the FIFO or Weighted Average Cost formulas
**And** the source of the asset's price data must be prominently displayed.

### Story 2.9: User Preferences & Mock Cleanup

As a User,
I want my dashboard settings (base currency, refresh preferences) to persist across sessions,
So that I have a consistent, trusted experience without "fake" mock data.

**Acceptance Criteria:**

**Given** the Settings page
**When** I change my "Base Currency" or "Refresh Interval"
**Then** the new values should be saved to the database (`user_preferences` table) and persisted on reload
**And** the "Popular Assets" list should be fetched from the API instead of a hardcoded local file.

## Epic 3: Portfolio Intelligence Foundation

Users can understand their portfolio performance with analytics, visualizations, and current market data before scaling to automation.

**Epic 3 Replan Rationale (Dec 29, 2025):**
Epic 2 retrospective revealed that while we delivered excellent data entry infrastructure (8/8 stories complete, 44/44 tests passing), we missed 50% of core MVP value: users cannot answer "How is my portfolio performing?" This epic pivots from crypto automation (deferred to Epic 4) to prioritize portfolio intelligence with a mock-first approach.

**Mock Data Strategy:**
Stories 3-1 through 3-5 will implement UI with mocked/calculated data to validate UX quickly. Story 3-6 wires real price API, replacing mocks. This approach accelerates user feedback and reduces rework risk.

### Story 2.7: Connection Settings & Data Import Improvements

As a User,
I want improved connection management and data import capabilities,
So that I can efficiently manage my portfolio data sources.

**Acceptance Criteria:**

**Given** the settings page
**When** I configure data connections
**Then** I should see clear connection status and sync history
**And** I should be able to import bulk transaction data
**And** the system should validate and deduplicate imported transactions.

**Note:** Story 2-7 was moved from Epic 2 to Epic 3 during Epic 2 retrospective (Dec 29, 2025). It provides foundation for external data sources needed in Epic 3 analytics.

### Story 3.1: Performance Dashboard Foundation

As a User,
I want to see my portfolio value over time in a line chart,
So that I can understand if my investments are growing or declining.

**Acceptance Criteria:**

**Given** the dashboard view
**When** I select the "Performance" tab
**Then** I should see a line chart showing total portfolio value over time
**And** I should be able to select time ranges (1M, 3M, 6M, 1Y, ALL)
**And** the chart should display key metrics: current value, total change ($), percentage change (%)
**And** the chart should use mocked historical data calculated from current holdings (assume linear growth/decline)
**And** hover tooltips should show exact value and date.

**Mock Data Strategy:**
Generate sample performance data in the UI by taking current portfolio value and creating historical points with realistic volatility (±2-5% daily variance). This validates the UX before Story 3-6 wires real price history.

### Story 3.2: Asset Allocation Visualization

As a User,
I want to see how my portfolio is distributed across different assets,
So that I can identify concentration risk and rebalance if needed.

**Acceptance Criteria:**

**Given** the dashboard view
**When** I view the "Allocation" section
**Then** I should see a donut/pie chart showing asset allocation by current value
**And** I should see an allocation table with columns: Asset, Value, Percentage, Change (24h)
**And** assets should be sorted by value (largest to smallest)
**And** I should be able to hover over chart segments to see detailed tooltips
**And** the visualization should use current holdings data (quantity × assumed current price).

**Mock Data Strategy:**
Calculate allocation from existing holdings in the database. Use static "current prices" in the UI initially (e.g., Bitcoin=$45K, AAPL=$180). Story 3-6 will replace with live API prices.

### Story 3.3: Holdings Table Enhancements

As a User,
I want to see current prices and real-time profit/loss in my holdings table,
So that I can quickly identify winners and losers in my portfolio.

**Acceptance Criteria:**

**Given** the unified holdings table from Story 2.4
**When** I view my holdings
**Then** I should see a "Current Price" column showing the latest market price
**And** I should see "P/L ($)" and "P/L (%)" columns calculated as: (Current Price × Quantity) - Cost Basis
**And** I should be able to sort by P/L % to see top gainers/losers
**And** positive P/L should be displayed in green, negative in red
**And** the "Current Price" should initially use mocked static prices in the UI.

**Mock Data Strategy:**
Hard-code representative current prices in a `MOCK_PRICES` constant (Bitcoin: $45,000, Ethereum: $2,500, AAPL: $180, GOOGL: $140, VNM: 76,000 VND). This enables immediate P/L display. Story 3-6 replaces with API.

### Story 3.4: Asset Detail Page Complete

As a User,
I want to see comprehensive performance data for each asset in my portfolio,
So that I can make informed decisions about individual holdings.

**Acceptance Criteria:**

**Given** an asset detail page (from Story 2.6)
**When** I view an individual asset
**Then** I should see an asset-specific performance chart (price over time)
**And** I should see a price history table with columns: Date, Open, High, Low, Close
**And** I should see total return metrics: Absolute Return ($), Percentage Return (%), Total Invested
**And** I should see transaction history for this asset with complete details
**And** the chart and price history should use mocked data generated in the UI.

**Mock Data Strategy:**
Generate sample OHLC (Open-High-Low-Close) data for the past 90 days with realistic price movement around the current mock price (±3% daily variance). This validates chart UX before real API integration.

### Story 3.5: Transaction Completeness

As a User,
I want to capture all relevant transaction details when logging trades,
So that I have a complete record for tax reporting and performance analysis.

**Acceptance Criteria:**

**Given** the transaction entry form (from Story 2.3)
**When** I add or edit a transaction
**Then** I should see fields for: Transaction Fees, Transaction Time (datetime), Notes (optional), Source (e.g., "Binance", "Vanguard", "Manual")
**And** the API should accept these fields in the TransactionDto
**And** a database migration should add columns: `fees`, `transaction_time`, `notes`, `source` to the transactions table
**And** the holdings table and asset detail should display fee information
**And** P/L calculations should account for transaction fees.

**Database Schema Update:**

```sql
ALTER TABLE transactions ADD COLUMN fees DECIMAL(20, 8) DEFAULT 0;
ALTER TABLE transactions ADD COLUMN transaction_time TIMESTAMP DEFAULT NOW();
ALTER TABLE transactions ADD COLUMN notes TEXT;
ALTER TABLE transactions ADD COLUMN source VARCHAR(100);
```

### Story 3.6: Basic Price Pipeline

As a Developer,
I want to integrate with an external price API to fetch real market data,
So that users see live prices instead of mocked data.

**Acceptance Criteria:**

**Given** the NestJS API
**When** I integrate a price data provider (CoinGecko for crypto, Alpha Vantage or yfinance proxy for stocks)
**Then** the API should fetch current prices for all assets in user portfolios
**And** the API should cache prices in Redis (TTL: 5 minutes) to avoid rate limits
**And** a scheduled job should refresh prices every 5-10 minutes
**And** the UI should fetch prices from the API endpoint instead of using `MOCK_PRICES`
**And** a "Last Updated" timestamp should be displayed in the holdings table
**And** if the API fails, the UI should show a "stale data" badge and fall back to the last cached price.

**API Endpoints:**

- `GET /api/prices/current?symbols=BTC,ETH,AAPL` → Returns current prices
- `GET /api/prices/history/:symbol?days=90` → Returns historical OHLC data

**Mock Replacement:**
This story replaces all mocked prices from Stories 3-1 through 3-4 with real API data. The transition should be seamless (same UI components, different data source).

## Epic 4: Professional Crypto Automation (Deferred from Original Epic 3)

**Deferral Note (Dec 29, 2025):**
Original Epic 3 "Professional Crypto Automation" has been deferred to Epic 4 following Epic 2 retrospective. Portfolio intelligence (analytics, charts, price data) was prioritized over automation to deliver immediate user value. Users need to understand "How is my portfolio performing?" before scaling to automated exchange syncing.

Users can achieve "magic moment" tracking by syncing Binance and OKX balances effortlessly via read-only API access.

### Story 4.1: CCXT Integration & Exchange Service

As a Developer,
I want a unified service to interact with multiple crypto exchanges,
So that I can easily fetch balances from Binance and OKX without writing custom logic for each.

**Acceptance Criteria:**

**Given** the NestJS API
**When** I integrate the CCXT library
**Then** I should have a service that can fetch spot balances from any supported exchange given valid credentials
**And** the internal response must be normalized into a standard "Balance" format (Asset, Quantity, Value).

### Story 4.2: Crypto Exchange Connection UI

As a User,
I want to securely connect my Binance or OKX accounts via API keys,
So that I don't have to manually enter my crypto transactions.

**Acceptance Criteria:**

**Given** the "Connections" settings page
**When** I enter a valid read-only API key and secret for a supported exchange
**Then** the UI should validate the connection status immediately
**And** the credentials must be stored securely (encrypted at rest)
**And** I should clearly see my "Last Synced" status once connected.

### Story 4.3: Automated Spot Balance Syncing

As a User,
I want my crypto balances to update automatically every minute,
So that my net worth is always accurate.

**Acceptance Criteria:**

**Given** a connected crypto exchange account
**When** the background polling job executes (every 60 seconds)
**Then** the latest spot balances should be fetched via CCXT
**And** any changes in holdings must be updated in the database
**And** the UI should reflect "Syncing" vs "Up to date" states.

## Epic 5: Institutional Market Intelligence

Users can analyze assets with high-freshness price data and TradingView charts featuring professional indicators (RSI/MACD).

As a Developer,
I want an ETL pipeline that fetches prices from vnstock, yfinance, and CoinGecko,
So that I have comprehensive market coverage for all asset classes.

**Acceptance Criteria:**

**Given** the Airflow environment
**When** the `market_data_ingestion` DAG runs
**Then** it should fetch primary prices for VN stocks (vnstock), US stocks (yfinance), and Crypto (CoinGecko)
**And** it should ingest specifically required tickers into the ClickHouse `market_dwh.fact_stock_daily` table.

### Story 5.2: ClickHouse Materialized Views for Latest Prices

As a Developer,
I want a fast way to query the "as of now" price for thousands of assets,
So that the dashboard loads in under 200ms.

**Acceptance Criteria:**

**Given** the `fact_stock_daily` table in ClickHouse
**When** a new price is ingested
**Then** a Materialized View (Using `ReplacingMergeTree`) must maintain only the latest timestamp per ticker
**And** queries for "Current Price" should target this view for maximum performance.

### Story 5.3: TradingView Chart Component Integration

As a User,
I want to see advanced price charts with RSI, MACD, and Moving Averages,
So that I can perform professional technical analysis on my holdings.

**Acceptance Criteria:**

**Given** the Asset Detail page
**When** I view an asset
**Then** a TradingView widget must be embedded and pre-configured with RSI (14), MACD, and MA (50, 200)
**And** the chart must support light/dark mode and respect "Reduced Motion" settings.

### Story 5.4: Data Freshness Indicators & Staleness Banners

As a User,
I want to know if the market data I'm seeing is old,
So that I don't make decisions based on outdated prices.

**Acceptance Criteria:**

**Given** a price record in the UI
**When** the `updated_at` timestamp is older than 5 minutes
**Then** a color-neutral amber "Stale Data" badge should appear
**And** a global notification banner should warn if major providers (e.g., vnstock) are experiencing outages.

## Epic 6: Transparent Analytics & FX Intelligence

Users can audit their performance with drill-down P&L and separate asset gains from currency fluctuations (VND/USD).

### Story 6.1: Portfolio Valuation Engine (Core)

As a Developer,
I want a calculation engine that aggregates holdings with latest prices,
So that I can deliver real-time net worth and basic P&L metrics.

**Acceptance Criteria:**

**Given** a user's transactions and the latest prices in ClickHouse
**When** the valuation engine runs (triggered by polling or mutation)
**Then** it must calculate current Net Worth, Allocation %, and Unrealized P&L in the portfolio's native currency.

### Story 6.2: FX Intelligence & Cross-Border Gain Separation

As a User,
I want to see separate asset gains from currency fluctuations (VND/USD),
So that I can understand the true source of my portfolio growth.

**Acceptance Criteria:**

**Given** assets held in multiple currencies
**When** I view my consolidated dashboard
**Then** the system must separate Asset Gain (price change) from FX Gain (currency change) based on the exchange rate at the time of trade vs now
**And** it must fetch latest FX rates from ClickHouse to perform the conversion to the user's chosen base currency.

### Story 6.3: Performance Metrics (TWR/MWR)

As a User,
I want to see my Time-Weighted Return (TWR) and Money-Weighted Return (MWR),
So that I can accurately assess my investment performance.

**Acceptance Criteria:**

**Given** the portfolio history
**When** I view the "Performance" tab
**Then** the engine should calculate TWR and MWR for selected timeframes (1D, 1M, YTD, ALL)
**And** it should display Total Gain, Realized P&L, and Dividends (if tracked).

### Story 6.4: Hierarchical Drill-down UI

As a User,
I want to click on my net worth to see individual portfolios, and then specific assets and their trades,
So that I can audit my data in no more than 3 clicks.

**Acceptance Criteria:**

**Given** the Dashboard
**When** I click on a Portfolio -> Asset -> Transaction List
**Then** I should reach the individual trade level within 3 clicks
**And** the UI must maintain breadcrumb navigation to allow high-speed context switching.

## Epic 7: Premium Subscriptions & Billing

Users can unlock unlimited assets and AI insights by subscribing via SePay (VND) or Polar (USD).

### Story 7.1: SePay & Polar Webhook Handlers

As a Developer,
I want to process payments from SePay and Polar automatically,
So that users are upgraded instantly after paying.

**Acceptance Criteria:**

**Given** a payment event from SePay (VND) or Polar (USD)
**When** the webhook is received
**Then** the signature must be verified for security
**And** the process must be idempotent (using event IDs) to prevent double-billing
**And** the user's `subscription_tier` must update to `PAID` immediately upon success.

### Story 6.2: Subscription Tier Enforcement

As a User,
I want to be prompted to upgrade when I hit the free limit,
So that I know how to unlock the full power of the app.

**Acceptance Criteria:**

**Given** a FREE tier user
**When** they attempt to add more than 20 assets or use advanced analytics
**Then** the action must be blocked
**And** a premium modal should appear offering the Paid Tier upgrade.

### Story 7.3: Admin Payment Reconciliation Dashboard

As an Administrator,
I want to see a list of payments and reconcile them against user tiers,
So that I can ensure the business is running correctly.

**Acceptance Criteria:**

**Given** the Admin panel
**When** I view the "Payments" section
**Then** I should see a ledger of all SePay and Polar events
**And** any discrepancies (e.g., successful payment but tier not updated) should be flagged for manual review.

## Epic 8: Intelligent Alerts & Engagement

Users stay informed with automated holdings snapshots and price alerts via Telegram.

### Story 8.1: Daily Telegram Summary Bot Integration

As a User,
I want to receive a daily snapshot of my portfolio on Telegram,
So that I stay informed without having to log in to the app every day.

**Acceptance Criteria:**

**Given** a linked Telegram account
**When** the scheduled task runs daily
**Then** the bot should send a clean summary of Net Worth change and top 3 movers
**And** it should include a link to the "Calm Dashboard" for deeper exploration.

### Story 8.2: Basic Price Alert Configuration UI

As a User,
I want to set price alerts for my favorite assets,
So that I don't have to watch the market constantly.

## Prep Sprint 4: Repository Quality & Automation

Developers can maintain code quality and streamline releases with automated tooling.

### Story Prep-4.1: Changesets for Version Management

As a Developer,
I want automated versioning and changelog generation via Changesets,
So that I can track changes across packages and publish releases with confidence.

**Acceptance Criteria:**

1. **Given** the monorepo structure
   **When** I run `pnpm changeset add`
   **Then** I should be prompted to select affected packages and describe changes

2. **Given** multiple changesets in `.changeset/`
   **When** I run `pnpm changeset version`
   **Then** package versions should be bumped atomically and CHANGELOG.md files updated

3. **Given** a changeset workflow
   **When** changes are committed
   **Then** a GitHub Action (or equivalent) should validate changeset presence for non-chore commits

### Story Prep-4.2: Lint-Staged & Husky for Pre-Commit Quality

As a Developer,
I want automatic linting and formatting before commits,
So that code quality issues are caught before reaching CI.

**Acceptance Criteria:**

1. **Given** staged files with linting errors
   **When** I run `git commit`
   **Then** the commit should be blocked and errors displayed

2. **Given** staged TypeScript files
   **When** pre-commit hook runs
   **Then** only staged files should be type-checked (not entire project)

3. **Given** successful pre-commit checks
   **When** I commit
   **Then** changes should be automatically formatted (Prettier)

### Story Prep-4.3: Conventional Commits & Commit Linting

As a Developer,
I want enforced conventional commit messages,
So that changelogs are auto-generated correctly and commit history is readable.

**Acceptance Criteria:**

1. **Given** a commit message like `feat: add user auth`
   **When** I commit
   **Then** it should pass validation

2. **Given** an invalid message like `updated stuff`
   **When** I commit
   **Then** it should be rejected with helpful error message

3. **Given** conventional commits in history
   **When** generating changelog
   **Then** commits should be grouped by type (feat, fix, chore, etc.)

## Prep Sprint 5: Security Hardening & Compliance Review

Platform is hardened against common web attacks and follows security best practices.

### Story Prep-5.1: CSRF Protection & Security Headers

As a User,
I want protection against CSRF attacks,
So that malicious sites cannot perform actions on my behalf.

**Acceptance Criteria:**

1. **Given** the NestJS API
   **When** a request is made without proper CSRF token
   **Then** it should be rejected with 403 Forbidden

2. **Given** the React frontend
   **When** making mutations (POST/PUT/DELETE)
   **Then** a CSRF token should be included in headers

3. **Given** API responses
   **When** inspecting headers
   **Then** I should see: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Strict-Transport-Security`

### Story Prep-5.2: Rate Limiting & DDoS Protection

As a System Administrator,
I want API rate limiting per user/IP,
So that the platform remains available during traffic spikes or attacks.

**Acceptance Criteria:**

1. **Given** authenticated requests
   **When** a user exceeds 100 requests/minute
   **Then** they should receive 429 Too Many Requests

2. **Given** unauthenticated requests
   **When** an IP exceeds 20 requests/minute
   **Then** they should be rate-limited

3. **Given** rate-limit exceeded
   **When** response is sent
   **Then** it should include `Retry-After` header

### Story Prep-5.3: Input Validation & Sanitization Audit

As a Security Engineer,
I want comprehensive input validation across all API endpoints,
So that injection attacks (SQL/XSS/NoSQL) are prevented.

**Acceptance Criteria:**

1. **Given** user inputs in DTOs
   **When** validation fails
   **Then** descriptive errors should be returned (no stack traces in production)

2. **Given** file uploads (future CSV import)
   **When** validating
   **Then** MIME type, size, and content should be checked

3. **Given** API responses
   **When** rendering user-generated content
   **Then** XSS payloads should be sanitized

### Story Prep-5.4: Secrets Management & Rotation Policy

As a DevOps Engineer,
I want a documented secrets rotation policy,
So that compromised keys can be replaced without downtime.

**Acceptance Criteria:**

1. **Given** environment variables
   **When** reviewing
   **Then** no secrets should be hardcoded in source code or `template.env`

2. **Given** production deployment
   **When** rotating `ENCRYPTION_KEY`
   **Then** dual-key decryption should support old + new keys during transition

3. **Given** external API keys (CCXT, payment providers)
   **When** rotating
   **Then** services should detect rotation and reload without restart

## Prep Sprint 6: Monorepo Quality & Architecture Enforcement

Developers can maintain architectural integrity and prevent technical debt through automated workspace-wide quality checks.

**Goal:** Establish Syncpack (version consistency), Knip (dead code detection), and Turbo Gen (scaffolding templates) to enforce monorepo discipline.

### Story Prep-6.1: Syncpack for Version Consistency

As a Developer,
I want all packages to use identical versions of shared dependencies,
So that I avoid "works on my machine" issues caused by version drift.

**Acceptance Criteria:**

1. **Given** multiple packages importing `react`
   **When** I run `syncpack list-mismatches`
   **Then** any version discrepancies should be detected and reported

2. **Given** CI pipeline
   **When** a PR introduces version mismatches
   **Then** the build should fail with clear error messages

3. **Given** detected mismatches
   **When** I run `syncpack fix-mismatches`
   **Then** all package.json files should be updated to use the highest semver-compatible version

### Story Prep-6.2: Knip for Dead Code Detection

As a Developer,
I want to detect unused files, exports, and dependencies across the entire workspace,
So that the codebase stays lean and maintainable.

**Acceptance Criteria:**

1. **Given** the monorepo workspace
   **When** I run `knip`
   **Then** it should report unused files, exports, types, and dependencies

2. **Given** CI pipeline
   **When** dead code is detected
   **Then** the build should warn (not fail) with actionable cleanup suggestions

3. **Given** `knip.json` configuration
   **When** configured with entry points for each workspace package
   **Then** it should correctly analyze TypeScript project references and Turborepo dependencies

### Story Prep-6.4: Turbo Gen for Package Scaffolding

As a Developer,
I want standardized templates for creating new packages,
So that every package starts with correct tsconfig, eslint, and package.json configs.

**Acceptance Criteria:**

1. **Given** Turbo Gen installed
   **When** I run `turbo gen package`
   **Then** it should prompt for package name and type (app/library/service)

2. **Given** a package template
   **When** generation completes
   **Then** the new package should include: package.json with workspace:\* deps, tsconfig.json extending @repo/typescript-config, README.md

3. **Given** template configuration
   **When** creating a new package
   **Then** it should be automatically added to pnpm-workspace.yaml and turbo.json

**Acceptance Criteria:**

**Given** the Asset Detail page
**When** I set a target price (Above/Below)
**Then** the system should monitor ClickHouse prices
**And** it should trigger a Telegram notification when the condition is met.
