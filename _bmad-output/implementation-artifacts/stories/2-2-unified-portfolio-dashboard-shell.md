# Story 2.2: Unified Portfolio Dashboard Shell

Status: done

 <!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a User,
I want a unified dashboard showing my total aggregated wealth across all asset classes,
So that I can manage my risk and performance holistically without switching context.

## Acceptance Criteria

1.  **Given** the dashboard page
2.  **When** I view the main "Overview" area
3.  **Then** I should see a **Portfolio Selector** in the top bar (switching between "Personal", "Family", etc.)
4.  **And** I should see a **Portfolio History Chart** (Time-series Net Worth) as the primary visual
5.  **And** I should see an **Allocation Donut** chart showing exposure by asset class (VN/US/Crypto)
6.  **And** there should typically be **NO TABS** separating asset classes; they are aggregated.

## Tasks / Subtasks

- [x] **Task 1: Dashboard Refactor**
  - [x] Rename `DashboardLayout` to `UnifiedDashboardLayout`.
  - [x] Remove "VN/US/Crypto" tabs.
  - [x] Implement Top Bar with `PortfolioSelector` dropdown.

- [x] **Task 2: Portfolio History Chart**
  - [x] Create `PortfolioHistoryChart` using Recharts/Victory.
  - [x] Visual style: Line chart with gradient fill, interactive tooltips.
  - [x] Filtering: 1D, 1W, 1M, YTD, ALL time ranges.

- [x] **Task 3: Allocation Visuals**
  - [x] Create `AllocationDonut` component.
  - [x] Interactive slices: Hovering highlights the segment.

## Dev Notes

- **Pivot:** This replaces the previous "Tabbed" design.
- **UX:** "Asset Manager Cockpit" style. Dark mode, dense but readable data.

### Project Structure Notes

- **Location:** `apps/web/src/routes/_protected.dashboard.tsx`

### References

- [Design: Unified Dashboard Concept](../project-planning-artifacts/ux/ux-design-specification.md)

## Dev Agent Record

### Implementation Plan

- Created `UnifiedDashboardLayout` to serve as the main dashboard container.
- Implemented sub-components: `PortfolioSelector`, `PortfolioHistoryChart` (AreaChart), `AllocationDonut` (PieChart), and `UnifiedHoldingsTable`.
- Removed legacy `DashboardLayout` and `StageSlider` components to support the unified view.
- Rewired routes: Both `/` and `/dashboard` now render the `UnifiedDashboardLayout`.
- Integrated `Recharts` for high-performance financial data visualization.
- Applied visual refinements: Unified chart heights, fixed spacing/alignment in headers, and added background blur effects.

### Completion Notes

✅ All acceptance criteria met:

1.  Portfolio Selector implemented with state management and ESC key support ✓
2.  Portfolio History Chart (AreaChart) displays time-series net worth with interactive tooltips ✓
3.  Allocation Donut provides clear breakdown of asset exposure by class ✓
4.  Unified view removes tabbed context switching; all assets are aggregated in one table ✓
5.  Table formatting standardized with `Intl.NumberFormat` and `tabular-nums` for vertical scannability ✓

### Test Coverage

- Created `apps/web/src/__tests__/unified-dashboard-layout.test.tsx`.
- Tests passing for: component rendering, summary stats visibility, and chart/table presence.
- Updated `test/setup.ts` to mock `ResizeObserver` and improve `react-router` reusability.

## Senior Developer Review (AI)

**Date:** 2025-12-27
**Reviewer:** Antigravity (AI)
**Outcome:** Approved with Fixes

### Issues Resolved

1.  **Visual Alignment**: Unified chart heights to 400px and aligned header/content with a max-width container.
2.  **Data Scannability**: Standardized currency formatting to prevent "+ $" spacing inconsistencies.
3.  **A11y & Cleanup**: Added keyboard (ESC) support for the Portfolio Selector and purged legacy prototype code.
4.  **Route Context**: Clarified the dual-pathing of `/` and `/dashboard` as a temporary measure until the Landing Page is implemented.

## File List

### New Files

- `apps/web/src/components/unified-dashboard-layout.tsx`
- `apps/web/src/components/dashboard/portfolio-selector.tsx`
- `apps/web/src/components/dashboard/portfolio-history-chart.tsx`
- `apps/web/src/components/dashboard/allocation-donut.tsx`
- `apps/web/src/components/dashboard/unified-holdings-table.tsx`
- `apps/web/src/__tests__/unified-dashboard-layout.test.tsx`

### Deleted Files

- `apps/web/src/components/dashboard-layout.tsx`
- `apps/web/src/__tests__/dashboard-layout.test.tsx`

## Change Log

- 2025-12-27: (Pivot) Implemented Unified Portfolio Dashboard "Asset Manager Cockpit" design.
- 2025-12-27: (Review) Fixed alignment, table formatting, and accessibility. Deleted legacy tabbed components.
