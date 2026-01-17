# Story 4.1: Cross-Provider Asset Discovery & Intelligent Onboarding

Status: ready-for-dev

<!-- Note: Validation is complete. Applied roadmap pivot and UI logic refactoring. -->

## Story

As a user,
I want an intelligent asset search that scours multiple providers and allows me to request missing assets,
so that I can track any asset in the world without hitting "Not Found" dead ends.

## Acceptance Criteria

1. **Intelligent Initial Search**:
   - **Given** I am in the Add Asset modal.
   - **When** I type at least 2 characters.
   - **Then** the UI first searches the internal `assets` registry.

2. **Zero-Result Transition (The Pivot)**:
   - **Given** no results are found in the internal registry.
   - **When** I finish typing.
   - **Then** the UI displays an "Asset Not Found" prompt with a choice of Asset Class (VN Stock, US Stock, Crypto).

3. **External Discovery Pipeline**:
   - **Given** I have selected an Asset Class.
   - **When** the system triggers a deep search.
   - **Then** it queries external providers (Yahoo Finance for all global stocks, CoinGecko for Crypto) in parallel.

4. **Request & Queue Fallback**:
   - **Given** the external search also returns zero results.
   - **When** I click "Request Tracking".
   - **Then** the symbol is added to the `pending_assets` queue, and I receive a "Request Submitted" confirmation.

5. **Deduplication & Classification**:
   - **Given** multiple results from different providers.
   - **When** displaying the list.
   - **Then** results are deduped by symbol and grouped by their respective asset class.

## Tasks / Subtasks

- [ ] **Task 1: Backend Discovery Infrastructure**
  - [ ] Create `DiscoveryService` in `services/api/src/assets`.
  - [ ] Implement `searchExternal(symbol, assetClass)` using `Promise.allSettled`.
  - [ ] Add caching layer for external search results (60s TTL).
  - [ ] Implement `pending_assets` table and submission endpoint.
- [ ] **Task 2: UI Refactoring (`add-asset-modal.tsx`)**
  - [ ] Refactor state to handle `SEARCH -> NO_RESULTS_PICKER -> EXTERNAL_SEARCH -> QUEUE_SUBMIT` workflow.
  - [ ] Implement the "Select Asset Type" stepper when internal search fails.
  - [ ] Update `useSearchAssets` to support the multi-stage discovery flow.
- [ ] **Task 3: Provider Mapping & Normalization**
  - [ ] Map Yahoo Finance/CoinGecko search results to `@workspace/shared-types` `Assets` structure.
  - [ ] Ensure `logo_url` and `market` fields are populated from provider metadata.

## Dev Notes

- **API Strategy**: Use `yahoo-finance2.search()` for all global stocks (VN, US, and any other market) and CoinGecko's `/search` for crypto.
- **Global Stock Discovery**: Yahoo Finance is used as the universal provider for any nation's stock. Mapping logic (e.g., `.VN` suffix) is applied based on the detected or selected market.
- **Security**: Mandatory CSP headers check (Epic 3 debt) before finishing this story if external logo URLs are used.

### Project Structure Notes

- **Service**: `services/api/src/assets/discovery.service.ts`
- **Controller**: `services/api/src/assets/assets.controller.ts` (new endpoints)
- **UI**: `apps/web/src/features/transactions/add-asset-modal.tsx`

### References

- [Source: _bmad-output/epics.md#Story 4.1]
- [Source: apps/web/src/features/transactions/add-asset-modal.tsx] (Target for refactor)

## Dev Agent Record

### Agent Model Used

BMad-Bob-SM-Audit-v6

### Completion Notes List

- Applied roadmap pivot (Story 4.1 + 4.2 synthesis as requested).
- Defined explicit search fallback state machine.
- Linked to specific file for UI refactoring.
- **[Review Fix]** Replaced floating point math with string-based display logic in modal.
- **[Review Fix]** Added exponential backoff for CoinGecko API integration.
- **[Review Fix]** Added unit tests for provider mapping logic.
- **[Review Fix]** Enabled Next.js image optimization for CoinGecko assets.
