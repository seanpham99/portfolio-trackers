# Portfolios Tracker 📈

A professional, multi-asset portfolio intelligence platform that unifies Vietnamese stocks, US equities, Global stocks, and cryptocurrency tracking with institutional-grade technical analysis and transparent analytics.

## 🚀 Vision

Built for investors managing wealth across borders, **Portfolios Tracker** delivers professional-quality insights through an elegant, minimalist interface designed to reduce cognitive load during market volatility.

## ✨ Key Features

- **Unified Multi-Asset Tracking**: Single view for VN Stocks (HSX/HNX), US Equities, Global Stocks, and Crypto.
- **Professional Analytics**: Institutional-grade technical indicators (RSI, MACD, MA) via TradingView widgets and custom calculation Fallbacks.
- **Transparent Methodology**: Drill-down from net worth to transaction level with clear cost-basis and performance formulas.
- **Cross-Border Fluent**: Seamless USD/VND/USDT reconciliation with accurate FX rates, separating asset gains from currency gains.
- **Calm UX Architecture**: Designed for resilience with graceful degradation, staleness indicators, and non-blocking background sync.

## 🛠️ Technology Stack

### Core Frameworks

- **Monorepo**: [Turborepo 2.7.4](https://turbo.build/) with `pnpm`
- **Frontend**: [Next.js 16.1.2](https://nextjs.org/) (App Router, React 19.2.3)
- **Backend**: [NestJS 11.1.10](https://nestjs.com/) (Node.js runtime)
- **Database**: [Supabase JS 2.89](https://supabase.com/) (Postgres + RLS)
- **Analytics**: [ClickHouse 25.x](https://clickhouse.com/) (Historical price snapshots & deep analytics)
- **Caching**: [Upstash Redis 1.36](https://upstash.com/) (Hot market data & session state)

### Styling & UI

- **CSS**: Tailwind CSS 4
- **Components**: Radix UI / Shadcn UI
- **Typography**: Outfit / Inter

### External APIs

- **Finance**: vnstock, yfinance, Polygon.io, CoinGecko, CCXT (Binance/OKX)
- **Payments**: SePay (VND/USD subscription handling)

## 📁 Project Structure

```text
portfolios-tracker/
├── apps/
│   ├── web/                     # Next.js 16 Frontend
│   └── docs/                    # Documentation
├── services/
│   └── api/                     # NestJS Backend API
├── packages/
│   ├── finance/                 # @workspace/finance: Core financial logic (FIFO, FX)
│   ├── shared-types/            # @workspace/shared-types: Shared DTOs & Schemas
│   ├── ui/                      # @workspace/ui: Radix/Shadcn primitives
│   ├── typescript-config/       # Shared TS configurations
│   └── eslint-config/           # Shared lint configurations
├── scripts/
│   ├── start-dev.sh             # Start development environment (builds shared-types, runs API + web)
│   └── deploy-build.sh          # Production build script
└── tests/
    └── e2e/                     # Playwright cross-browser scenarios
```

## 🛠️ Getting Started

### Prerequisites

- [pnpm](https://pnpm.io/) 10.26.2+
- [Node.js](https://nodejs.org/) 22+

### Installation

1. Clone the repository
2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Copy `.env.example` to `.env` in `apps/web` and `services/api` and fill in your keys.
4. Run development server:

   **Option A: Using Turborepo (recommended for parallel development)**
   ```bash
   pnpm dev
   ```

   **Option B: Using the dev script (builds shared-types first, then runs services)**
   ```bash
   chmod +x scripts/start-dev.sh
   ./scripts/start-dev.sh
   ```

### Available Scripts

- **`scripts/start-dev.sh`**: Builds `packages/shared-types`, then starts `services/api` and `apps/web` in the background. Handles graceful shutdown with Ctrl+C.
- **`scripts/deploy-build.sh`**: Production build script that installs dependencies and builds all packages sequentially.

## 🏗️ Architectural Principles

- **ESM-First**: All internal imports must include the `.js` extension.
- **Financial Accuracy**: No floating point math for money; all calculations use string-based decimal logic in `@workspace/finance`.
- **API Response Envelope**: Consistent response format `{ success, data, error, meta: { staleness } }`.
- **Security First**: Supabase RLS enforced at the database level; Least Privilege Principle for all service roles.

## 📄 License

This project is licensed under the MIT License.
