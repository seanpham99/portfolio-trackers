# Story 2.5: Transparent Methodology Hover Cards

Status: done

## Story

As a User,
I want to see how my cost basis is calculated via an info icon hover card,
So that I can trust the accuracy of the platform without losing screen space.

## Acceptance Criteria

1. **Given** a holding in the `UnifiedHoldingsTable`
2. **When** I hover over (desktop) or tap (mobile) the info icon next to the P/L column header or value
3. **Then** a **HoverCard** must appear using the `@workspace/ui` HoverCard component (Radix UI)
4. **And** the hover card must display the calculation formula (FIFO/Weighted Avg) and the **Asset Data Source** (e.g., "Binance via CCXT", "vnstock", "Manual Entry")
5. **And** the hover card must have smooth fade-in animation (respecting `prefers-reduced-motion`)
6. **And** methodology data must be server-driven via the `HoldingDto` to ensure consistency
7. **And** the info icon must meet accessibility standards (`aria-label` for screen readers, keyboard focusable)
8. **And** the hover card must not push content or cause layout shift

## Design Rationale

**Previous Approach:** Row expansion panels with Framer Motion animations.
**Issue:** Takes significant vertical space, pushes content down, creates jarring layout shifts.
**Intermediate Approach:** Tooltip components (v2 initial implementation).
**Final Approach:** Info icon with hover card (using Radix UI HoverCard via `@workspace/ui`).
**Benefits:**

- Zero layout shift
- Always accessible via icon
- Space-efficient
- Better UX than tooltips: hover activation (no click required), richer content display
- Industry standard pattern (used by Stripe, Linear, Vercel dashboards)

## Tasks / Subtasks

### Completed (v1 - Row Expansion)

- [x] **Task 1: Extend Shared API Contracts**
  - [x] Update `HoldingDto` with `calculationMethod` and `dataSource` fields ✅ Done
  - [x] Define `CalculationMethod` enum ✅ Done
  - [x] Update NestJS `PortfoliosService` ✅ Done

### Rework Required (v2 - Tooltips)

- [x] **Task 1: Remove Row Expansion Logic**
  - [x] Remove `getExpandedRowModel()` from `UnifiedHoldingsTable`
  - [x] Remove expansion column from table columns
  - [x] Remove `ExpandedState` and related handlers
  - [x] Archive `methodology-panel.tsx` (keep for reference)

- [x] **Task 2: Implement HoverCard-Based Methodology**
  - [x] Add info icon (`Info` from `lucide-react`) to P/L column header or individual cells
  - [x] Wrap icon with `HoverCard`, `HoverCardTrigger`, `HoverCardContent` from `@workspace/ui`
  - [x] Create `MethodologyHoverCardContent` component to display:
    - Calculation method title (e.g., "Weighted Average Cost Basis")
    - Formula (e.g., "Avg Cost = Total Cost / Total Quantity")
    - Data source badge
  - [x] Ensure keyboard accessibility (focusable icon, `aria-label`)
  - [x] Test with `prefers-reduced-motion` to ensure smooth behavior

## Dev Agent Record

### v1 Implementation (Row Expansion - Completed 2025-12-28)

**Implemented:**

- ✅ Extended `HoldingDto` with `calculationMethod` and `dataSource`
- ✅ Created `MethodologyPanel` component with Framer Motion animations
- ✅ TanStack Table row expansion with ARIA attributes
- ✅ Accessibility support with `prefers-reduced-motion`

**Issue Identified (2025-12-29):**

- ❌ Row expansion takes significant vertical space
- ❌ Layout shifts when toggling methodology panels
- ❌ Poor UX on mobile (limited screen real estate)

### v2 Rework (Tooltips - Required)

**Rationale:** Replace row expansion with tooltip-based methodology display for:

- Zero layout shift
- Better space efficiency
- Industry-standard pattern
- Consistent with design system (`@workspace/ui`)

**Status:** ✅ Complete (2025-12-29) → Superseded by v3 HoverCard implementation

**Implementation Summary:**

- ✅ Removed TanStack Table row expansion logic (`getExpandedRowModel`, `ExpandedState`, expansion column)
- ✅ Added info icon tooltips to P/L column (header + individual cells)
- ✅ Integrated `@workspace/ui/components/tooltip` (Radix UI Tooltip)
- ✅ Methodology content helper function for displaying calculation methods
- ✅ Full accessibility support (`aria-label`, `tabIndex={0}`, keyboard focusable)
- ✅ Zero layout shift - tooltips overlay content without pushing rows
- ✅ Archived `methodology-panel.tsx` for reference
- ✅ All tests passing (4/4 in unified-holdings-table.test.tsx)
- ✅ No regressions (44/44 tests passing across codebase)
- ✅ Type-check passed

### v3 Final Implementation (HoverCard - Current)

**Rationale:** Replace Tooltip with HoverCard for enhanced UX:

- Better hover activation (no click required)
- Richer content display capabilities
- More suitable for methodology formulas and descriptions
- Consistent with Radix UI design patterns

**Status:** ✅ Complete (2025-12-29)

**Implementation Summary:**

- ✅ Created `hover-card.tsx` component in `@workspace/ui` package
- ✅ Installed `@radix-ui/react-hover-card` dependency
- ✅ Replaced all Tooltip components with HoverCard in:
  - `UnifiedHoldingsTable` P/L column header
  - `UnifiedHoldingsTable` P/L cells (per-asset methodology)
- ✅ Maintained full accessibility support
- ✅ Zero layout shift preserved
- ✅ All tests passing (44/44)
- ✅ Type-check passed

**Files Modified:**

- `packages/ui/src/components/hover-card.tsx` (created)
- `apps/web/src/components/dashboard/unified-holdings-table.tsx`
- `apps/web/src/routes/_protected._layout.portfolio.$id.asset.$symbol.tsx`

## File List

- packages/api-types/src/calculation-method.enum.ts
- packages/api-types/src/holding.dto.ts
- packages/api-types/src/index.ts
- services/api/src/portfolios/portfolios.service.ts
- services/api/src/portfolios/portfolios.service.spec.ts
- apTooltip Pattern:\*\* Use `@workspace/ui/components/tooltip` (Radix UI) for consistent, accessible tooltips across the app.
- **Icon Placement:** Add info icon next to P/L column header or in each cell (TBD based on UX testing).
- **Content:** Keep tooltip content concise (3-4 lines max) to avoid overwhelming users.
- **A11y:** Ensure icon is keyboard focusable (`tabIndex={0}`) and has descriptive `aria-label`.
- **Performance:** Tooltip component is already optimized; no need for custom lazy loading.

### Migration Notes (v1 → v2)

- **Deprecated:** `MethodologyPanel` component (row expansion)
- **New:** Info icon + Tooltip pattern
- **Data Contract:** `calculationMethod` and `dataSource` fields in `HoldingDto` remain unchanged
- **No Breaking Changes:** Backend API stays the same; only frontend UI pattern changes

## Change Log

- 2025-12-28: Story 2.5 implemented - Added methodology transparency with row expansion panels
- 2025-12-28: (Review Fix) Replaced plain empty state with shared Empty component from @workspace/ui with proper CTA
- 2025-12-28: (Code Review) Fixed 4 issues: prefers-reduced-motion support, React Fragment keys, import cleanup, animation constants
- 2025-12-29: (UX Rework) Replaced row expansion with tooltip-based methodology for space efficiency and zero layout shift
- 2025-12-29: Integrated Radix UI Tooltip via @workspace/ui; archived methodology-panel.tsx; all tests passing

## Dev Notes

- **Row Expansion:** Do not use a separate modal; use the native row expansion capability of TanStack Table to keep the context of the holding.
- **Animation:** Use `initial={{ height: 0, opacity: 0 }}` and `animate={{ height: 'auto', opacity: 1 }}` for the panel to ensure smooth layout shifts.
- **A11y:** Ensure the info icon is focusable and has a clear tooltip or aria-label for screen readers.

### Project Structure Notes

- **Web:** `apps/web/src/components/dashboard/` (Table) and `apps/web/src/components/common/` (Panel)
- **API:** `services/api/src/portfolios/`
- **Shared:** `packages/api-types/`

### References

- [Story 2.4: Unified Holdings Table](2-4-unified-holdings-table.md)
- [Architecture: Decision 3.1 (React Query)](../../architecture.md)
- [UX Design Specification](../../project-planning-artifacts/ux/ux-design-specification.md)
