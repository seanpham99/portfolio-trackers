# Story 3.2: Professional Technical Indicators

## Goal

As a user, I want to enable RSI, MACD, and Moving Averages on my charts, so that I can perform technical analysis directly within the platform.

**Note:** This story also addresses the implementation of the Asset Detail page and the correct integration of the TradingView Widget, ensuring alignment with Story 3.1 requirements which appear incomplete in the current codebase.

## Requirements

### Functional Requirements

- **FR2**: Professional Analytics (Technical indicators: RSI, MACD, MA via TradingView/3rd-party)
- **FR10**: Asset Detail View (TradingView charts...)

### Acceptance Criteria

- **Given** the Asset Detail page (`/asset/[symbol]`).
- **When** the page loads.
- **Then** the **TradingView Advanced Real-Time Chart Widget** is displayed (lazy-loaded).
- **And** the chart defaults to the correct asset symbol (e.g., "BINANCE:BTCUSDT" or "NASDAQ:AAPL").
- **And** technical indicators (RSI, MACD, MA) are available via the widget interface.
- **And** the chart is responsive (autosize).

## Developer Context

### Architecture & Tech Stack

- **Framework**: Next.js 16.1.2 (App Router), React 19.2.3.
- **Styling**: Tailwind CSS 4.
- **Library**: Use **`react-ts-tradingview-widgets`** (wrapper) OR the official TradingView Widget script directly.
  - **Component**: `AdvancedRealTimeChart` (provides the "Professional" features).
  - **Why**: Recharts (used in `portfolio-history-chart.tsx`) requires manual implementation of indicators. The Architecture explicitly calls for "TradingView integration".
- **Performance**: **Lazy Loading is CRITICAL**. The TradingView widget is heavy. Use `next/dynamic` with `ssr: false`.

### Implementation Guide

#### 1. Analyze & Fix Previous Work (Story 3.1 Gaps)

- **Status Check**: `sprint-status.yaml` marks Story 3.1 (TradingView Integration) as DONE, but the Asset Detail page (`apps/web/src/app/(protected)/asset/[symbol]/page.tsx`) and the Asset Feature (`apps/web/src/features/asset/`) appear missing or use placeholder implementations.
- **Action**: This story must ensure the **Asset Detail Page** exists and functions correctly.

#### 2. Create Asset Feature Components

- **Location**: `apps/web/src/features/asset/components/`
- **Component**: `AssetChart.tsx`
  - Implement using `AdvancedRealTimeChart` from `react-ts-tradingview-widgets`.
  - Props:
    - `symbol`: string (Propagate from route params).
    - `theme`: "dark" (match application theme).
    - `autosize`: true.
    - `hide_side_toolbar`: false (allow drawing tools).
    - `allow_symbol_change`: false (lock to current asset).
    - `save_image`: false.
    - `details`: true (show market status).
    - `calendar`: false.
    - `studies`: `["MASimple@tv-basicstudies", "RSI@tv-basicstudies", "MACD@tv-basicstudies"]` (configure default indicators).
- **Loading State**: Create `AssetChartSkeleton.tsx` for the "Calm" UX while the widget loads.

#### 3. Implement Lazy Loading

- **Location**: `apps/web/src/features/asset/components/index.ts` (export).
- **Usage**: In the page component, import dynamically:

  ```typescript
  const AssetChart = dynamic(
    () => import('@/features/asset/components/asset-chart').then(mod => mod.AssetChart),
    {
      ssr: false,
      loading: () => <AssetChartSkeleton />
    }
  );
  ```

#### 4. Setup Asset Detail Page

- **Location**: `apps/web/src/app/(protected)/asset/[symbol]/page.tsx`
- **Route**: Ensure generic route handles `symbol` distinctively (e.g., `BTCUSDT` vs `AAPL`).
- **Integration**: Render the `AssetChart` passing the global symbol format (e.g., `BINANCE:${symbol}` or `NASDAQ:${symbol}`). _Note: You may need a helper to map internal asset IDs to TradingView symbols._

### Anti-Patterns to Avoid

- **Reinventing Wheels**: **DO NOT** attempt to implement RSI/MACD using `recharts` and math libraries. Use the Widget.
- **Performance**: **DO NOT** import the widget directly in a Server Component or without disabling SSR. It relies on `window`.
- **Layout Shift**: Ensure the container has a fixed or minimum height (`h-[600px]`) to prevent layout shift when the widget loads.

### Library Information

- **Package**: `react-ts-tradingview-widgets`
- **Version**: Check latest compatible with React 19 (or use script fallback if issues arise).
- **Documentation**: [TradingView Widget Docs](https://www.tradingview.com/widget/advanced-chart/)

## Previous Story Intelligence

- **Story 3.1**: Marked done but implementation missing. Do not rely on existing code in `features/asset` (it likely doesn't exist).
- **Portfolio Chart**: `features/portfolio/portfolio-history-chart.tsx` uses Recharts. That is acceptable for _Portfolio Net Worth_ (simple line), but **NOT** for this story (Technical Analysis).

## Task Checklist

- [x] Install `react-ts-tradingview-widgets`.
- [x] Create `apps/web/src/features/asset/components/asset-chart.tsx`.
- [x] Create `apps/web/src/app/(protected)/asset/[symbol]/page.tsx` (if missing).
- [x] Implement lazy loading with Skeleton.
- [x] map internal symbols to TradingView symbols (e.g. `BTC` -> `BINANCE:BTCUSDT`).
- [x] Verify RSI/MACD indicators are present.
- [x] Ensure Mobile responsiveness.

## Status: `done`

## File List

- `apps/web/src/features/asset/components/asset-chart.tsx` (NEW)
- `apps/web/src/features/asset/components/asset-chart-skeleton.tsx` (NEW)
- `apps/web/src/features/asset/components/index.ts` (NEW)
- `apps/web/src/features/asset/utils/symbol-mapper.ts` (NEW)
- `apps/web/src/features/asset/utils/symbol-mapper.test.ts` (NEW)
- `apps/web/src/features/asset/utils/index.ts` (NEW)
- `apps/web/src/features/asset/index.ts` (NEW)
- `apps/web/src/app/(protected)/asset/[symbol]/page.tsx` (NEW)
- `apps/web/package.json` (MODIFIED - added react-ts-tradingview-widgets)

## Dev Agent Record

**Implementation Notes:**

- Installed `react-ts-tradingview-widgets` for TradingView Advanced Real-Time Chart
- Created lazy-loaded `AssetChart` component with `next/dynamic` and `ssr: false`
- Chart includes default studies: MA, RSI, MACD
- Created `AssetChartSkeleton` for Calm UX loading state
- Built symbol mapper utility to convert internal symbols to TradingView format
- Asset Detail page at `/asset/[symbol]` with responsive layout
- TypeScript type check passed
- ESLint fixed and passing

## Senior Developer Review (AI)

**Review Date:** 2026-01-17
**Outcome:** Approved (after fixes)

**Issues Found & Fixed:**

- [x] [HIGH] Fixed `inferAssetClass` logic - 3-letter US stocks (IBM, CAT, GE) were incorrectly mapped to VN stocks. Changed from regex-based to explicit VN stock list.
- [x] [MEDIUM] Added missing test coverage for 3-letter US stocks to prevent regression.

## Change Log

- 2026-01-17: Implemented Story 3.2 - Professional Technical Indicators with TradingView integration
- 2026-01-17: Code review completed - fixed inferAssetClass logic flaw and added tests
