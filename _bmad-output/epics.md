---
stepsCompleted: [1, 2, 3, 4, 5, 6]
inputDocuments:
  - "_bmad-output/prd.md"
  - "_bmad-output/architecture.md"
  - "_bmad-output/project-planning-artifacts/ux/ux-design-specification.md"
  - "_bmad-output/project-context.md"
---

# portfolios-tracker - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for portfolios-tracker, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: Unified Multi-Asset Tracking (VN stocks, any Global Equities, Crypto)
FR2: Professional Analytics (Technical indicators: RSI, MACD, MA via TradingView/3rd-party)
FR3: Transparent Calculations (Drill-down Net Worth -> Portfolio -> Asset -> Transaction with visible formulas)
FR4: Multi-Currency Fluency (Auto-conversion between VND/USD/USDT; separation of asset vs FX gains)
FR5: AI-Enhanced Insights (Personalized portfolio analysis and market commentary via Gemini API)
FR6: Manual Transaction Entry (Autocomplete symbol search, recent assets, keyboard shortcuts)
FR7: Crypto API Sync (OAuth/Read-only balance sync for Binance and OKX via CCXT)
FR8: Multi-Portfolio Management (Dashboard showing a list of portfolio cards with summary metrics)
FR9: Portfolio Detail View (Unified holdings table with asset-class filtering: All/VN/Global/Crypto)
FR10: Asset Detail View (TradingView charts, transaction lot history, realized/unrealized P&L)
FR11: Connections Settings (Manage API keys and OAuth connections for external providers)
FR12: Freemium Model (Free: 1 portfolio, 20 assets, manual entry. Paid: Unlimited, faster polling, AI insights)
FR13: Payments Integration (SePay integration with webhook reconciliation for subscriptions)

### NonFunctional Requirements

NFR1: Performance (API P95 < 200ms; UI Time-to-Interactive ≤ 2s; INP P75 ≤ 200ms)
NFR2: Refresh Strategy (Smart polling cadence ≈ 60s; Redis TTL ≈ 30s)
NFR3: Staleness Cues (Badges/Banners appearing when price data > 5 minutes old)
NFR4: Financial Precision (No float math; use string-based decimals or high-precision libraries)
NFR5: Security (Supabase Auth/JWT, RBAC/RLS, TLS 1.3, CSP, Webhook signature verification)
NFR6: Compliance (PDPA/GDPR alignment; data minimization; user rights management)
NFR7: Accessibility (WCAG 2.1 AA; keyboard navigation; ARIA labels; prefers-reduced-motion)
NFR8: Resiliency (Exponential backoff for external APIs; non-blocking "Calm" error handling)

### Additional Requirements

- **Monorepo Architecture**: Turborepo 2.7.4 with pnpm 10.26.2.
- **ESM-First Imports**: Internal imports MUST include the `.js` extension.
- **Shared Package Usage**: Use `@workspace/shared-types` (DTOs), `@workspace/ui` (Primitives), and `@workspace/finance` (Logic).
- **Feature-Based UI**: Frontend logic located in `apps/web/src/features/`.
- **Hybrid Read Path**: Separation of fast user feedback (NestJS/Redis) from deep analytics (Clickhouse).
- **Project Initialization**: Use `npx create-turbo@latest ./ --example kitchen-sink` as the first implementation step.
- **Dual Validation**: Zod (Frontend) mirroring Class-Validator (Backend) decorators.
- **Conventional Commits**: Strictly followed `type: subject` pattern.

### FR Coverage Map

FR1: Epic 1 - Unified Multi-Asset Tracking
FR2: Epic 3 - Professional Technical Indicators
FR3: Epic 2 - Transparent Financial Calculations
FR4: Epic 2 - Multi-Currency & FX Separation
FR5: Epic 6 - AI-Enhanced Insights
FR6: Epic 1 - Manual Transaction Entry
FR7: Epic 5 - Crypto API Sync
FR8: Epic 1 - Multi-Portfolio Dashboard
FR9: Epic 1 - Unified Holdings View
FR10: Epic 3 - Asset Detail & TradingView Charts
FR11: Epic 5 - Provider Connection Settings
FR12: Epic 6 - Freemium Tiers & Limits
FR13: Epic 6 - SePay Payment Integration
FR14: Epic 4 - Universal Asset Discovery & Request Queue

## Epic List

### Epic 1: Foundation & Unified Multi-Asset Dashboard

Establish the core monorepo foundation and provide users with a unified "cockpit" view of their multi-asset wealth (VN stocks, any global equities, and Crypto) across multiple portfolios.
**FRs covered:** FR1, FR6, FR8, FR9

#### Story 1.1: Project Initialization

As a developer, I want to initialize the project using the Turborepo kitchen-sink template, so that I have a type-safe monorepo foundation for both the NestJS API and Next.js web app.
**Acceptance Criteria:**

- **Given** an empty project directory.
- **When** running the initialization command.
- **Then** a Turborepo structure with apps/web, services/api, and shared packages is created.

#### Story 1.2: Core Domain Models & Shared Types

As a developer, I want to define the base Asset, Portfolio, and Holding schemas in @workspace/shared-types, so that the frontend and backend share a single source of truth for our core data.
**Acceptance Criteria:**

- **Given** the shared types package.
- **When** I define the standard DTOs for a Portfolio and its Unified Holdings.
- **Then** both apps/web and services/api can import these types without duplication.

#### Story 1.3: Manual Transaction Entry Form (Fast Entry)

As a user, I want to manually add buy/sell transactions using an autocomplete symbol search, so that I can accurately reflect my trades in my portfolio history and see results instantly on my dashboard.
**Acceptance Criteria:**

- **Given** the Portfolio Detail page.
- **When** I click "Add Transaction" and search for a ticker.
- **Then** I can enter Date, Price, Quantity, and Fees, and save it to the database.

#### Story 1.4: Multi-Portfolio Dashboard (Card View)

As a user, I want to see a dashboard showing all my portfolios as cards with summary totals, so that I can assess my total wealth at a glance before diving into details.
**Acceptance Criteria:**

- **Given** a user with multiple portfolios.
- **When** they land on /dashboard.
- **Then** they see a grid of PortfolioCard components showing Net Worth and P/L.

#### Story 1.5: Unified Portfolio Detail View

As a user, I want to click a portfolio and see a single list mixing my VN, Global, and Crypto assets, so that I don't have to switch between tabs to see my consolidated holdings.
**Acceptance Criteria:**

- **Given** a selected portfolio.
- **When** navigating to /portfolio/:id.
- **Then** the UnifiedHoldingsTable displays all asset types in a single sortable list.

#### Story 1.6: Asset Class Filtering

As a user, I want to filter my holdings by Asset Class (All, VN, Global, Crypto) using the tab bar, so that I can quickly focus on specific components of my portfolio.
**Acceptance Criteria:**

- **Given** the Unified Holdings view.
- **When** I click the "Crypto" filter tab.
- **Then** only cryptocurrency assets are displayed in the table.

### Epic 2: Portfolio Intelligence & Core Financial Accounting

Enable users to view accurate, transparent performance metrics (cost basis, returns) with full multi-currency conversion and separation of FX vs. asset gains.
**FRs covered:** FR3, FR4

#### Story 2.1: Transaction History & Lot Management

As a user, I want to see a list of all transactions for a specific asset within a portfolio, so that I can audit my historical trades and verify my cost basis calculations.
**Acceptance Criteria:**

- **Given** an Asset Detail page.
- **When** I scroll to the "Transaction History" section.
- **Then** I see a chronological list of all buy/sell events for that specific ticker.

#### Story 2.2: High-Precision Cost Basis (FIFO)

As a user, I want my cost basis and unrealized P/L to be calculated using the First-In-First-Out (FIFO) method, so that I have a standard and reliable view of my investment performance.
**Acceptance Criteria:**

- **Given** a portfolio with multiple buy/sell transactions.
- **When** the system calculates the current valuation.
- **Then** it uses string-based decimal math and correctly applies FIFO lots.

#### Story 2.3: Multi-Currency Accounting (FX Separation)

As a user, I want to see my gains separated by Asset Performance vs. Currency Fluctuations (FX Gain), so that I understand if I made money on the stock or on currency movement.
**Acceptance Criteria:**

- **Given** a cross-border asset.
- **When** viewing the performance breakdown.
- **Then** the UI shows "Asset Gain (%)" and "Currency Gain (%)" as distinct metrics.

### Epic 3: Professional Technical Analysis & Deep Insights

Provide professional-grade technical analysis tools, including TradingView charts and indicators (RSI, MACD, MA), allowing users to deep-dive into specific asset performance.
**FRs covered:** FR2, FR10

#### Story 3.1: TradingView Chart Integration

As a user, I want to see an interactive TradingView chart for any selected asset (VN, Global, or Crypto), so that I can visualize historical price action and trends.
**Acceptance Criteria:**

- **Given** an Asset Detail page.
- **When** the page loads.
- **Then** a TradingViewWidget displays the historical price chart for the correct ticker.

#### Story 3.2: Professional Technical Indicators

As a user, I want to enable RSI, MACD, and Moving Averages on my charts, so that I can perform technical analysis directly within the platform.
**Acceptance Criteria:**

- **Given** the chart view.
- **When** I toggle technical indicators.
- **Then** the chart displays the requested overlays (RSI, MACD, etc.) using available data.

#### Story 3.3: Calculation Methodology & Data Transparency

As a user, I want to hover over an info icon next to any metric to see its formula and data source, so that I can trust the data.
**Acceptance Criteria:**

- **Given** a metric in the UI.
- **When** I hover over the info icon.
- **Then** a HoverCard appears showing the specific formula used and the data provider.

#### Story 3.4: Asset Performance Dashboard

As a user, I want a dedicated dashboard for each asset showing key performance stats (24h change, volume, high/low), so that I have a comprehensive view of the asset's current market status.
**Acceptance Criteria:**

- **Given** the Asset Detail page.
- **When** viewing the asset header.
- **Then** I see real-time or near-real-time market data stats.

### Epic 4: Universal Asset Registry & Data Hardening

Clean up all mock data and ensure the platform can track any asset requested by a user through a unified discovery and ingestion pipeline.
**FRs covered:** FR14

#### Story 4.1: Cross-Provider Asset Discovery

As a user, I want to search for any asset symbol, so that the system can find it across all integrated providers (vnstock, Yahoo Finance, Coingecko, CCXT).
**Acceptance Criteria:**

- **Given** the Add Asset modal.
- **When** I enter a symbol.
- **Then** the system checks all active market data providers in parallel and returns the best match.

#### Story 4.2: Asset Request Capture & Queue

As a user, if an asset is not found in our current providers, I want to be able to submit it for tracking, so that the team can add it to our ingestion pipeline.
**Acceptance Criteria:**

- **Given** a search with zero results.
- **When** I click "Request Asset Tracking".
- **Then** the request is stored in a `pending_assets` queue for administrative review and automated backfilling.

#### Story 4.3: Mock Data Eviction & Service Hardening

As a developer, I want to replace all logic that uses hardcoded mock data for prices and totals, so that the application is production-ready for live user data.
**Acceptance Criteria:**

- **Given** the `PortfoliosService` and `AssetService`.
- **When** calculating net worth or fetching price data.
- **Then** every value is derived from a real database record or external API call with caching.

#### Story 4.4: Data Source Reliability & Staleness Controls

As a user, I want to see clear visual cues if my asset data is stale or if a provider is disconnected, so that I can make informed financial decisions.
**Acceptance Criteria:**

- **Given** an Asset Detail or Portfolio page.
- **When** data is older than 5 minutes.
- **Then** a "Stale Data" banner or indicator appears with a refresh trigger.

#### Story 4.5: Tech Debt - Automated FX Rate Resolution

As a user, I want the system to automatically fetch the historical exchange rate when I enter a transaction for a foreign asset, so that I don't have to look it up manually.
**Acceptance Criteria:**

- **Given** I am adding a transaction for a USD asset in a VND portfolio.
- **When** I enter the Transaction Date.
- **Then** the "Exchange Rate" field is auto-filled with the historical rate for that date (provider: Yahoo/OpenExchangeRates).

- **When** I enter the Transaction Date.
- **Then** the "Exchange Rate" field is auto-filled with the historical rate for that date (provider: Yahoo/OpenExchangeRates).

#### Story 4.6: Portfolio Analytics & History Backfill

As a generic user, I want to see the historical performance of my portfolios on a chart (1D, 1W, 1M, etc.), so that I can visualize my wealth progression over time instead of just the current snapshot.
**Acceptance Criteria:**

- **Given** a portfolio with history.
- **When** I view the Dashboard or Portfolio Details.
- **Then** the history chart displays real aggregated value over time (from `portfolio_snapshots` table).

### Epic 5: Automated Exchange Sync & Connections

Automate portfolio tracking by enabling zero-maintenance syncing for crypto holdings via Binance and OKX APIs, and provide a centralized hub for managing external provider connections.
**FRs covered:** FR7, FR11

#### Story 5.1: Binance API Sync (Read-Only)

As a user, I want to connect my Binance account via API keys (read-only), so that my spot balances are automatically tracked.
**Acceptance Criteria:**

- **Given** the Connections page.
- **When** I enter valid read-only Binance API keys.
- **Then** the system successfully fetches and displays my current spot balances.

#### Story 5.2: OKX API Sync (Read-Only)

As a user, I want to connect my OKX account via API keys, so that my holdings are automatically synchronized.
**Acceptance Criteria:**

- **Given** the Connections page.
- **When** I enter valid OKX API keys.
- **Then** the system successfully synchronizes my balances.

#### Story 5.3: Connections Management Hub

As a user, I want a centralized "Connections" page to manage all my external API integrations, so that I can easily see what's connected.
**Acceptance Criteria:**

- **Given** the application settings.
- **When** I navigate to "Connections".
- **Then** I see status cards for each provider with "Connected/Disconnected" indicators.

#### Story 5.4: Background Sync & Polling (60s)

As a user, I want my connected exchange balances to refresh automatically in the background, so that my portfolio is always up to date.
**Acceptance Criteria:**

- **Given** a connected exchange.
- **When** the system is active.
- **Then** it performs a background refresh every 60 seconds.

### Epic 6: Premium Features & Monetization

Launch the core SaaS business model, including tier limits, AI-powered personalized insights, and integrated SePay payments for domestic and international users.
**FRs covered:** FR5, FR12, FR13

#### Story 6.1: Freemium Tiers & Asset Limits

As a product owner, I want to restrict free users to 1 portfolio and 20 assets, so that I can encourage conversions to the paid "Pro" tier.
**Acceptance Criteria:**

- **Given** a user on the Free tier.
- **When** they attempt to create a second portfolio or add their 21st asset.
- **Then** a modal appears informing them of the limit and offering an upgrade path.

#### Story 6.2: SePay Payment Integration (Domestic & International)

As a user, I want to pay for a subscription using SePay (supporting VND/USD), so that I can access premium features without limits.
**Acceptance Criteria:**

- **Given** the upgrade modal.
- **When** I select a plan and complete the SePay checkout.
- **Then** the backend receives a verified webhook and instantly upgrades my account to the "Pro" tier.

#### Story 6.3: AI-Powered Portfolio Insights (Gemini)

As a paid user, I want to receive personalized market commentary and portfolio analysis via the Gemini API, so that I can get deeper insights into my investment strategy.
**Acceptance Criteria:**

- **Given** a Pro user dashboard.
- **When** they click "Generate Insights".
- **Then** the system analyzes their holdings and provides a natural language summary of performance and market risks.

#### Story 6.4: Admin Reconciliation Dashboard

As a system administrator, I want to see a list of recent payments and webhook events with their status, so that I can reconcile any delivery failures or payment anomalies.
**Acceptance Criteria:**

- **Given** the admin panel.
- **When** I view the "Payments" tab.
- **Then** I see the full audit trail of SePay webhooks and their success/failure state.
