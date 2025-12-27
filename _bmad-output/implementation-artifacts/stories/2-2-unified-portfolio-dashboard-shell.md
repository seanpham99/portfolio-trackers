# Story 2.2: Unified Portfolio Dashboard Shell
 
 Status: todo
 
 <!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->
 
 ## Story
 
 As a User,
 I want a unified dashboard showing my total aggregated wealth across all asset classes,
 So that I can manage my risk and performance holistically without switching context.
 
 ## Acceptance Criteria
 
 1. **Given** the dashboard page
 2. **When** I view the main "Overview" area
 3. **Then** I should see a **Portfolio Selector** in the top bar (switching between "Personal", "Family", etc.)
 4. **And** I should see a **Portfolio History Chart** (Time-series Net Worth) as the primary visual
 5. **And** I should see an **Allocation Donut** chart showing exposure by asset class (VN/US/Crypto)
 6. **And** there should typically be **NO TABS** separating asset classes; they are aggregated.
 
 ## Tasks / Subtasks
 
 - [ ] **Task 1: Dashboard Refactor**
   - [ ] Rename `DashboardLayout` to `UnifiedDashboardLayout`.
   - [ ] Remove "VN/US/Crypto" tabs.
   - [ ] Implement Top Bar with `PortfolioSelector` dropdown.
 
 - [ ] **Task 2: Portfolio History Chart**
   - [ ] Create `PortfolioHistoryChart` using Recharts/Victory.
   - [ ] Visual style: Line chart with gradient fill, interactive tooltips.
   - [ ] Filtering: 1D, 1W, 1M, YTD, ALL time ranges.
 
 - [ ] **Task 3: Allocation Visuals**
   - [ ] Create `AllocationDonut` component.
   - [ ] Interactive slices: Hovering highlights the segment.
 
 ## Dev Notes
 
 - **Pivot:** This replaces the previous "Tabbed" design.
 - **UX:** "Asset Manager Cockpit" style. Dark mode, dense but readable data.
 
 ### Project Structure Notes
 
 - **Location:** `apps/web/src/routes/_protected.dashboard.tsx`
 
 ### References
 
 - [Design: Unified Dashboard Concept](../project-planning-artifacts/ux/ux-design-specification.md)

## Dev Agent Record

### Implementation Plan

- Created `DashboardLayout` component with three tabs (VN Stocks, US Equities, Crypto)
- Implemented tab state management using React useState hook
- Applied Framer Motion's `AnimatePresence` for smooth transitions with 200ms duration
- Used 30px vertical slide animation combined with opacity fade
- Added badges displaying mock asset count and total value for each tab
- Implemented keyboard shortcuts (Cmd/Ctrl + 1/2/3) using useEffect and keydown event listeners
- Integrated component into routing structure via `_protected._layout.dashboard.tsx`

### Completion Notes

✅ All acceptance criteria met:
1. Dashboard page created with tabbed interface ✓
2. Smooth transitions between VN Stocks, US Equities, and Crypto tabs ✓
3. Framer Motion animations (200ms fade + 30px slide) implemented ✓
4. Badges showing asset count and total value on each tab ✓
5. Keyboard shortcuts (Cmd/Ctrl + 1/2/3) working ✓

### Test Coverage

- Created comprehensive test suite with 6 tests
- All tests passing (19/19 total in project)
- Test coverage includes: tab rendering, default active state, click interactions, badges, keyboard shortcuts, and accessibility

## Senior Developer Review (AI)

**Date:** 2025-12-27
**Reviewer:** Antigravity (AI)
**Outcome:** Approved with Fixes

### Issues Resolved
1.  **Runtime Crash**: Fixed `Cannot read properties of null (reading 'useRef')` by forcing single React instance in `vite.config.ts`.
2.  **Hardcoded Data Coupling**: Refactored `DashboardLayout` to accept `stats` prop. 
3.  **No URL State Persistence**: Implemented `useSearchParams` to sync `?view=tab`.
4.  **Accessibility**: Fixed `aria-controls` pointing to unmounted panels.
5.  **Formatting**: Improved currency formatting to standard USD.

## File List

### New Files
- `apps/web/src/components/dashboard-layout.tsx` - Main DashboardLayout component
- `apps/web/src/routes/_protected._layout.dashboard.tsx` - Dashboard route integration
- `apps/web/src/__tests__/dashboard-layout.test.tsx` - Component test suite

## Change Log

- 2025-12-27: Implemented enhanced tabbed dashboard shell with Framer Motion animations, badges, and keyboard shortcuts. All tests passing.
- 2025-12-27: (Code Review) Fixed runtime crash, refactored for props/URL state, and improved accessibility/formatting.
