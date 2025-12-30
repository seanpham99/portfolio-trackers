# Story 2.4: Unified Holdings Table

Status: done

## Dev Agent Record

### Implementation Plan

- [x] **Task 1: Backend Aggregation Endpoint**
  - [x] Explore existing Portfolios/Transactions modules
  - [x] Create/Update DTOs for Holdings response
  - [x] Implement Service method to aggregate holdings
  - [x] Implement Controller endpoint
  - [x] Add Tests
- [x] **Task 2: Frontend Data Hook**
  - [x] Create `useHoldings` custom hook in `apps/web/src/api/hooks/`
  - [x] Configure `refetchInterval: 60000`
- [x] **Task 3: Unified Table Component**
  - [x] Create `UnifiedHoldingsTable` using TanStack Table
  - [x] Columns: Symbol, Name, Type (Badge), Price, 24h %, Value, P/L
  - [x] **AC 5: Add filtering by Asset Class**

### Debug Log

_(No entries)_

### Completion Notes

- Implemented `GET /portfolios/holdings` with in-memory aggregation of transactions (using Weighted Average Cost Basis).
- **Core Improvements (Code Review):**
  - Refactored `HoldingDto` and `Holding` interface into shared `@workspace/api-types`.
  - Updated `Asset` type in frontend to extend `Database['public']['Tables']['assets']['Row']` from `@workspace/database-types`.
  - Implemented interactive filtering by Asset Class (All, VN, US, Crypto) in the Holdings table.
- Setup `apps/web/src/api` structure with `client.ts` and `hooks/use-holdings.ts`.
- Configured React Query `QueryClientProvider` in `root.tsx` with 60s stale time.
- Refactored `UnifiedHoldingsTable` to use `useReactTable` and fetch data via `useHoldings`.
- Added unit tests for Backend Service/Controller and Frontend Component (Vitest).

## File List

- packages/api-types/src/holding.dto.ts
- packages/api-types/src/index.ts
- services/api/src/portfolios/portfolios.service.ts
- services/api/src/portfolios/portfolios.service.spec.ts
- services/api/src/portfolios/portfolios.controller.ts
- services/api/src/portfolios/portfolios.controller.spec.ts
- apps/web/src/types/asset.ts
- apps/web/src/api/client.ts
- apps/web/src/api/hooks/use-holdings.ts
- apps/web/src/components/dashboard/unified-holdings-table.tsx
- apps/web/src/components/dashboard/unified-holdings-table.test.tsx
- apps/web/src/components/transactions/transaction-form.tsx
- apps/web/src/components/transactions/asset-autocomplete.tsx
- apps/web/src/root.tsx
- apps/web/vite.config.ts

## Change Log

- 2025-12-26: Initial implementation.
- 2025-12-27: (Review Fix) Unified types across monorepo and implemented filtering logic.

## Tasks / Subtasks

- [x] **Task 1: Backend Aggregation Endpoint**
  - [x] Implement `GET /portfolios/holdings` in NestJS which joins `transactions` and `assets` to return a flat list of current holdings.
  - [x] Include calculated `avg_cost` and `total_quantity` in the response.

- [x] **Task 2: Frontend Data Hook**
  - [x] Create `useHoldings` custom hook in `apps/web/src/api/hooks/` using `@tanstack/react-query`.
  - [x] Configure `refetchInterval: 60000` (60 seconds).

- [x] **Task 3: Unified Table Component**
  - [x] Create `UnifiedHoldingsTable` using TanStack Table.
  - [x] Columns: Symbol, Name, Type (Badge), Price, 24h %, Value, P/L.

## Dev Notes

- **Design:** Clean rows, hover effects. Red/Green text for P/L.
- **Performance:** Use `useMemo` for table instance and filtering logic.

### Project Structure Notes

- **Frontend:** `apps/web/src/components/dashboard/unified-holdings-table.tsx`
- **Backend:** `services/api/src/portfolios/`

### References

- [Design: Unified Dashboard Concept](../project-planning-artifacts/ux/ux-design-specification.md)
- [Architecture: Decision 3.1 (React Query)](_bmad-output/architecture.md)
