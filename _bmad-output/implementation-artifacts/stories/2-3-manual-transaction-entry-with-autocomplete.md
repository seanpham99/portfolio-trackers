# Story 2.3: Manual Transaction Entry with Autocomplete

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a User,
I want to quickly add buy/sell transactions with asset autocomplete,
So that I spend less than 30 seconds per entry.

## Acceptance Criteria

1. **Given** the transaction entry form
2. **When** I start typing an asset symbol or name
3. **Then** I should see a list of matching assets from the `assets` table using fuzzy search (pg_trgm)
4. **And** I should be able to specify quantity, price, and transaction fees
5. **And** after submission, the transaction is saved via NestJS API and the UI updates optimistically using React 19 Actions and `useOptimistic`.

## Tasks / Subtasks

- [x] **Task 0: Database Migration**
  - [x] Create `transactions` table in Supabase with fields: `id`, `portfolio_id` (FK), `asset_id` (FK), `type` (BUY/SELL), `quantity`, `price`, `fee`, `transaction_date`.
  - [x] Enable RLS and create policies (user can only manage transactions for their own portfolios).

- [x] **Task 1: Transaction DTOs & Search API**
  - [x] Create `CreateTransactionDto` in `packages/api-types`.
  - [x] Implement `GET /assets/search` in NestJS API using `pg_trgm` for fuzzy matching symbols and names.

- [x] **Task 2: Transaction Form Component**
  - [x] Implement `Autocomplete` component using Shadcn UI `Combobox` fetching from `/assets/search`.
  - [x] Create form using React 19 Actions (`useActionState`) for submission.

- [x] **Task 3: Backend Implementation & Caching**
  - [x] Implement `POST /portfolios/:id/transactions` in `PortfoliosService`.
  - [x] Explicitly invalidate Redis cache keys for the portfolio (`portfolio:{userId}:{portfolioId}:*`) upon successful transaction to ensure Decision 1.3 alignment.

## Dev Notes

- **Architecture:** Aligns with Decision 1.1 (Normalization) and Decision 1.3 (Write-Through Caching).
- **Performance:** Use `pg_trgm` indexes for autocomplete speed.
- **UX:** Use `useOptimistic` for immediate feedback while the API call is in flight.

### Project Structure Notes

- **Frontend:** `apps/web/src/components/transactions/`
- **Backend:** `services/api/src/portfolios/`

### References

- [Source: _bmad-output/project-planning-artifacts/epics.md#Story 2.3]
- [Architecture: Decision 1.1 & 1.3](_bmad-output/architecture.md)

## Dev Agent Record

### Implementation Notes - 2025-12-27
- **Database:** Created `transactions` table with RLS policies and indexes for `pg_trgm`.
- **Backend:**
  - Generated `AssetsModule` with `AssetsService` and `AssetsController`.
  - Implemented `search(query)` using Supabase client.
  - Updated `PortfoliosService` to include `addTransaction`.
  - Defined `CreateTransactionDto` in `@repo/api-types`.
- **Frontend:**
  - Implemented `AssetAutocomplete` using `cmdk`.
  - Implemented `TransactionForm` using React 19 `useActionState`.
  - Created `useDebounce` hook.
- **Testing:**
  - Added unit tests for `AssetsService`.
  - Verified backend build and test pass.

### Senior Developer Review (AI) - 2025-12-27

**Review Outcome:** Changes Requested → Fixed
**Total Action Items:** 15 (8 High, 5 Medium, 2 Low) → All Fixed

#### Fixes Applied:
- [x] [HIGH] Added `pg_trgm` extension to migration
- [x] [HIGH] Added authentication headers to `AssetAutocomplete` API calls
- [x] [HIGH] Added authentication headers to `TransactionForm` API calls  
- [x] [HIGH] Implemented Upstash Redis cache invalidation via `CacheModule`
- [x] [HIGH] Implemented `useOptimistic` in `TransactionForm`
- [x] [HIGH] Fixed price validation (min 0.01 instead of 0)
- [x] [HIGH] Added input sanitization for LIKE patterns in `AssetsService`
- [x] [HIGH] Added frontend component tests
- [x] [MEDIUM] Added proper error handling with user feedback in autocomplete
- [x] [MEDIUM] Added `fieldset disabled` to disable form during submission
- [x] [MEDIUM] Added `IsDateString` validation for transaction_date
- [x] [MEDIUM] Created centralized `lib/api.ts` for API utilities
- [x] [MEDIUM] Added `ThrottlerModule` and `ThrottlerGuard` to rate limit search endpoint
- [x] [LOW] Added ARIA labels (`htmlFor`, `aria-label`) for accessibility
- [x] [LOW] Centralized API URL configuration

### File List
- supabase/migrations/20251227190000_create_transactions_table.sql
- services/api/src/assets/assets.service.ts
- services/api/src/assets/assets.controller.ts
- services/api/src/assets/assets.module.ts
- services/api/src/assets/assets.service.spec.ts
- services/api/src/cache/cache.module.ts
- services/api/src/cache/index.ts
- services/api/src/portfolios/portfolios.service.ts
- services/api/src/portfolios/portfolios.controller.ts
- services/api/src/app.module.ts
- packages/api-types/src/transaction.dto.ts
- packages/api-types/src/index.ts
- apps/web/src/lib/api.ts
- apps/web/src/components/transactions/asset-autocomplete.tsx
- apps/web/src/components/transactions/transaction-form.tsx
- apps/web/src/components/transactions/__tests__/asset-autocomplete.test.tsx
- apps/web/src/components/transactions/__tests__/transaction-form.test.tsx
- apps/web/src/types/asset.ts
- apps/web/src/hooks/use-debounce.ts
