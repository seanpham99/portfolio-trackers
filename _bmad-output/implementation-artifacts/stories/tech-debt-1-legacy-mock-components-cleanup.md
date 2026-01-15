# Tech Debt 1: Legacy Mock Components Cleanup

Status: done

## Story

As a Developer,
I want to refactor or remove the remaining legacy mock-dependent components (NotificationCenter, LiveIndicator, TransactionHistory),
So that the codebase has no dependencies on the deprecated `portfolio-store` Zustand mock state, and all data flows through the real API.

## Background

During Story 2-9 (User Preferences & Mock Cleanup), three components were identified but not migrated due to scope constraints:

1. **notification-center.tsx** - Uses mock notification system
2. **live-indicator.tsx** - Uses mock price update simulation
3. **transaction-history.tsx** - Uses mock transaction data

These components still depend on `@/stores/portfolio-store`, which was intended to be deleted in Story 2-9 but remains because of these dependencies.

## Technical Context

**Current Dependencies:**

```typescript
// apps/web/src/components/notification-center.tsx
import { useNotifications, portfolioStore, type Notification } from "@/stores/portfolio-store";
- Uses: markAllNotificationsRead(), markNotificationRead()
- Mock notifications: price_alert, portfolio_change, market_movement

// apps/web/src/components/live-indicator.tsx
import { usePortfolioStore, portfolioStore } from "@/stores/portfolio-store";
- Uses: lastUpdated, settings.refreshInterval, updatePrices()
- Simulates "live" price updates with client-side intervals

// apps/web/src/features/transactions/transaction-history.tsx
import { usePortfolioStore } from "@/stores/portfolio-store";
- Uses: transactions array
- Shows mock buy/sell transaction history
```

**Impact:**

- Users see fake notification bubbles that don't reflect real system events
- "Live" indicator is misleading - no actual price data is updating
- Transaction history doesn't show real database records from `transactions` table
- Cannot complete deletion of `portfolio-store.ts` and `mock-data.ts`

## Acceptance Criteria

### Option A: Full Refactor (Recommended for Production MVP)

1. **NotificationCenter Component:**
   - Create backend notification system (WebSocket or polling-based)
   - Implement `GET /me/notifications` endpoint
   - Implement `PATCH /me/notifications/:id/read` endpoint
   - Refactor component to use React Query hooks
   - Support real notification types (price alerts, portfolio milestones, system updates)

2. **LiveIndicator Component:**
   - Connect to real-time price update system (Story 3-6: Basic Price Pipeline)
   - Show actual data freshness from last API update
   - Remove mock `updatePrices()` simulation
   - Use WebSocket connection status or last query timestamp

3. **TransactionHistory Component:**
   - Create `useTransactions()` React Query hook
   - Connect to `GET /transactions?portfolio_id={id}` endpoint
   - Display real transaction records from database
   - Add pagination/infinite scroll for large histories

4. **Legacy Cleanup:**
   - Delete `apps/web/src/stores/portfolio-store.ts`
   - Delete `apps/web/src/stores/mock-data.ts`
   - Remove all Zustand dependencies from `package.json` (if no longer used)

### Option B: Minimal Removal (Quick Path)

1. **Component Removal:**
   - Remove `<NotificationCenter />` from header/layout (Epic 8 will add real notifications)
   - Remove `<LiveIndicator />` from header/layout (Story 3-6 will add real-time pricing)
   - Keep `<TransactionHistory />` but gate it behind a feature flag or remove from routes

2. **Legacy Cleanup:**
   - Delete `apps/web/src/stores/portfolio-store.ts`
   - Delete `apps/web/src/stores/mock-data.ts`
   - Remove components from active routes/layouts

## Recommended Approach

**For MVP v1.0:** Option B (Minimal Removal)

- These features are not core to the portfolio tracking functionality
- Real notification system is scoped for Epic 8 (Alerts & Notifications)
- Real-time pricing is scoped for Story 3-6 (Basic Price Pipeline)
- Transaction history exists on Asset Detail page with real data

**For Post-MVP:** Option A (Full Refactor)

- Implement proper notification infrastructure
- Add WebSocket support for real-time updates
- Build comprehensive transaction history with filtering

## Dependencies

### Blockers

- None - can be completed independently

### Related Stories

- **Story 2-9:** User Preferences & Mock Cleanup - identified these components
- **Story 3-6:** Basic Price Pipeline - provides real price update infrastructure
- **Epic 8:** Alerts & Notifications - provides notification backend

## Tasks/Subtasks (Option B - Recommended)

- [x] **Task 1: Audit Component Usage**
  - [x] Search codebase for `<NotificationCenter />` imports
  - [x] Search codebase for `<LiveIndicator />` imports
  - [x] Search codebase for `<TransactionHistory />` imports
  - [x] Document which routes/layouts use these components

- [x] **Task 2: Remove Components from Active Routes**
  - [x] Remove NotificationCenter from header/navigation
  - [x] Remove LiveIndicator from header/navigation
  - [x] Remove TransactionHistory from any active pages (if present)

- [x] **Task 3: Delete Legacy Files**
  - [x] Delete `apps/web/src/stores/portfolio-store.ts` (already deleted in Story 2-9)
  - [x] Delete `apps/web/src/stores/mock-data.ts` (already deleted in Story 2-9)
  - [x] Delete `apps/web/src/components/notification-center.tsx`
  - [x] Delete `apps/web/src/components/live-indicator.tsx`
  - [x] Delete `apps/web/src/features/transactions/transaction-history.tsx`

- [x] **Task 4: Verify Build & Tests**
  - [x] Run `pnpm run type-check` - verify no import errors ✅
  - [x] Run `pnpm run lint` - clean output ✅
  - [x] Run `pnpm test` - all tests passing (13/13 analytics tests) ✅
  - [x] Manual verification: app loads without errors ✅

- [x] **Task 5: Update Documentation**
  - [x] Add completion notes to tech debt story
  - [x] Update sprint-status.yaml to mark as done
  - [x] Document implementation details and validation results

## Estimated Effort

**Option B:** 1-2 hours (simple removal, no new features)

## Priority

**Low-Medium** - Not blocking MVP functionality, but important for code cleanliness and removing user confusion from fake features.

## Notes

- Story 2-9 documentation clearly states: "These components should be migrated to API-based state in future stories"
- Current components create false impressions of real-time features that don't exist yet
- Cleaner to remove and add back properly in later epics than to leave half-working mocks

## Status Updates

### 2025-12-30 - Story Created

- Identified during Story 3-1 code review
- Three components still depend on deprecated portfolio-store
- Blocking final cleanup from Story 2-9
- Recommended approach: Simple removal (Option B) for v1.0, proper implementation in Epic 8

### 2025-12-30 - Story Completed (Option B)

**Components Removed:**

- ✅ Removed `<NotificationCenter />` from `_protected._layout.tsx` header
- ✅ Removed `<LiveIndicator />` from `_protected._layout.tsx` header
- ✅ Replaced `<TransactionHistory />` in `_protected._layout.history.tsx` with placeholder message

**Files Deleted:**

- ✅ `apps/web/src/components/notification-center.tsx`
- ✅ `apps/web/src/components/live-indicator.tsx`
- ✅ `apps/web/src/features/transactions/transaction-history.tsx`
- ✅ `apps/web/src/stores/portfolio-store.ts` (already deleted in Story 2-9)
- ✅ `apps/web/src/stores/mock-data.ts` (already deleted in Story 2-9)

**Validation:**

- ✅ TypeScript compilation: `pnpm run type-check` passing
- ✅ No import errors or missing dependencies
- ✅ Dev server runs without errors
- ✅ All analytics tests passing (13/13)

**Notes:**

- History page now shows simple message directing users to asset detail pages
- Real notification system will be implemented in Epic 8
- Real-time price updates will come with Story 3-6
- Transaction history functionality already exists on individual asset detail pages with real DB data

**Technical Details:**

Modified Files:

1. `apps/web/src/routes/_protected._layout.tsx`
   - Removed imports: `LiveIndicator`, `NotificationCenter`
   - Removed components from header navigation
   - Simplified user profile section

2. `apps/web/src/routes/_protected._layout.history.tsx`
   - Removed `TransactionHistory` import and usage
   - Added placeholder message with guidance to asset detail pages

Deleted Files:

1. `apps/web/src/components/notification-center.tsx` (165 lines)
2. `apps/web/src/components/live-indicator.tsx` (48 lines)
3. `apps/web/src/features/transactions/transaction-history.tsx` (115 lines)

**Impact Assessment:**

- No breaking changes to core functionality
- User experience improved by removing misleading "fake" features
- Codebase now 100% API-driven with no client-side mock state
- Reduces confusion for developers about data sources
- Sets clean foundation for Epic 8 notification implementation

**Cleanup Complete:** All mock-dependent components successfully removed from active codebase.
