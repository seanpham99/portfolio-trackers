# Story 2.6: Asset Detail Page Content

Status: done

## Story

As a User,
I want to click on an asset in my portfolio to see its detailed performance and transaction history,
So that I can analyze why I'm making or losing money on this specific holding within its portfolio context.

## Acceptance Criteria

1. [x] **Given** I am on a Portfolio Detail page (`/portfolio/:id`)
2. [x] **When** I click a row in the Holdings Table (e.g., "AAPL")
3. [x] **Then** I should navigate to `/portfolio/:id/asset/$symbol`
4. [x] **And** I should see a **Price Chart** (TradingView widget) synced with application theme (Light/Dark)
5. [x] **And** I should see a **Transaction History** list filtered for this asset AND portfolio (Buys/Sells)
6. [x] **And** I should see my **Your Stats** card (Avg Cost, Total Return, Unrealized P/L, AND FX Gain) with data calculated by NestJS.
7. [x] **And** I should see **Breadcrumbs** navigation: `Dashboard > [Portfolio Name] > [Asset Symbol]`
8. [x] **And** I should see **Data Freshness** indicators (Staleness badge if price > 5m old)
9. [x] **And** I should see **info icon hover cards** showing P/L calculation methodology (rework from Story 2.5).
10. [x] **And** initial data should be pre-loaded from the `useHoldings(id)` cache to avoid loading flickers.

## Tasks / Subtasks

- [x] **Task 1: Backend Portfolio-Asset API**
  - [x] Implement `GET /portfolios/:id/assets/:symbol/details` in NestJS.
  - [x] Calculate holding-specific metrics: `avg_cost`, `current_value`, `total_return_pct`, `unrealized_pl`.
  - [x] **FX Intelligence:** Separate "Asset Gain" from "FX Gain" (FR7). (Basic structure implemented, calculations based on weighted avg).
  - [x] Fetch transaction history scoped to `portfolio_id` and `symbol`.

- [x] **Task 2: Asset Detail Route & Hydration**
  - [x] Create route `apps/web/src/routes/_protected._layout.portfolio.$id.asset.$symbol.tsx`.
  - [x] Update `useHoldings` query keys to be injectable into the detail page for `initialData` hydration.
  - [x] Implement Breadcrumb component using the active portfolio name and symbol.

- [x] **Task 3: Institutional UI Components**
  - [x] Embed TradingView widget with `theme` property bound to application state.
  - [x] Implement `AssetStatsCards` with FX vs Asset gain breakdown.
  - [x] **Rework Complete:** Replaced `MethodologyPanel` toggle with info icon hover cards (Story 2.5).
  - [x] Wire up `StalenessBadge` (Story 4.4) for price data.

## Dev Notes

- **Route Context:** This route MUST be a child of `_layout` to maintain navigation and sidebar.
- **Performance:** Ensure query keys for `/portfolios/:id/holdings` and `/portfolios/:id/assets/:symbol/details` are consistent to allow partial cache sharing.
- **FX Logic:** Asset Gain = `(Current Price - Avg Cost) * Qty` (in Asset Currency). FX Gain = `Value in Base Currency - (Avg Cost * Qty * Historical FX Rate) - Asset Gain in Base Currency`.
- **Methodology Display (v3):** ✅ Complete - Info icon hover cards in stat cards (e.g., next to "Avg Cost" or "P/L" labels). Uses `@repo/ui/components/hover-card` (Radix UI HoverCard).

### Rework Notes (2025-12-29)

- **Status:** ✅ Complete - Rework for AC 9 finished with HoverCard implementation
- **Change v2:** Replaced methodology toggle/panel with info icon tooltips per UX design update
- **Change v3:** Replaced Tooltip with HoverCard for better UX (hover activation, richer content)
- **Scope:** Asset detail page stat cards now show info icons with hover card content
- **Impact:** Minor UI refactor; backend API unchanged
- **Implementation:** Removed `MethodologyPanel` import, `AnimatePresence`, and toggle button; replaced `Tooltip` components with `HoverCard` components in `StatCard` with methodology props

### Project Structure Notes

- **Frontend:** `apps/web/src/routes/_protected._layout.portfolio.$id.asset.$symbol.tsx`
- **Backend:** `services/api/src/portfolios/` (Nested under portfolio service logic)

### References

- [UX: Asset Detail Spec](../project-planning-artifacts/ux/ux-design-specification.md)
- [PRD: FR7 FX Intelligence](_bmad-output/prd.md#functional-requirements)
- [Architecture: Decision 1.2 (Aggregation)](_bmad-output/architecture.md)

## Dev Agent Record

### Implementation Summary

Implemented the comprehensive Asset Detail Page including backend API, metrics logic, and high-fidelity frontend with TradingView.

### File List

- `services/api/src/portfolios/portfolios.controller.ts`: Added `getAssetDetails` endpoint.
- `services/api/src/portfolios/portfolios.service.ts`: Implemented weighted average cost basis.
- `packages/api-types/src/asset-details.dto.ts`: New shared DTOs.
- `apps/web/src/api/client.ts`: Added fetcher.
- `apps/web/src/api/hooks/use-asset-details.ts`: New hook with hydration.
- `apps/web/src/routes/_protected._layout.portfolio.$id.asset.$symbol.tsx`: Detail page.
- `apps/web/src/components/asset/trading-view-widget.tsx`: TradingView widget.

### Code Review Fixes

- **Ambiguity Fix**: Refactored backend to use `assets!inner` join.
- **TradingView Logic**: Smart symbol mapping for the widget.
- **UX Improvements**: Better error handling and dynamic methodology.
