# Portfolios Tracker

## Overview

Portfolios Tracker is a multi-asset portfolio intelligence platform that unifies Vietnamese stocks, US equities, global stocks, and cryptocurrency tracking. The system provides institutional-grade technical analysis with transparent calculation methodology for cost basis, performance, and risk metrics.

The platform extends an existing Apache Airflow + ClickHouse data pipeline into an interactive web application. Key capabilities include:

- Unified tracking across VN stocks, US equities, and crypto (Binance, OKX)
- Professional analytics with technical indicators (RSI, MACD, MA)
- Multi-currency support (VND/USD/USDT) with automatic conversion
- AI-enhanced insights via Gemini API
- Freemium model with SePay payment integration

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Monorepo Structure

The project uses Turborepo with pnpm workspaces organized as:

- `apps/web` - Next.js 16 frontend (React 19, Tailwind CSS 4, TanStack Query)
- `services/api` - NestJS 11 backend API with Swagger documentation
- `services/data-pipeline` - Python-based Airflow ETL pipelines
- `packages/ui` - Shared UI components (Radix UI/shadcn)
- `packages/shared-types` - Shared TypeScript DTOs and schemas
- `packages/eslint-config` - Shared ESLint configuration
- `packages/typescript-config` - Shared TypeScript configuration
- `packages/vitest-config` - Shared Vitest testing configuration

### Frontend Architecture

- **Framework**: Next.js 16.1.2 with React 19
- **Styling**: Tailwind CSS 4 with glassmorphism design patterns
- **State Management**: TanStack Query 5 for server state (no local state sync)
- **UI Components**: Radix UI primitives with shadcn/ui styling
- **Feature Organization**: Feature-based structure in `apps/web/src/features/`

### Backend Architecture

- **Framework**: NestJS 11 with SWC for compilation
- **API Documentation**: Swagger/OpenAPI
- **Module Organization**: Domain-based (e.g., `src/portfolios/`)
- **Response Format**: Standard envelope `{ success, data, error, meta }`
- **Validation**: Class-validator decorators mirroring frontend Zod schemas

### Data Layer

- **Primary Database**: Supabase (PostgreSQL) for user data and authentication
- **Analytics Database**: ClickHouse for historical market data and analytics
- **Caching**: Upstash Redis with ~30s TTL for price data
- **ETL Pipeline**: Apache Airflow for market data ingestion

### Authentication

- **Provider**: Supabase Auth with JWT
- **Authorization**: Row-Level Security (RLS) in PostgreSQL
- **Security**: TLS 1.3, CSP headers, webhook signature verification

### Key Design Decisions

1. **Hybrid Read Path**: Fast user feedback via NestJS/Redis, deep analytics via ClickHouse
2. **ESM-First Imports**: Internal imports must include `.js` extension
3. **Financial Precision**: Never use float math for currency - use string-based decimals
4. **Dual Validation**: Zod on frontend, class-validator on backend

## External Dependencies

### Third-Party Services

- **Supabase**: Authentication, PostgreSQL database, real-time subscriptions
- **Upstash**: Serverless Redis for caching
- **ClickHouse**: Analytics data warehouse for market data
- **Gemini API**: AI-powered portfolio insights

### Market Data Sources

- **vnstock**: Vietnamese stock market data
- **yfinance**: US/Global equity data
- **CCXT**: Cryptocurrency exchange integration (Binance, OKX)

### Payment Integration

- **SePay**: Payment gateway for Vietnamese market with webhook reconciliation

### Development Tools

- **Turborepo**: Monorepo orchestration
- **pnpm**: Package management (using Replit's built-in version)

## Running the Application

The project runs two servers in parallel:
1. **Next.js Web App** on port 5000 (frontend)
2. **NestJS API** on port 3001 (backend)

Build order: `packages/shared-types` must be built before the API can start.

### CORS Configuration
The API is configured with CORS_ORIGIN environment variable allowing:
- `https://*.replit.dev`
- `https://*.replit.app`

### Production Deployment
The deployment is configured to run both services together:
- **Build**: Builds shared-types, API, and web app sequentially
- **Run**: Starts the NestJS API in background, then the Next.js frontend
- **Target**: Autoscale deployment for automatic scaling

### Additional Tools
- **Changesets**: Version management
- **Husky + lint-staged**: Pre-commit hooks
- **Syncpack**: Dependency version synchronization
- **Knip**: Unused code detection