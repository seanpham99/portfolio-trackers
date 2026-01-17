# Story 4.2: Asset Request Queue & Transaction Logic Hardening

Status: done

<!-- Note: Scope expanded to include critical fixes for Transaction schema alignment (Fees, Exchange Rates, Generated Totals) based on user feedback. -->

## Story

As a user,
I want strict transaction recording that captures all cost details (fees, exchange rates) and a reliable fallback for missing assets,
so that my portfolio calculations are financially accurate and I'm never blocked by missing data.

## Acceptance Criteria

1. **Comprehensive Transaction Capture**:
   - **Given** the "Add Transaction" or "Add Asset" form.
   - **When** creating a transaction.
   - **Then** the user provides: `Quantity`, `Price`, `Fee` (optional, default 0), `Transaction Date` (default now), `Notes` (optional), and `Exchange Rate` (default 1).
   - **And** the `Total` cost is **NOT** sent by the client, but calculated by the Database (`GENERATED ALWAYS`).

2. **Schema Alignment & Generated Columns**:
   - **Given** the `public.transactions` table schema.
   - **When** a record is inserted.
   - **Then** the database automatically calculates `total = (quantity * price) + fee`.
   - **And** the `exchange_rate` is stored for multi-currency derivation.

3. **Asset Request Logic (Verification)**:
   - **Given** the `pending_assets` queue (scaffolded in Story 4.1).
   - **When** a user requests a missing asset.
   - **Then** the request is successfully persisted to the database with user metadata.
   - **And** the user receives clear feedback (e.g., "Request Queued").

4. **Multi-Currency Prep**:
   - **Given** a transaction involving different currencies.
   - **When** saving.
   - **Then** the `exchange_rate` field is correctly populated (passed from UI or fetched).

## Tasks / Subtasks

- [x] **Task 1: Shared Types & Schema alignment**
  - [x] Update `Transaction` DTOs in `@workspace/shared-types` to include `fee`, `exchange_rate`, `notes`.
  - [x] Mark `total` as Read-Only / optional in Input DTOs (since DB handles it).
  - [x] Verify `public.transactions` table matches the reference schema (using `supabase gen types` if needed).

- [x] **Task 2: Backend Refactor (`services/api`)**
  - [x] Update `PortfoliosService.addTransaction` to accept new fields.
  - [x] **Critical**: Remove any manual `total` calculation in code; let DB generated column handle it.
  - [x] Ensure `exchange_rate` defaults to 1 if not provided.

- [x] **Task 3: Frontend Form Update (`apps/web`)**
  - [x] Update `AddAssetModal` (and `AddTransactionDialog` if separate) to include fields:
    - `Fee` (Numeric input)
    - `Transaction Date` (DatePicker)
    - `Notes` (Textarea)
    - `Exchange Rate` (Numeric, maybe in an "Advanced" accordion or smart default).
  - [x] Remove `Total` field calculation **submission** (can still show estimated total in UI for UX).

- [x] **Task 4: Asset Request Queue Polish**
  - [x] Verify `pending_assets` submission endpoint works as expected (from Story 4.1).
  - [x] Ensure UI correctly triggers this flow when Asset Discovery fails.

## Dev Notes

### Database Schema Reference

```sql
create table public.transactions (
  id uuid not null default gen_random_uuid (),
  ...
  fee numeric null default 0,
  total numeric GENERATED ALWAYS as (((quantity * price) + fee)) STORED null,
  exchange_rate numeric null default 1,
  ...
);
```

### Architecture Constraints

- **Financial Math**: The DB is the source of truth for `total`. Do not attempt to override it.
- **DTOs**: Ensure `CreateTransactionDto` matches the strict schema requirements.
- **Handling Store**: When using `useMutation`, ensure the cache invalidation triggers a refetch so the frontend gets the DB-calculated `total`.

### References

- [Source: User Request](Conversation) - Schema definition.
- [Source: apps/web/src/features/transactions/add-asset-modal.tsx]
- [Source: services/api/src/portfolios/portfolios.service.ts]

## Dev Agent Record

### Agent Model Used

BMad-Workflow-Executor

### Completion Notes List

- Incorporating specific user request to fix Transaction logic (Fields + Generated Columns) into this story.
- Prioritizing Schema Alignment for correctness.
- Implemented Task 1: Updated `transaction.dto.ts` and rebuilt `@workspace/shared-types`.
- Implemented Task 2: Refactored `PortfoliosService` to handle SELL logic specifically (ignoring `total` from DB as it incorrectly adds fee for SELLs) while ensuring `total` is generated on INSERT.
- Implemented Task 3: Updated `AddAssetModal` with new fields (Fee, Ex Rate, Date, Notes) and updated hook.
- Implemented Task 4: Verified Asset Request Queue logic in `discovery.service.ts` and UI integration.
- **Code Review Fixes**:
  - Installed `decimal.js` and refactored `PortfoliosService` (calculateHoldings, getAssetDetails) to use precise financial math.
  - Hardened `AddAssetModal` validation for Fee/ExRate to strictly numeric strings.
  - Updated `DiscoveryService` to throw `ConflictException` for duplicate requests.
  - **Code Review Fixes (Round 2)**:
    - Added `sonner` toast error handling to `AddAssetModal` (High Severity fix).
    - Improved Exchange Rate UX with helper text (Medium Severity fix).
    - Fixed stale date default on form reset (Low Severity fix).
    - _Note_: DB Schema mismatch for `total` handled by Service layer override.
